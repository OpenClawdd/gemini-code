/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getGcSettings,
  updateGcSettings,
  resetGcSettings,
} from './GcSettings.js';

describe('GcSettings', () => {
  beforeEach(() => {
    resetGcSettings();
  });

  it('provides default settings', () => {
    const settings = getGcSettings();
    expect(settings.verbosity).toBe('normal');
    expect(settings.cockpitDefaultExpanded).toBe(false);
    expect(settings.polluxVisible).toBe(true);
  });

  it('updates settings', () => {
    updateGcSettings({ verbosity: 'detailed', cockpitDefaultExpanded: true });
    const settings = getGcSettings();
    expect(settings.verbosity).toBe('detailed');
    expect(settings.cockpitDefaultExpanded).toBe(true);
    expect(settings.polluxVisible).toBe(true); // Should remain unchanged
  });

  it('resets settings', () => {
    updateGcSettings({ verbosity: 'compact' });
    resetGcSettings();
    expect(getGcSettings().verbosity).toBe('normal');
  });
});
