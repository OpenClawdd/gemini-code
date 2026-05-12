/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { classifyCommand, CommandClass } from './command-hygiene.js';

export enum AutopilotCommandDecision {
  ALLOW = 'allow',
  SUPPRESS = 'suppress',
  ASK = 'ask',
  DENY = 'deny',
}

export interface AutopilotCommandGateInput {
  mission: string;
  command: string;
}

export interface AutopilotCommandGateResult {
  decision: AutopilotCommandDecision;
  reason: string;
}

const broadTestPatterns = [
  /^npm\s+test(?:\s|$)/i,
  /^npm\s+run\s+test(?::\w+)?(?:\s|$)/i,
  /^npm\s+run\s+format(?:\s|$)/i,
];

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function missionProtectsCore(mission: string): boolean {
  const normalizedMission = mission.toLowerCase();
  return (
    normalizedMission.includes('without touching core') ||
    normalizedMission.includes('do not touch core') ||
    normalizedMission.includes("don't touch core")
  );
}

function commandTargetsCore(command: string): boolean {
  return /(^|\s)(packages\/core|packages\\core|core)(\s|$)/i.test(command);
}

export function evaluateAutopilotCommand({
  mission,
  command,
}: AutopilotCommandGateInput): AutopilotCommandGateResult {
  const normalizedCommand = normalize(command);

  if (!normalizedCommand) {
    return {
      decision: AutopilotCommandDecision.ASK,
      reason: 'No command to evaluate.',
    };
  }

  const classification = classifyCommand(normalizedCommand);

  if (classification === CommandClass.DANGEROUS) {
    return {
      decision: AutopilotCommandDecision.DENY,
      reason: 'Command is classified as dangerous and stays behind the gate.',
    };
  }

  if (
    missionProtectsCore(mission) &&
    normalizedCommand.startsWith('git diff') &&
    commandTargetsCore(normalizedCommand)
  ) {
    return {
      decision: AutopilotCommandDecision.SUPPRESS,
      reason: 'Mission says not to touch core; skip core-scoped inspection.',
    };
  }

  if (broadTestPatterns.some((pattern) => pattern.test(normalizedCommand))) {
    return {
      decision: AutopilotCommandDecision.SUPPRESS,
      reason: 'Tiny docs-only mission does not need command ceremony.',
    };
  }

  if (classification === CommandClass.SIMPLE_READ_ONLY) {
    return {
      decision: AutopilotCommandDecision.ALLOW,
      reason: 'Simple read-only commands are auto-allowed for efficiency.',
    };
  }

  if (classification === CommandClass.COMPOUND_READ_ONLY) {
    return {
      decision: AutopilotCommandDecision.ASK,
      reason:
        'Compound commands (using &&, ||, |, >) require permission even if read-only.',
    };
  }

  return {
    decision: AutopilotCommandDecision.ASK,
    reason: 'Command is not covered by the GC autopilot gate yet.',
  };
}
