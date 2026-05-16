/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type MissionMode = 'execute' | 'plan' | 'ship';

export type MissionState =
  | 'compile'
  | 'risk-scan'
  | 'inspect'
  | 'plan'
  | 'execute'
  | 'validate'
  | 'review'
  | 'ship'
  | 'done';

export type ActionType = 'RUN_SHELL' | 'EDIT_FILE' | 'VALIDATE' | 'STOP';

export type Approval = 'auto' | 'ask' | 'blocked';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface MissionAction {
  type: ActionType;
  command?: string;
  reason: string;
}

export interface MissionPhase {
  title: string;
  actions: MissionAction[];
}

export interface CommandPolicy {
  approval: Approval;
  risk: RiskLevel;
  reason: string;
}

export interface CommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export interface RepoSnapshot {
  branch: string;
  status: string;
  diffStat: string;
  diffCheck: CommandResult;
  rootListing: string;
  dirty: boolean;
}

export interface MissionReport {
  task: string;
  mode: MissionMode;
  state: MissionState;
  risk: RiskLevel;
  riskSummary: string;
  snapshot?: RepoSnapshot;
  phases: MissionPhase[];
  commandResults: CommandResult[];
  limitation?: string;
}
