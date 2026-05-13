/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  AutopilotCommandDecision,
  evaluateAutopilotCommand,
} from './autopilot-command-gate.js';

const mission = 'fix README typo without touching core';

function decision(command: string): AutopilotCommandDecision {
  return evaluateAutopilotCommand({ mission, command }).decision;
}

describe('evaluateAutopilotCommand', () => {
  it('suppresses broad ritual commands for tiny docs-only missions', () => {
    const docsMission = 'fix README typo';
    expect(
      evaluateAutopilotCommand({ mission: docsMission, command: 'npm test' })
        .decision,
    ).toBe(AutopilotCommandDecision.SUPPRESS);
    expect(
      evaluateAutopilotCommand({
        mission: docsMission,
        command: 'npm run format',
      }).decision,
    ).toBe(AutopilotCommandDecision.SUPPRESS);
  });

  it('asks for broad tests if the mission is not explicitly docs-only', () => {
    const complexMission = 'implement new feature X';
    expect(
      evaluateAutopilotCommand({ mission: complexMission, command: 'npm test' })
        .decision,
    ).toBe(AutopilotCommandDecision.ASK);
  });

  it('asks for tests when explicitly requested by user', () => {
    expect(
      evaluateAutopilotCommand({
        mission: 'run validation tests',
        command: 'npm test',
      }).decision,
    ).toBe(AutopilotCommandDecision.ASK);
    expect(
      evaluateAutopilotCommand({
        mission: 'verify Autopilot v2 with tests',
        command: 'npm test',
      }).decision,
    ).toBe(AutopilotCommandDecision.ASK);
    expect(
      evaluateAutopilotCommand({
        mission: 'fix typo and verify with test',
        command: 'npm test',
      }).decision,
    ).toBe(AutopilotCommandDecision.ASK);
  });

  it('does not suppress narrow test commands requested by user', () => {
    expect(
      evaluateAutopilotCommand({
        mission: 'run validation tests',
        command: 'npm test -- src/foo.test.ts',
      }).decision,
    ).toBe(AutopilotCommandDecision.ASK);
  });

  it('suppresses protected-zone core diffs for a no-core mission', () => {
    expect(decision('git diff packages/core')).toBe(
      AutopilotCommandDecision.SUPPRESS,
    );
  });

  it('allows safe local diff inspection', () => {
    expect(decision('git diff')).toBe(AutopilotCommandDecision.ALLOW);
  });

  it('allows simple read-only commands', () => {
    expect(decision('git status')).toBe(AutopilotCommandDecision.ALLOW);
    expect(decision('git log -n 8 --oneline')).toBe(
      AutopilotCommandDecision.ALLOW,
    );
    expect(decision('git branch --show-current')).toBe(
      AutopilotCommandDecision.ALLOW,
    );
    expect(
      decision('ls packages/core/src/policy/autopilot-command-gate.ts'),
    ).toBe(AutopilotCommandDecision.ALLOW);
  });

  it('asks for compound read-only commands', () => {
    expect(decision('git status && git log')).toBe(
      AutopilotCommandDecision.ASK,
    );
    expect(decision('git status 2>/dev/null')).toBe(
      AutopilotCommandDecision.ASK,
    );
    expect(decision('git status | cat')).toBe(AutopilotCommandDecision.ASK);
  });

  it('denies destructive or remote-mutating commands', () => {
    expect(decision('git push')).toBe(AutopilotCommandDecision.DENY);
    expect(decision('rm -rf dist')).toBe(AutopilotCommandDecision.DENY);
    expect(decision('sudo rm -rf /')).toBe(AutopilotCommandDecision.DENY);
  });
});
