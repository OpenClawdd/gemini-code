/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeferredCommands,
  enqueueDeferredCommand,
  listDeferredCommands,
} from './deferred-command-queue.js';

describe('deferred-command-queue', () => {
  beforeEach(() => {
    clearDeferredCommands();
  });

  it('records deferred commands in order', () => {
    const first = enqueueDeferredCommand({
      command: 'npm run build',
      reason: 'Autopilot unattended defers permission-needed commands.',
      toolName: 'run_shell_command',
      callId: 'call-1',
      mission: 'fix README typo',
      createdAt: '2026-05-13T00:00:00.000Z',
    });
    const second = enqueueDeferredCommand({
      command: 'mkdir -p snapshots',
      reason: 'Autopilot unattended defers permission-needed commands.',
      toolName: 'run_shell_command',
      createdAt: '2026-05-13T00:00:01.000Z',
    });

    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
    expect(listDeferredCommands()).toEqual([first, second]);
  });

  it('clears records and resets ids', () => {
    enqueueDeferredCommand({
      command: 'npm run lint',
      reason: 'Autopilot unattended defers permission-needed commands.',
      toolName: 'run_shell_command',
    });

    clearDeferredCommands();

    expect(listDeferredCommands()).toEqual([]);
    expect(
      enqueueDeferredCommand({
        command: 'npm run typecheck',
        reason: 'Autopilot unattended defers permission-needed commands.',
        toolName: 'run_shell_command',
      }).id,
    ).toBe(1);
  });
});
