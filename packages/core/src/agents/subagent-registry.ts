/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SubagentDefinition {
  id: string;
  displayName: string;
  purpose: string;
  allowedCapabilities: string[];
  blockedZones: string[];
  outputContract: string;
  whenToUse: string;
  whenNotToUse: string;
}

const registry: Map<string, SubagentDefinition> = new Map();

/**
 * Registers a subagent definition.
 */
export function registerSubagent(definition: SubagentDefinition): void {
  registry.set(definition.id, definition);
}

/**
 * Returns all registered subagents.
 */
export function getSubagents(): SubagentDefinition[] {
  return Array.from(registry.values());
}

/**
 * Finds a subagent by ID.
 */
export function getSubagentById(id: string): SubagentDefinition | undefined {
  return registry.get(id);
}

// --- v0 Subagents ---

registerSubagent({
  id: 'scout',
  displayName: 'Fast Scout',
  purpose: 'Rapidly maps the codebase and validates assumptions.',
  allowedCapabilities: ['read_file', 'grep_search', 'glob', 'list_directory'],
  blockedZones: [],
  outputContract: 'A list of relevant files and symbols with zero edits.',
  whenToUse: 'Starting a new task or exploring an unfamiliar area.',
  whenNotToUse: 'When you already have a clear plan and the files identified.',
});

registerSubagent({
  id: 'architect',
  displayName: 'Deep Architect',
  purpose: 'Designs structural changes and ensures system integrity.',
  allowedCapabilities: ['read_file', 'enter_plan_mode'],
  blockedZones: [],
  outputContract: 'A detailed design document and multi-step plan.',
  whenToUse: 'Planning complex features or significant refactors.',
  whenNotToUse: 'For simple bug fixes or documentation updates.',
});

registerSubagent({
  id: 'surgeon',
  displayName: 'Code Surgeon',
  purpose: 'Performs surgical, precise edits and bug fixes.',
  allowedCapabilities: ['replace', 'write_file', 'run_shell_command'],
  blockedZones: ['packages/core/src/policy'], // Surgeon stays away from core policy
  outputContract: 'High-quality, idiomatic code changes.',
  whenToUse: 'Executing a confirmed plan with specific targets.',
  whenNotToUse: 'During exploration or architectural design.',
});

registerSubagent({
  id: 'test-captain',
  displayName: 'Test Captain',
  purpose: 'Ensures correctness and prevents regressions.',
  allowedCapabilities: ['run_shell_command', 'read_file'],
  blockedZones: [],
  outputContract: 'Verified test results and new test coverage.',
  whenToUse: 'Verifying any code change, no matter how small.',
  whenNotToUse: 'When no code has been modified yet.',
});

registerSubagent({
  id: 'critic',
  displayName: 'Strict Critic',
  purpose: 'Reviews plans and code for hidden risks and duplication.',
  allowedCapabilities: ['read_file', 'activate_skill'],
  blockedZones: [],
  outputContract: 'Constructive feedback and identified risks.',
  whenToUse: 'Before committing or finalizing a complex plan.',
  whenNotToUse: 'For low-risk tasks like typo fixes.',
});

registerSubagent({
  id: 'risk-officer',
  displayName: 'Risk Officer',
  purpose: 'Monitors safety boundaries and identifies security risks.',
  allowedCapabilities: ['read_file'],
  blockedZones: [],
  outputContract: 'Safety assessment and blocked actions list.',
  whenToUse: 'Tasks involving core systems, security, or broad deletion.',
  whenNotToUse: 'Simple documentation or UI-only tasks.',
});

registerSubagent({
  id: 'ux-voice',
  displayName: 'UX Voice',
  purpose: 'Ensures user-facing strings and UI feel polished.',
  allowedCapabilities: ['read_file', 'activate_skill'],
  blockedZones: [],
  outputContract: 'Clear, concise, and helpful user-facing content.',
  whenToUse: 'Modifying UI components, notifications, or docs.',
  whenNotToUse: 'Internal backend logic or infrastructure work.',
});
