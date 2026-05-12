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
 * Returns the latest autopilot event.
 */
export function getLatestAutopilotEvent(): AutopilotEvent | undefined {
  return events.length > 0 ? events[0] : undefined;
}

/**
 * Returns the latest denied autopilot event.
 */
export function getLatestDeniedEvent(): AutopilotEvent | undefined {
  return events.find((e) => e.decision === 'deny');
}

/**
 * Returns the latest suppressed autopilot event.
 */
export function getLatestSuppressedEvent(): AutopilotEvent | undefined {
  return events.find((e) => e.decision === 'suppress');
}

/**
 * Returns recent events filtered by decision.
 */
export function getRecentEventsByDecision(
  decision: AutopilotEventDecision,
  limit = 5,
): AutopilotEvent[] {
  return events.filter((e) => e.decision === decision).slice(0, limit);
}

/**
 * Clears the event history.
 */
export function clearAutopilotEvents(): void {
  events = [];
}
