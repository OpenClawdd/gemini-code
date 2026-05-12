/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type Verbosity = 'compact' | 'normal' | 'detailed';

export interface GcSettings {
  cockpitDefaultExpanded: boolean;
  polluxVisible: boolean;
  verbosity: Verbosity;
  localhostDashboardEnabled: boolean;
  strictCommandHygiene: boolean;
}

const defaultSettings: GcSettings = {
  cockpitDefaultExpanded: false,
  polluxVisible: true,
  verbosity: 'normal',
  localhostDashboardEnabled: false,
  strictCommandHygiene: true,
};

let currentSettings: GcSettings = { ...defaultSettings };
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Returns current GC settings.
 */
export function getGcSettings(): GcSettings {
  return { ...currentSettings };
}

/**
 * Updates GC settings.
 */
export function updateGcSettings(updates: Partial<GcSettings>): void {
  currentSettings = { ...currentSettings, ...updates };
  notifyListeners();
}

/**
 * Resets settings to defaults.
 */
export function resetGcSettings(): void {
  currentSettings = { ...defaultSettings };
  notifyListeners();
}

/**
 * Adds a listener for settings changes.
 */
export function addSettingsListener(listener: () => void): void {
  listeners.add(listener);
}

/**
 * Removes a settings listener.
 */
export function removeSettingsListener(listener: () => void): void {
  listeners.delete(listener);
}
