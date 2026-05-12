/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';

export type DeferredCommandStatus =
  | 'deferred'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'failed';

export interface DeferredCommand {
  id: string;
  timestamp: number;
  command: string;
  reason: string;
  missionText?: string;
  originatingTask?: string;
  status: DeferredCommandStatus;
}

let queue: DeferredCommand[] = [];
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Adds a command to the deferred queue.
 */
export function deferCommand(
  event: Omit<DeferredCommand, 'id' | 'timestamp' | 'status'>,
): DeferredCommand {
  const newCommand: DeferredCommand = {
    ...event,
    id: randomUUID(),
    timestamp: Date.now(),
    status: 'deferred',
  };

  queue.push(newCommand);
  notifyListeners();
  return newCommand;
}

/**
 * Returns all deferred commands.
 */
export function getDeferredCommands(): readonly DeferredCommand[] {
  return [...queue];
}

/**
 * Returns the count of pending deferred commands.
 */
export function getDeferredCount(): number {
  return queue.filter((c) => c.status === 'deferred').length;
}

/**
 * Updates the status of a deferred command.
 */
export function updateDeferredStatus(
  id: string,
  status: DeferredCommandStatus,
): void {
  const command = queue.find((c) => c.id === id);
  if (command) {
    command.status = status;
    notifyListeners();
  }
}

/**
 * Clears the deferred command queue.
 */
export function clearDeferredCommands(): void {
  queue = [];
  notifyListeners();
}

/**
 * Adds a listener for queue changes.
 */
export function addDeferredQueueListener(listener: () => void): void {
  listeners.add(listener);
}

/**
 * Removes a queue listener.
 */
export function removeDeferredQueueListener(listener: () => void): void {
  listeners.delete(listener);
}
