/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import { stopLocalDashboard } from '../local-dashboard/DashboardServer.js';
import { localhostCommand } from './localhostCommand.js';

describe('localhostCommand', () => {
  afterEach(async () => {
    await stopLocalDashboard();
  });

  it('is off by default', async () => {
    const result = await localhostCommand.action!(
      createMockCommandContext(),
      'status',
    );

    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }

    expect(result.content).toBe('Localhost dashboard stopped.');
  });

  it('starts and stops only when requested', async () => {
    const startResult = await localhostCommand.action!(
      createMockCommandContext(),
      'start',
    );
    if (
      !startResult ||
      typeof startResult === 'string' ||
      startResult.type !== 'message'
    ) {
      throw new Error('Expected message result');
    }
    expect(startResult.content).toContain('http://127.0.0.1:');

    const stopResult = await localhostCommand.action!(
      createMockCommandContext(),
      'off',
    );
    if (
      !stopResult ||
      typeof stopResult === 'string' ||
      stopResult.type !== 'message'
    ) {
      throw new Error('Expected message result');
    }
    expect(stopResult.content).toBe('Localhost dashboard stopped.');
  });

  it('accepts on and stop aliases', async () => {
    const onResult = await localhostCommand.action!(
      createMockCommandContext(),
      'on',
    );
    if (
      !onResult ||
      typeof onResult === 'string' ||
      onResult.type !== 'message'
    ) {
      throw new Error('Expected message result');
    }
    expect(onResult.content).toContain('http://127.0.0.1:');

    const stopResult = await localhostCommand.action!(
      createMockCommandContext(),
      'stop',
    );
    if (
      !stopResult ||
      typeof stopResult === 'string' ||
      stopResult.type !== 'message'
    ) {
      throw new Error('Expected message result');
    }
    expect(stopResult.content).toBe('Localhost dashboard stopped.');
  });

  it('reports usage for unknown arguments', async () => {
    const result = await localhostCommand.action!(
      createMockCommandContext(),
      'restart',
    );

    if (!result || typeof result === 'string' || result.type !== 'message') {
      throw new Error('Expected message result');
    }

    expect(result.messageType).toBe('error');
    expect(result.content).toBe('Usage: /localhost [status|start|stop|on|off]');
  });
});
