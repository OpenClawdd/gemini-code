/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordAutopilotEvent,
  getAutopilotEvents,
  clearAutopilotEvents,
  getLatestAutopilotEvent,
  getLatestDeniedEvent,
  getLatestSuppressedEvent,
  getRecentEventsByDecision,
} from './autopilot-event-history.js';

describe('AutopilotEventHistory', () => {
  beforeEach(() => {
    clearAutopilotEvents();
  });

  it('records an event for ALLOW', () => {
    recordAutopilotEvent({
      command: 'git status',
      decision: 'allow',
      reason: 'Safe command',
      missionText: 'Test mission',
    });

    const events = getAutopilotEvents();
    expect(events).toHaveLength(1);
    expect(events[0].command).toBe('git status');
    expect(events[0].decision).toBe('allow');
    expect(events[0].reason).toBe('Safe command');
    expect(events[0].source).toBe('autopilot');
    expect(events[0].id).toBeDefined();
    expect(events[0].timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('records an event for ASK', () => {
    recordAutopilotEvent({
      command: 'git status && git log',
      decision: 'ask',
      reason: 'Compound command',
    });

    const events = getAutopilotEvents();
    expect(events).toHaveLength(1);
    expect(events[0].decision).toBe('ask');
  });

  it('records an event for DENY', () => {
    recordAutopilotEvent({
      command: 'rm -rf /',
      decision: 'deny',
      reason: 'Dangerous command',
    });

    const events = getAutopilotEvents();
    expect(events).toHaveLength(1);
    expect(events[0].decision).toBe('deny');
  });

  it('caps the event list at 25', () => {
    for (let i = 0; i < 30; i++) {
      recordAutopilotEvent({
        command: `command ${i}`,
        decision: 'allow',
        reason: 'Reason',
      });
    }

    const events = getAutopilotEvents();
    expect(events).toHaveLength(25);
    // Unshift puts new events at the beginning
    expect(events[0].command).toBe('command 29');
    expect(events[24].command).toBe('command 5');
  });

  it('getters return a copy of the events array', () => {
    recordAutopilotEvent({
      command: 'test',
      decision: 'allow',
      reason: 'test',
    });

    const events = getAutopilotEvents();
    const events2 = getAutopilotEvents();
    expect(events).not.toBe(events2); // Should be different references
    expect(events).toEqual(events2); // But same content
  });

  it('retrieves the latest event', () => {
    recordAutopilotEvent({ command: 'cmd1', decision: 'allow', reason: 'r1' });
    recordAutopilotEvent({ command: 'cmd2', decision: 'deny', reason: 'r2' });

    expect(getLatestAutopilotEvent()?.command).toBe('cmd2');
  });

  it('retrieves the latest denied event', () => {
    recordAutopilotEvent({ command: 'deny1', decision: 'deny', reason: 'r1' });
    recordAutopilotEvent({
      command: 'allow1',
      decision: 'allow',
      reason: 'r2',
    });
    recordAutopilotEvent({ command: 'deny2', decision: 'deny', reason: 'r3' });
    recordAutopilotEvent({
      command: 'allow2',
      decision: 'allow',
      reason: 'r4',
    });

    expect(getLatestDeniedEvent()?.command).toBe('deny2');
  });

  it('retrieves the latest suppressed event', () => {
    recordAutopilotEvent({ command: 's1', decision: 'suppress', reason: 'r1' });
    recordAutopilotEvent({ command: 'a1', decision: 'allow', reason: 'r2' });

    expect(getLatestSuppressedEvent()?.command).toBe('s1');
  });

  it('filters recent events by decision', () => {
    recordAutopilotEvent({ command: 'a1', decision: 'allow', reason: 'r1' });
    recordAutopilotEvent({ command: 'd1', decision: 'deny', reason: 'r2' });
    recordAutopilotEvent({ command: 'a2', decision: 'allow', reason: 'r3' });

    const allowed = getRecentEventsByDecision('allow');
    expect(allowed).toHaveLength(2);
    expect(allowed[0].command).toBe('a2');
  });
});
