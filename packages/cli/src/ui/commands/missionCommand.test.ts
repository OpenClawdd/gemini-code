/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShellExecutionService } from '@google/gemini-cli-core';
import {
  missionCommand,
  parseMissionMode,
  parseMissionTask,
} from './missionCommand.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import { createMockConfig } from '../../test-utils/mockConfig.js';
import type { CommandContext, SlashCommandActionReturn } from './types.js';
import { getCurrentMission } from '../cockpit/CockpitState.js';
import { classifyMissionCommand } from './mission/policy.js';

describe('missionCommand parsing', () => {
  it('defaults a bare task to execute mode', () => {
    expect(parseMissionMode('fix the tokenizer')).toBe('execute');
    expect(parseMissionTask('fix the tokenizer', 'execute')).toBe(
      'fix the tokenizer',
    );
  });

  it('parses plan and ship prefixes', () => {
    expect(parseMissionMode('plan refactor carefully')).toBe('plan');
    expect(parseMissionTask('plan refactor carefully', 'plan')).toBe(
      'refactor carefully',
    );
    expect(parseMissionMode('ship update docs')).toBe('ship');
    expect(parseMissionTask('ship update docs', 'ship')).toBe('update docs');
  });

  it('does not treat planning as the plan subcommand', () => {
    expect(parseMissionMode('planning notes for release')).toBe('execute');
  });
});

describe('mission command policy', () => {
  it('allows only read-only inspection commands to auto-run', () => {
    expect(classifyMissionCommand('git status -sb').approval).toBe('auto');
    expect(classifyMissionCommand('git diff --check').approval).toBe('auto');
    expect(classifyMissionCommand('git status -sb && git diff').approval).toBe(
      'blocked',
    );
    expect(classifyMissionCommand('git push origin main').approval).toBe(
      'blocked',
    );
    expect(classifyMissionCommand('cat .env').approval).toBe('blocked');
  });
});

describe('missionCommand', () => {
  let mockContext: CommandContext;

  beforeEach(() => {
    const setAutopilotMission = vi.fn();
    const mockConfig = createMockConfig({
      getProjectRoot: vi.fn(() => '/repo'),
    });
    vi.mocked(mockConfig.getPolicyEngine).mockReturnValue({
      setAutopilotMission,
    } as unknown as ReturnType<typeof mockConfig.getPolicyEngine>);

    mockContext = createMockCommandContext({
      services: {
        agentContext: {
          config: mockConfig,
        },
      },
    });

    vi.spyOn(ShellExecutionService, 'execute').mockImplementation(
      async (command) => ({
        pid: 123,
        result: Promise.resolve({
          output: outputForCommand(command),
          exitCode: 0,
          signal: null,
          error: null,
          aborted: false,
          pid: 123,
          executionMethod: 'child_process',
        }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns error if request is empty', async () => {
    const result = (await missionCommand.action!(
      mockContext,
      '',
    )) as SlashCommandActionReturn;
    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.messageType).toBe('error');
    }
    expect(ShellExecutionService.execute).not.toHaveBeenCalled();
  });

  it('preserves /mission plan as brief-only submit_prompt behavior', async () => {
    const request = 'Refactor the tokenizer';
    const plan = missionCommand.subCommands?.find((cmd) => cmd.name === 'plan');
    const result = (await plan?.action!(
      mockContext,
      request,
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('submit_prompt');
    if (result.type === 'submit_prompt') {
      expect(String(result.content)).toContain(request);
      expect(String(result.content)).toContain('Do NOT use any tools');
    }
    expect(ShellExecutionService.execute).not.toHaveBeenCalled();
    expect(getCurrentMission()).toBe(request);
  });

  it('runs safe repo inspection commands for /mission <task>', async () => {
    const request = 'inspect current repo state';
    const result = (await missionCommand.action!(
      mockContext,
      request,
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toContain('Mission Runner');
      expect(result.content).toContain('Commands executed:');
      expect(result.content).toContain('git status -sb: ok');
    }
    expect(ShellExecutionService.execute).toHaveBeenCalledWith(
      'git status -sb',
      '/repo',
      expect.any(Function),
      expect.any(AbortSignal),
      false,
      expect.any(Object),
    );
  });

  it('stops at EDIT_FILE with a clear limitation instead of fake editing', async () => {
    const result = (await missionCommand.action!(
      mockContext,
      'fix the tokenizer bug',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toContain('EDIT_FILE execution is not wired');
      expect(result.content).toContain('no files were edited');
    }
  });

  it('records ship intent without committing or pushing', async () => {
    const ship = missionCommand.subCommands?.find((cmd) => cmd.name === 'ship');
    const result = (await ship?.action!(
      mockContext,
      'inspect release readiness',
    )) as SlashCommandActionReturn;

    expect(result.type).toBe('message');
    if (result.type === 'message') {
      expect(result.content).toContain('Mode: ship');
      expect(result.content).toContain('commit/push did not run');
    }
    expect(ShellExecutionService.execute).not.toHaveBeenCalledWith(
      expect.stringMatching(/git (commit|push)/),
      expect.any(String),
      expect.any(Function),
      expect.any(AbortSignal),
      expect.any(Boolean),
      expect.any(Object),
    );
  });
});

function outputForCommand(command: string): string {
  switch (command) {
    case 'git rev-parse --abbrev-ref HEAD':
      return 'feature/mission';
    case 'git status -sb':
      return '## feature/mission';
    case 'git diff --stat':
    case 'git diff --check':
      return '';
    case 'ls':
      return 'package.json\npackages\nREADME.md';
    default:
      return '';
  }
}
