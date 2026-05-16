/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { autopilotCommand } from './autopilotCommand.js';
import { getAutopilotMode } from '@google/gemini-cli-core';
import { type CommandContext } from './types.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';

describe('autopilotCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    mockContext = createMockCommandContext();
  });

  it('reports current status', async () => {
    const result = await autopilotCommand.action?.(mockContext, 'status');
    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }
    expect(result.type).toBe('message');
    expect(result.content).toContain('Autopilot Mode:');
  });

  it('sets semi-unattended mode', async () => {
    const result = await autopilotCommand.action?.(
      mockContext,
      'semi-unattended',
    );
    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }
    expect(result.content).toContain('SEMI-UNATTENDED');
    expect(getAutopilotMode()).toBe('semi-unattended');
  });

  it('sets fully-unattended mode', async () => {
    const result = await autopilotCommand.action?.(
      mockContext,
      'fully-unattended',
    );
    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }
    expect(result.content).toContain('FULLY-UNATTENDED');
    expect(getAutopilotMode()).toBe('fully-unattended');
  });

  it('maps unattended to semi-unattended', async () => {
    const result = await autopilotCommand.action?.(mockContext, 'unattended');
    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }
    expect(result.content).toContain('SEMI-UNATTENDED');
    expect(getAutopilotMode()).toBe('semi-unattended');
  });

  it('sets normal mode', async () => {
    const result = await autopilotCommand.action?.(mockContext, 'normal');
    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }
    expect(result.content).toContain('NORMAL');
    expect(getAutopilotMode()).toBe('normal');
  });
});
