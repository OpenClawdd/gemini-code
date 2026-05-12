/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type AutopilotMode = 'normal' | 'unattended';

let currentMode: AutopilotMode = 'normal';
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Returns the current autopilot mode.
 */
export function getAutopilotMode(): AutopilotMode {
  return currentMode;
}

/**
 * Sets the current autopilot mode.
 */
export function setAutopilotMode(mode: AutopilotMode): void {
  if (currentMode === mode) return;
  currentMode = mode;
  notifyListeners();
}

/**
 * Adds a listener for mode changes.
 */
export function addAutopilotStateListener(listener: () => void): void {
  listeners.add(listener);
}

/**
 * Removes a mode listener.
 */
export function removeAutopilotStateListener(listener: () => void): void {
  listeners.delete(listener);
}
