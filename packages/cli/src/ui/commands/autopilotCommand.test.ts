/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutopilotMode, resetAutopilotState } from '@google/gemini-cli-core';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import type { CommandContext, SlashCommandActionReturn } from './types.js';
import { autopilotCommand } from './autopilotCommand.js';

describe('autopilotCommand', () => {
  let mockContext: CommandContext;
  const setAutopilotMode = vi.fn();

  beforeEach(() => {
    resetAutopilotState();
    setAutopilotMode.mockReset();
    mockContext = createMockCommandContext({
      services: {
        agentContext: {
          config: {
            getPolicyEngine: () => ({ setAutopilotMode }),
          },
        },
      },
    });
  });

  it('sets unattended mode on global and live policy state', async () => {
    const result = (await autopilotCommand.action!(
      mockContext,
      'unattended',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toContain('deferred');
    }
    expect(setAutopilotMode).toHaveBeenCalledWith(AutopilotMode.UNATTENDED);
  });

  it('sets off and attended modes on the live policy engine', async () => {
    await autopilotCommand.action!(mockContext, 'attended');
    await autopilotCommand.action!(mockContext, 'off');

    expect(setAutopilotMode).toHaveBeenNthCalledWith(1, AutopilotMode.ATTENDED);
    expect(setAutopilotMode).toHaveBeenNthCalledWith(2, AutopilotMode.OFF);
  });

  it('reports current status', async () => {
    await autopilotCommand.action!(mockContext, 'attended');

    const result = (await autopilotCommand.action!(
      mockContext,
      'status',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toContain('attended');
    }
  });

  it('rejects unknown subcommands', async () => {
    const result = (await autopilotCommand.action!(
      mockContext,
      'no-limits',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.messageType).toBe('error');
    }
  });
});
