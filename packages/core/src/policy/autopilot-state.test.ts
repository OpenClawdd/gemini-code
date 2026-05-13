/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  AutopilotMode,
  getAutopilotMode,
  getAutopilotState,
  resetAutopilotState,
  setAutopilotMode,
} from './autopilot-state.js';

describe('autopilot-state', () => {
  beforeEach(() => {
    resetAutopilotState();
  });

  it('defaults to off', () => {
    expect(getAutopilotMode()).toBe(AutopilotMode.OFF);
    expect(getAutopilotState()).toEqual({ mode: AutopilotMode.OFF });
  });

  it('stores attended and unattended modes', () => {
    setAutopilotMode(AutopilotMode.ATTENDED);
    expect(getAutopilotMode()).toBe(AutopilotMode.ATTENDED);

    setAutopilotMode(AutopilotMode.UNATTENDED);
    expect(getAutopilotMode()).toBe(AutopilotMode.UNATTENDED);
  });
});
