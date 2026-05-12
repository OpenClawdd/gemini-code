/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  deferCommand,
  getDeferredCommands,
  getDeferredCount,
  updateDeferredStatus,
  clearDeferredCommands,
} from './deferred-command-queue.js';

describe('DeferredCommandQueue', () => {
  beforeEach(() => {
    clearDeferredCommands();
  });

  it('records a deferred command', () => {
    deferCommand({
      command: 'npm test',
      reason: 'Needs approval',
      missionText: 'Test mission',
    });

    const commands = getDeferredCommands();
    expect(commands).toHaveLength(1);
    expect(commands[0].command).toBe('npm test');
    expect(commands[0].status).toBe('deferred');
    expect(getDeferredCount()).toBe(1);
  });

  it('updates command status', () => {
    const cmd = deferCommand({
      command: 'npm test',
      reason: 'r',
    });

    updateDeferredStatus(cmd.id, 'approved');
    expect(getDeferredCommands()[0].status).toBe('approved');
    expect(getDeferredCount()).toBe(0);
  });

  it('clears the queue', () => {
    deferCommand({ command: 'c', reason: 'r' });
    clearDeferredCommands();
    expect(getDeferredCommands()).toHaveLength(0);
  });
});
