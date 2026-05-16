/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AutopilotMode {
  OFF = 'off',
  ATTENDED = 'attended',
  UNATTENDED = 'unattended',
}

export interface AutopilotStateSnapshot {
  mode: AutopilotMode;
}

let currentMode = AutopilotMode.OFF;

export function getAutopilotMode(): AutopilotMode {
  return currentMode;
}

export function setAutopilotMode(mode: AutopilotMode): void {
  currentMode = mode;
}

export function resetAutopilotState(): void {
  currentMode = AutopilotMode.OFF;
}

export function getAutopilotState(): AutopilotStateSnapshot {
  return { mode: currentMode };
}
