/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  getAutopilotEvents,
  type AutopilotEvent,
} from '@google/gemini-cli-core';

export type BuddyMood = 'steady' | 'blocked' | 'protective' | 'busy';

export interface BuddyState {
  visible: boolean;
  mood: BuddyMood;
  message: string;
}

const defaultState: BuddyState = {
  visible: false,
  mood: 'steady',
  message: 'Standing by.',
};

let buddyState: BuddyState = { ...defaultState };
const listeners = new Set<() => void>();

function notifyBuddyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getBuddyState(): BuddyState {
  return buddyState;
}

export function setBuddyVisible(visible: boolean): void {
  if (buddyState.visible === visible) {
    return;
  }

  buddyState = { ...buddyState, visible };
  notifyBuddyListeners();
}

export function toggleBuddy(): boolean {
  setBuddyVisible(!buddyState.visible);
  return buddyState.visible;
}

export function setBuddyStatus(mood: BuddyMood, message: string): void {
  if (buddyState.mood === mood && buddyState.message === message) {
    return;
  }

  buddyState = { ...buddyState, mood, message };
  notifyBuddyListeners();
}

export function resetBuddyState(): void {
  buddyState = { ...defaultState };
  notifyBuddyListeners();
}

export function useBuddyState(): BuddyState {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => {
      setVersion((version) => version + 1);
    };

    listeners.add(listener);

    // Initial check for latest event
    const events = getAutopilotEvents();
    if (events.length > 0) {
      updateBuddyFromEvent(events[0]);
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return buddyState;
}

function updateBuddyFromEvent(event: AutopilotEvent): void {
  switch (event.decision) {
    case 'deny':
      setBuddyStatus('blocked', 'Blocked risky command.');
      break;
    case 'ask':
      setBuddyStatus('protective', 'Needs approval.');
      break;
    case 'suppress':
      setBuddyStatus('steady', 'Suppressed command ceremony.');
      break;
    case 'allow':
      // Only update if not already busy/blocked
      if (buddyState.mood === 'steady' || buddyState.mood === 'busy') {
        setBuddyStatus('busy', `Running: ${event.command}`);
      }
      break;
    default:
      // No specific reaction for other cases
      break;
  }
}
