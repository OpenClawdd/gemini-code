/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import { stopLocalDashboard } from '../local-dashboard/DashboardServer.js';
import type { SlashCommandActionReturn } from './types.js';
import { localhostCommand } from './localhostCommand.js';

describe('localhostCommand', () => {
  afterEach(async () => {
    await stopLocalDashboard();
  });

  it('is off by default', async () => {
    const result = (await localhostCommand.action!(
      createMockCommandContext(),
      'status',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toBe('Localhost dashboard stopped.');
    }
  });

  it('starts and stops only when requested', async () => {
    const startResult = (await localhostCommand.action!(
      createMockCommandContext(),
      'start',
    )) as SlashCommandActionReturn;
    expect(startResult.type).toBe('message');
    if (startResult.type === 'message') {
      expect(startResult.content).toContain('http://127.0.0.1:');
    }

    const stopResult = (await localhostCommand.action!(
      createMockCommandContext(),
      'off',
    )) as SlashCommandActionReturn;
    expect(stopResult.type).toBe('message');
    if (stopResult.type === 'message') {
      expect(stopResult.content).toBe('Localhost dashboard stopped.');
    }
  });
});
