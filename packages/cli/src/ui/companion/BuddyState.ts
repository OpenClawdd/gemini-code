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
let lastMessage = '';
let lastEventId = '';
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

export function setBuddyQuiet(quiet: boolean): void {
  if (quiet) {
    setBuddyStatus('steady', 'Standing by (quiet mode).');
  } else {
    setBuddyStatus('steady', 'Standing by.');
  }
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
  lastMessage = '';
  lastEventId = '';
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
  // Dedupe based on ID
  if (event.id === lastEventId) return;
  lastEventId = event.id;

  let message = '';
  let mood: BuddyMood = 'steady';

  switch (event.decision) {
    case 'deny':
      mood = 'blocked';
      message = `Blocked risky command: ${event.command}`;
      break;
    case 'ask':
      mood = 'protective';
      message = 'Command needs your approval.';
      break;
    case 'suppress':
      mood = 'steady';
      message = 'Suppressed command ceremony.';
      break;
    case 'allow':
      mood = 'busy';
      message = `Running safe command: ${event.command}`;
      break;
    default:
      return;
  }

  // Cooldown/Spam prevention: don't repeat exact same message if mood is steady/busy
  if (message === lastMessage && (mood === 'steady' || mood === 'busy')) {
    return;
  }

  lastMessage = message;
  setBuddyStatus(mood, message);
}
