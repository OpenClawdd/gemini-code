/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DeferredCommandRecord {
  id: number;
  command: string;
  reason: string;
  toolName: string;
  callId?: string;
  mission?: string;
  createdAt: string;
}

let nextDeferredCommandId = 1;
let deferredCommands: DeferredCommandRecord[] = [];

export function enqueueDeferredCommand(
  record: Omit<DeferredCommandRecord, 'id' | 'createdAt'> & {
    createdAt?: string;
  },
): DeferredCommandRecord {
  const deferredRecord: DeferredCommandRecord = {
    ...record,
    id: nextDeferredCommandId,
    createdAt: record.createdAt ?? new Date().toISOString(),
  };
  nextDeferredCommandId += 1;
  deferredCommands = [...deferredCommands, deferredRecord];
  return deferredRecord;
}

export function listDeferredCommands(): DeferredCommandRecord[] {
  return [...deferredCommands];
}

export function clearDeferredCommands(): void {
  deferredCommands = [];
  nextDeferredCommandId = 1;
}
