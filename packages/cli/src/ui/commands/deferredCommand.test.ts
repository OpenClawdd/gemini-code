/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { deferredCommand } from './deferredCommand.js';
import {
  clearDeferredCommands,
  deferCommand,
  getDeferredCommands,
} from '@google/gemini-cli-core';

describe('deferredCommand', () => {
  const mockContext: unknown = {};

  beforeEach(() => {
    clearDeferredCommands();
  });

  it('lists empty queue', async () => {
    const result = await deferredCommand.action(mockContext, 'list');
    expect(result.content).toContain('No deferred commands');
  });

  it('lists queued commands', async () => {
    deferCommand({ command: 'ls', reason: 'test' });
    const result = await deferredCommand.action(mockContext, 'list');
    expect(result.content).toContain('ls');
    expect(result.content).toContain('test');
  });

  it('approves a command', async () => {
    const cmd = deferCommand({ command: 'ls', reason: 'test' });
    const result = await deferredCommand.action(
      mockContext,
      `approve ${cmd.id}`,
    );
    expect(result.content).toContain('approved');
    expect(getDeferredCommands()[0].status).toBe('approved');
  });

  it('rejects a command', async () => {
    const cmd = deferCommand({ command: 'ls', reason: 'test' });
    const result = await deferredCommand.action(
      mockContext,
      `reject ${cmd.id}`,
    );
    expect(result.content).toContain('rejected');
    expect(getDeferredCommands()[0].status).toBe('rejected');
  });

  it('clears the queue', async () => {
    deferCommand({ command: 'ls', reason: 'test' });
    await deferredCommand.action(mockContext, 'clear');
    expect(getDeferredCommands()).toHaveLength(0);
  });
});
