/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { createMissionBrief } from './MissionParser.js';

describe('MissionParser', () => {
  it('should create a structured brief from a request', () => {
    const request = 'Refactor the tokenizer';
    const brief = createMissionBrief(request);

    expect(brief.goal).toBe(request);
    expect(brief.lane).toBe('Unknown');
  });

  it('should truncate multi-line requests to the first line', () => {
    const request =
      'Refactor the tokenizer\n\nMore details here that should be hidden.';
    const brief = createMissionBrief(request);

    expect(brief.goal).toBe('Refactor the tokenizer');
  });

  it('should truncate very long first lines', () => {
    const request =
      'This is a very long goal that definitely exceeds eighty characters and should be truncated for the compact view display in the cockpit UI component';
    const brief = createMissionBrief(request);

    expect(brief.goal).toBe(
      'This is a very long goal that definitely exceeds eighty characters and should...',
    );
  });

  it('should truncate at the first sentence boundary', () => {
    const request =
      'Fix the bug. Then refactor the code. Finally add some tests for everything.';
    const brief = createMissionBrief(request);

    expect(brief.goal).toBe('Fix the bug');
  });
});
