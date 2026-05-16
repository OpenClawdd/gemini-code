/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AutopilotCommandDecision } from './autopilot-command-gate.js';

export interface AutopilotEditGateInput {
  mission: string;
  filePath: string;
}

export interface AutopilotEditGateResult {
  decision: AutopilotCommandDecision;
  reason: string;
}

export function evaluateAutopilotEdit({
  mission: _mission,
  filePath,
}: AutopilotEditGateInput): AutopilotEditGateResult {
  const normalizedPath = filePath.toLowerCase();

  // BLOCK-class actions:
  // - auth, secrets, env files, outside repo
  if (
    normalizedPath.includes('auth') ||
    normalizedPath.includes('secret') ||
    normalizedPath.includes('credential') ||
    normalizedPath.includes('.env') ||
    normalizedPath.includes('.pem') ||
    normalizedPath.includes('.key')
  ) {
    return {
      decision: AutopilotCommandDecision.DENY,
      reason:
        'Auth, secrets, and environment files are blocked from auto-edits.',
    };
  }

  // Outside repo (simplistic check: paths that go up to root or start with / but not workspace - we leave outside workspace to PolicyEngine sandbox checks, but block obvious escapes)
  if (filePath.startsWith('..')) {
    return {
      decision: AutopilotCommandDecision.DENY,
      reason:
        'Relative paths escaping the workspace are blocked from auto-edits.',
    };
  }

  // ASK/DEFER-class actions:
  // - package lock churn
  if (
    normalizedPath.includes('package-lock.json') ||
    normalizedPath.includes('yarn.lock') ||
    normalizedPath.includes('pnpm-lock.yaml')
  ) {
    return {
      decision: AutopilotCommandDecision.ASK,
      reason: 'Package lock churn requires approval.',
    };
  }

  // broad refactors? hard to tell from file path.

  // ALLOW: small in-repo source/test/docs edits, mission-scoped files
  return {
    decision: AutopilotCommandDecision.ALLOW,
    reason: 'In-repo file edits are allowed in fully-unattended mode.',
  };
}
