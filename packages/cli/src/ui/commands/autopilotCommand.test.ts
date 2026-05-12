/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { autopilotCommand } from './autopilotCommand.js';
import { getAutopilotMode } from '@google/gemini-cli-core';

describe('autopilotCommand', () => {
  const mockContext: unknown = {
    services: {
      agentContext: {
        config: {},
      },
    },
  };

  it('reports current status', async () => {
    const result = await autopilotCommand.action(mockContext, 'status');
    expect(result.type).toBe('message');
    expect(result.content).toContain('Autopilot Mode:');
  });

  it('sets unattended mode', async () => {
    const result = await autopilotCommand.action(mockContext, 'unattended');
    expect(result.content).toContain('UNATTENDED');
    expect(getAutopilotMode()).toBe('unattended');
  });

  it('sets normal mode', async () => {
    const result = await autopilotCommand.action(mockContext, 'normal');
    expect(result.content).toContain('NORMAL');
    expect(getAutopilotMode()).toBe('normal');
  });
});
