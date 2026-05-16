/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandPolicy } from './types.js';

const SHELL_CONTROL_OPERATORS = /[|&;<>`$()]/;

const BLOCKED_PATTERNS: RegExp[] = [
  /\bcat\b.*\.(env|pem|key|p12|pfx|gpg|asc)\b/i,
  /\bprintenv\b/i,
  /\benv\b\s*\|/i,
  /\bgit\s+push\b/i,
  /\bgit\s+clean\b/i,
  /\bgit\s+reset\b/i,
  /\brm\b/i,
  /\bsudo\b/i,
  /\bchmod\s+777\b/i,
  /\bcurl\b.*(?:KEY|TOKEN|SECRET)/i,
  /\bwget\b.*(?:KEY|TOKEN|SECRET)/i,
];

const READ_ONLY_PATTERNS: RegExp[] = [
  /^git\s+status(?:\s+-sb)?$/i,
  /^git\s+diff\s+--stat$/i,
  /^git\s+diff\s+--check$/i,
  /^git\s+diff\s+--cached\s+--stat$/i,
  /^git\s+rev-parse\s+--abbrev-ref\s+HEAD$/i,
  /^ls(?:\s+-la|\s+-1)?$/i,
  /^pwd$/i,
];

export function classifyMissionCommand(command: string): CommandPolicy {
  const trimmed = command.trim();

  if (!trimmed) {
    return {
      approval: 'blocked',
      risk: 'high',
      reason: 'Empty shell command.',
    };
  }

  if (SHELL_CONTROL_OPERATORS.test(trimmed)) {
    return {
      approval: 'blocked',
      risk: 'high',
      reason:
        'Compound shell syntax is blocked in Mission Runner inspection commands.',
    };
  }

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      approval: 'blocked',
      risk: 'high',
      reason: 'Command is outside the read-only Mission Runner allowlist.',
    };
  }

  if (READ_ONLY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      approval: 'auto',
      risk: 'low',
      reason: 'Read-only repo inspection command.',
    };
  }

  return {
    approval: 'ask',
    risk: 'medium',
    reason:
      'Command is not in the Phase 1 read-only allowlist and will not auto-run.',
  };
}

export function isHighRiskMission(task: string): boolean {
  return /\b(delete all|drop table|wipe|nuke|force push|reset hard|purge|destroy)\b/i.test(
    task,
  );
}

export function taskNeedsFileEdits(task: string): boolean {
  return /\b(fix|add|implement|refactor|update|change|remove|rename|write|edit|create|delete)\b/i.test(
    task,
  );
}
