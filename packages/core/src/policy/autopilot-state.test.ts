/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getAutopilotMode, setAutopilotMode } from './autopilot-state.js';

describe('AutopilotState', () => {
  beforeEach(() => {
    setAutopilotMode('normal');
  });

  it('defaults to normal mode', () => {
    expect(getAutopilotMode()).toBe('normal');
  });

  it('sets unattended mode', () => {
    setAutopilotMode('unattended');
    expect(getAutopilotMode()).toBe('unattended');
  });
});
