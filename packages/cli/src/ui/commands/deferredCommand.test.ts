/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeferredCommands,
  enqueueDeferredCommand,
} from '@google/gemini-cli-core';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import type { SlashCommandActionReturn } from './types.js';
import { deferredCommand } from './deferredCommand.js';

describe('deferredCommand', () => {
  beforeEach(() => {
    clearDeferredCommands();
  });

  it('lists deferred commands', async () => {
    enqueueDeferredCommand({
      command: 'npm run build',
      reason:
        'Autopilot unattended defers permission-needed commands for review.',
      toolName: 'run_shell_command',
    });

    const result = (await deferredCommand.action!(
      createMockCommandContext(),
      '',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toContain('npm run build');
    }
  });

  it('clears deferred commands', async () => {
    enqueueDeferredCommand({
      command: 'npm run lint',
      reason:
        'Autopilot unattended defers permission-needed commands for review.',
      toolName: 'run_shell_command',
    });

    const clearResult = (await deferredCommand.action!(
      createMockCommandContext(),
      'clear',
    )) as SlashCommandActionReturn;
    const listResult = (await deferredCommand.action!(
      createMockCommandContext(),
      'list',
    )) as SlashCommandActionReturn;

    expect(clearResult.type).toBe('message');
    expect(listResult.type).toBe('message');
    if (listResult.type === 'message') {
      expect(listResult.content).toBe('No deferred commands.');
    }
  });
});
