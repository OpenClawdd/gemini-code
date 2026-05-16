/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ShellExecutionService,
  type ShellExecutionConfig,
} from '@google/gemini-cli-core';
import {
  classifyMissionCommand,
  isHighRiskMission,
  taskNeedsFileEdits,
} from './policy.js';
import type {
  CommandResult,
  MissionMode,
  MissionPhase,
  MissionReport,
  MissionState,
  RepoSnapshot,
  RiskLevel,
} from './types.js';

export interface MissionRunnerConfig {
  task: string;
  mode: MissionMode;
  cwd: string;
  shellExecutionConfig: ShellExecutionConfig;
  useInteractiveShell: boolean;
}

const INSPECTION_COMMANDS = [
  'git rev-parse --abbrev-ref HEAD',
  'git status -sb',
  'git diff --stat',
  'git diff --check',
  'ls',
] as const;

export class MissionRunner {
  private state: MissionState = 'compile';
  private readonly commandResults: CommandResult[] = [];
  private phases: MissionPhase[] = [];
  private risk: RiskLevel = 'low';
  private riskSummary = 'No destructive intent detected.';
  private snapshot: RepoSnapshot | undefined;
  private limitation: string | undefined;

  constructor(private readonly config: MissionRunnerConfig) {}

  async run(): Promise<MissionReport> {
    this.state = 'risk-scan';
    this.scanRisk();

    this.state = 'inspect';
    this.snapshot = await this.inspectRepo();

    this.state = 'plan';
    this.phases = this.derivePhases();

    this.state = 'execute';
    for (const phase of this.phases) {
      for (const action of phase.actions) {
        if (action.type === 'RUN_SHELL' && action.command) {
          await this.runReadOnlyCommand(action.command);
          continue;
        }

        if (action.type === 'EDIT_FILE') {
          this.limitation =
            'EDIT_FILE execution is not wired to the existing Gemini file-edit tool path yet. Mission Runner stopped before validation; no files were edited.';
          this.state = 'done';
          return this.buildReport();
        }

        if (action.type === 'VALIDATE') {
          this.limitation =
            'Validation is skipped until EDIT_FILE connects to the existing Gemini file-edit tool path.';
          this.state = 'done';
          return this.buildReport();
        }
      }
    }

    this.state = this.config.mode === 'ship' ? 'ship' : 'review';
    if (this.config.mode === 'ship') {
      this.limitation =
        'Ship intent recorded, but commit/push did not run because validation only happens after real edits are wired and explicitly confirmed.';
    }

    this.state = 'done';
    return this.buildReport();
  }

  private scanRisk(): void {
    if (isHighRiskMission(this.config.task)) {
      this.risk = 'high';
      this.riskSummary =
        'High-risk destructive wording detected. Mission Runner will only run read-only inspection commands.';
      return;
    }

    this.risk = 'low';
    this.riskSummary =
      'Low risk: Phase 1 is limited to read-only repo inspection.';
  }

  private async inspectRepo(): Promise<RepoSnapshot> {
    const [branch, status, diffStat, diffCheck, rootListing] =
      await Promise.all(
        INSPECTION_COMMANDS.map((command) => this.runReadOnlyCommand(command)),
      );

    return {
      branch: branch.stdout || 'unknown',
      status: status.stdout,
      diffStat: diffStat.stdout,
      diffCheck,
      rootListing: rootListing.stdout,
      dirty: status.stdout
        .split('\n')
        .some((line) => line.trim() && !line.startsWith('##')),
    };
  }

  private derivePhases(): MissionPhase[] {
    const phases: MissionPhase[] = [
      {
        title: 'Repo inspection',
        actions: [
          {
            type: 'RUN_SHELL',
            command: 'git status -sb',
            reason: 'Confirm working tree state.',
          },
          {
            type: 'RUN_SHELL',
            command: 'git diff --stat',
            reason: 'Summarize any local changes.',
          },
        ],
      },
      {
        title: 'Diff hygiene',
        actions: [
          {
            type: 'RUN_SHELL',
            command: 'git diff --check',
            reason: 'Check for whitespace and conflict marker issues.',
          },
        ],
      },
    ];

    if (taskNeedsFileEdits(this.config.task)) {
      phases.splice(1, 0, {
        title: 'Edit',
        actions: [
          {
            type: 'EDIT_FILE',
            reason: `Apply the requested change: ${this.config.task}`,
          },
        ],
      });

      phases.push({
        title: 'Validation',
        actions: [
          {
            type: 'VALIDATE',
            reason: 'Run focused validation after edits.',
          },
        ],
      });
    }

    return phases;
  }

  private async runReadOnlyCommand(command: string): Promise<CommandResult> {
    const policy = classifyMissionCommand(command);
    if (policy.approval !== 'auto') {
      const blocked: CommandResult = {
        command,
        stdout: '',
        stderr: policy.reason,
        exitCode: 1,
      };
      this.commandResults.push(blocked);
      return blocked;
    }

    const controller = new AbortController();
    const handle = await ShellExecutionService.execute(
      command,
      this.config.cwd,
      () => {},
      controller.signal,
      this.config.useInteractiveShell,
      this.config.shellExecutionConfig,
    );
    const result = await handle.result;
    const commandResult: CommandResult = {
      command,
      stdout: result.output.trim(),
      stderr: result.error?.message ?? '',
      exitCode: result.exitCode,
    };
    this.commandResults.push(commandResult);
    return commandResult;
  }

  private buildReport(): MissionReport {
    return {
      task: this.config.task,
      mode: this.config.mode,
      state: this.state,
      risk: this.risk,
      riskSummary: this.riskSummary,
      snapshot: this.snapshot,
      phases: this.phases,
      commandResults: this.commandResults,
      limitation: this.limitation,
    };
  }
}

export function formatMissionReport(report: MissionReport): string {
  const lines = [
    'Mission Runner',
    '',
    `Task: ${report.task}`,
    `Mode: ${report.mode}`,
    `Risk: ${report.risk} - ${report.riskSummary}`,
  ];

  if (report.snapshot) {
    lines.push('', 'Repo snapshot:', `- Branch: ${report.snapshot.branch}`);
    lines.push(`- Working tree: ${report.snapshot.dirty ? 'dirty' : 'clean'}`);
    if (report.snapshot.diffStat) {
      lines.push('- Diff stat:', indent(report.snapshot.diffStat));
    }
    if (report.snapshot.diffCheck.exitCode !== 0) {
      lines.push('- Diff check:', indent(report.snapshot.diffCheck.stdout));
    }
  }

  lines.push('', 'Execution plan:');
  for (const [index, phase] of report.phases.entries()) {
    lines.push(`${index + 1}. ${phase.title}`);
    for (const action of phase.actions) {
      const suffix = action.command ? ` (${action.command})` : '';
      lines.push(`   - ${action.type}: ${action.reason}${suffix}`);
    }
  }

  lines.push('', 'Commands executed:');
  for (const result of dedupeResults(report.commandResults)) {
    const status = result.exitCode === 0 ? 'ok' : `exit ${result.exitCode}`;
    lines.push(`- ${result.command}: ${status}`);
    if (result.stdout) {
      lines.push(indent(truncate(result.stdout, 1200)));
    }
    if (result.stderr) {
      lines.push(indent(truncate(result.stderr, 600)));
    }
  }

  if (report.limitation) {
    lines.push('', `Limitation: ${report.limitation}`);
  }

  return lines.join('\n');
}

function dedupeResults(results: CommandResult[]): CommandResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = `${result.command}\0${result.stdout}\0${result.stderr}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function indent(value: string): string {
  return value
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}\n  [truncated]`;
}
