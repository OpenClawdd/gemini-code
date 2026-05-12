/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getSubagents, getSubagentById } from './subagent-registry.js';

describe('SubagentRegistry', () => {
  it('contains all v0 subagents', () => {
    const agents = getSubagents();
    const ids = agents.map((a) => a.id);

    expect(ids).toContain('scout');
    expect(ids).toContain('architect');
    expect(ids).toContain('surgeon');
    expect(ids).toContain('test-captain');
    expect(ids).toContain('critic');
    expect(ids).toContain('risk-officer');
    expect(ids).toContain('ux-voice');
  });

  it('provides detailed definitions by ID', () => {
    const surgeon = getSubagentById('surgeon');
    expect(surgeon).toBeDefined();
    expect(surgeon?.displayName).toBe('Code Surgeon');
    expect(surgeon?.allowedCapabilities).toContain('replace');
    expect(surgeon?.blockedZones).toContain('packages/core/src/policy');
  });

  it('correctly reports capabilities for scout', () => {
    const scout = getSubagentById('scout');
    expect(scout?.allowedCapabilities).toContain('grep_search');
    expect(scout?.allowedCapabilities).not.toContain('replace');
  });
});
