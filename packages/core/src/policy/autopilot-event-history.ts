/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { randomUUID } from 'node:crypto';

export type AutopilotEventDecision = 'allow' | 'suppress' | 'ask' | 'deny';

export interface AutopilotEvent {
  id: string;
  timestamp: number;
  command: string;
  decision: AutopilotEventDecision;
  reason: string;
  source: 'autopilot';
  missionText?: string;
}

const MAX_EVENTS = 25;
let events: AutopilotEvent[] = [];

/**
 * Records an autopilot decision event.
 */
export function recordAutopilotEvent(
  event: Omit<AutopilotEvent, 'id' | 'timestamp' | 'source'>,
): AutopilotEvent {
  const newEvent: AutopilotEvent = {
    ...event,
    id: randomUUID(),
    timestamp: Date.now(),
    source: 'autopilot',
  };

  events.unshift(newEvent);
  if (events.length > MAX_EVENTS) {
    events = events.slice(0, MAX_EVENTS);
  }

  return newEvent;
}

/**
 * Returns a read-only list of recent autopilot events.
 */
export function getAutopilotEvents(): readonly AutopilotEvent[] {
  return [...events];
}

/**
 * Clears the event history.
 */
export function clearAutopilotEvents(): void {
  events = [];
}
