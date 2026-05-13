/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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

const destructivePatterns = [
  /(^|\s)rm\s+-rf(\s|$)/i,
  /(^|\s)git\s+push(?:\s|$)/i,
  /(^|\s)sudo\s+/i,
  /curl\b[^|;&]*\|\s*(?:bash|sh|zsh)\b/i,
  /(^|\s)git\s+reset\s+--hard(?:\s|$)/i,
  /(^|\s)git\s+clean\s+-[a-z]*f[a-z]*(?:\s|$)/i,
  /(^|\s)git\s+checkout\s+-f(?:\s|$)/i,
  /(^|\s)git\s+.*\s--force(?:\s|$)/i,
  /(^|\s)npm\s+publish\b.*\s--force(?:\s|$)/i,
];

const broadValidationPatterns = [
  /^npm\s+test(?:\s|$)/i,
  /^npm\s+run\s+test(?::\w+)?(?:\s|$)/i,
  /^npm\s+run\s+format(?:\s|$)/i,
  /^npm\s+run\s+lint(?:\s|$)/i,
  /^npm\s+run\s+typecheck(?:\s|$)/i,
  /^npm\s+run\s+build(?:\s|$)/i,
];

const safeReadOnlyPatterns = [
  /^pwd$/i,
  /^git\s+status(?:\s+--short)?$/i,
  /^git\s+branch\s+--show-current$/i,
  /^git\s+log\s+-n\s+\d+\s+--oneline$/i,
  /^git\s+diff$/i,
  /^ls(?:\s+-[\w-]+)?(?:\s+[\w./-]+)?$/i,
  /^cat\s+[\w./-]+$/i,
  /^(?:rg|grep)\s+(?:-[\w-]+\s+)?[\w'"./:-]+(?:\s+[\w./-]+)?$/i,
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

function missionRequestsValidation(mission: string): boolean {
  const normalizedMission = mission.toLowerCase();
  return /\b(run|do|perform|execute|check|validate|verify)\b.*\b(test|tests|lint|typecheck|build|validation|checks)\b/.test(
    normalizedMission,
  );
}

function commandTargetsCore(command: string): boolean {
  return /(^|\s)(packages\/core|packages\\core|core)(\s|$)/i.test(command);
}

function isCompoundCommand(command: string): boolean {
  return /(?:&&|\|\||;|\|)/.test(command);
}

function isBroadValidationCommand(command: string): boolean {
  return broadValidationPatterns.some((pattern) => pattern.test(command));
}

export function isAutopilotHardDeniedCommand(command: string): boolean {
  return destructivePatterns.some((pattern) =>
    pattern.test(normalize(command)),
  );
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

  if (isAutopilotHardDeniedCommand(normalizedCommand)) {
    return {
      decision: AutopilotCommandDecision.DENY,
      reason: 'Destructive or remote-mutating commands stay behind the gate.',
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

  if (isBroadValidationCommand(normalizedCommand)) {
    if (missionRequestsValidation(mission)) {
      return {
        decision: AutopilotCommandDecision.ASK,
        reason:
          'User-requested validation should not be suppressed as ritual ceremony.',
      };
    }

    return {
      decision: AutopilotCommandDecision.SUPPRESS,
      reason: 'Tiny docs-only mission does not need command ceremony.',
    };
  }

  if (
    !isCompoundCommand(normalizedCommand) &&
    safeReadOnlyPatterns.some((pattern) => pattern.test(normalizedCommand))
  ) {
    return {
      decision: AutopilotCommandDecision.ALLOW,
      reason: 'Read-only local inspection is safe and useful.',
    };
  }

  return {
    decision: AutopilotCommandDecision.ASK,
    reason: 'Command is not covered by the gemini-code autopilot gate yet.',
  };
}
