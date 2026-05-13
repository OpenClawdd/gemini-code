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

/**
 * Checks if the mission explicitly requests validation or testing.
 */
function isExplicitValidationRequested(mission: string): boolean {
  const normalized = mission.toLowerCase();
  return (
    /run\s+(?:validation\s+)?tests?/i.test(normalized) ||
    /verify/i.test(normalized) ||
    /with\s+(?:validation|tests?)/i.test(normalized) ||
    /check\s+with/i.test(normalized) ||
    /validation\s+tests?/i.test(normalized)
  );
}

/**
 * Checks if the mission is a tiny, low-risk task (docs or README only).
 */
function isTinyDocsOnlyMission(mission: string): boolean {
  const normalized = mission.toLowerCase();
  return (
    /fix\s+.*typo/i.test(normalized) ||
    /update\s+readme/i.test(normalized) ||
    /docs?-only/i.test(normalized) ||
    /no-code-change/i.test(normalized)
  );
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
    if (isExplicitValidationRequested(mission)) {
      return {
        decision: AutopilotCommandDecision.ASK,
        reason: 'Validation was explicitly requested by the user.',
      };
    }

    if (isTinyDocsOnlyMission(mission)) {
      return {
        decision: AutopilotCommandDecision.SUPPRESS,
        reason: 'Tiny docs-only mission does not need command ceremony.',
      };
    }

    // Default to ASK for broad test commands if mission is not explicitly docs-only
    return {
      decision: AutopilotCommandDecision.ASK,
      reason:
        'Broad test commands require permission unless the mission is explicitly docs-only.',
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
