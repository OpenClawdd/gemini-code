/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { performMission } from '@google/gemini-cli-core';
import process from 'node:process';
import {
  activateCockpitMission,
  setCurrentPhase,
} from '../cockpit/CockpitState.js';
import { MissionRunner, formatMissionReport } from './mission/MissionRunner.js';
import type { MissionMode } from './mission/types.js';
import {
  CommandKind,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

/**
 * Command to run a mission loop from a user request.
 */
export const missionCommand: SlashCommand = {
  name: 'mission',
  description: 'Run a mission loop, or use plan for a brief only.',
  kind: CommandKind.BUILT_IN,
  subCommands: [
    {
      name: 'plan',
      description: 'Generate a structured mission brief without execution.',
      kind: CommandKind.BUILT_IN,
      action: (context, args) => runMissionCommand(context, args, 'plan'),
    },
    {
      name: 'ship',
      description:
        'Run a mission loop with ship intent after validation and confirmation.',
      kind: CommandKind.BUILT_IN,
      action: (context, args) => runMissionCommand(context, args, 'ship'),
    },
  ],
  action: async (
    context,
    userRequest: string,
  ): Promise<SlashCommandActionReturn> => runMissionCommand(
      context,
      userRequest,
      parseMissionMode(userRequest),
    ),
};

export function parseMissionMode(args: string): MissionMode {
  const trimmed = args.trim();
  if (/^plan(?:\s|$)/i.test(trimmed)) {
    return 'plan';
  }
  if (/^ship(?:\s|$)/i.test(trimmed)) {
    return 'ship';
  }

  return 'execute';
}

export function parseMissionTask(args: string, mode: MissionMode): string {
  const trimmed = args.trim();
  if (mode === 'plan') {
    return trimmed.replace(/^plan(?:\s+|$)/i, '').trim();
  }
  if (mode === 'ship') {
    return trimmed.replace(/^ship(?:\s+|$)/i, '').trim();
  }

  return trimmed;
}

async function runMissionCommand(
  context: Parameters<NonNullable<SlashCommand['action']>>[0],
  args: string,
  requestedMode: MissionMode,
): Promise<SlashCommandActionReturn> {
  const task = parseMissionTask(args, requestedMode);

  if (!task) {
    return {
      type: 'message',
      messageType: 'error',
      content:
        'Please provide a request. Usage: /mission <task>, /mission plan <task>, or /mission ship <task>',
    };
  }

  activateMissionContext(context, task);

  if (requestedMode === 'plan') {
    return performMission(task);
  }

  const config = context.services.agentContext?.config;
  if (!config) {
    return {
      type: 'message',
      messageType: 'error',
      content:
        'Mission Runner requires an initialized Gemini CLI config before it can inspect the repo.',
    };
  }

  setCurrentPhase('Inspect');
  const runner = new MissionRunner({
    task,
    mode: requestedMode,
    cwd: config.getProjectRoot?.() || config.getTargetDir?.() || process.cwd(),
    shellExecutionConfig: config.getShellExecutionConfig(),
    useInteractiveShell: config.getEnableInteractiveShell(),
  });

  const report = await runner.run();
  setCurrentPhase(report.limitation ? 'Next Action' : 'Review');

  return {
    type: 'message',
    messageType: 'info',
    content: formatMissionReport(report),
  };
}

function activateMissionContext(
  context: Parameters<NonNullable<SlashCommand['action']>>[0],
  task: string,
): void {
  activateCockpitMission(task);
  context.services.agentContext?.config
    .getPolicyEngine()
    .setAutopilotMission?.(task);
}
