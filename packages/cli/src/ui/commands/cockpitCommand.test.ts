/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCockpitVisible,
  setCockpitVisible,
} from '../cockpit/CockpitState.js';
import { createMockCommandContext } from '../../test-utils/mockCommandContext.js';
import { cockpitCommand } from './cockpitCommand.js';

describe('cockpitCommand', () => {
  beforeEach(() => {
    setCockpitVisible(false);
  });

  it('toggles the cockpit online and hidden', async () => {
    const context = createMockCommandContext();

    const online = await cockpitCommand.action!(context, '');
    expect(online.type).toBe('message');
    if (online.type === 'message') {
      expect(online.content).toBe('Cockpit online.');
    }
    expect(getCockpitVisible()).toBe(true);

    const hidden = await cockpitCommand.action!(context, '');
    expect(hidden.type).toBe('message');
    if (hidden.type === 'message') {
      expect(hidden.content).toBe('Cockpit hidden.');
    }
    expect(getCockpitVisible()).toBe(false);
  });
});
