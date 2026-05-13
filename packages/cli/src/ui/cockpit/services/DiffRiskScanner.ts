/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type DiffRiskLevel = 'low' | 'medium' | 'high';

export type DiffRiskCategory =
  | 'docs-only'
  | 'ui-only'
  | 'policy-scheduler-touched'
  | 'auth-secrets-touched'
  | 'generated-snapshots-changed'
  | 'tests-changed'
  | 'tests-missing'
  | 'deletions-present'
  | 'localhost-dashboard-touched'
  | 'high-risk-core-touched';

export interface DiffRiskScanResult {
  level: DiffRiskLevel;
  categories: DiffRiskCategory[];
  reasons: string[];
  suggestedNarrowTests: string[];
  broadTestsUnnecessary: boolean;
  humanReviewRecommended: boolean;
}

const DOCS_EXTENSIONS = new Set(['.md', '.mdx', '.txt', '.rst', '.adoc']);

const TEST_FILE_PATTERN =
  /(?:^|\/)(?:__tests__|tests?|test-data|__snapshots__|snapshots?)(?:\/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$/i;
const SNAPSHOT_FILE_PATTERN = /\.snap(?:\.svg|\.json|\.md|\.txt)?$/i;
const GENERATED_FILE_PATTERN = /\.(?:snap(?:\.[a-z]+)?|generated|gen)\b/i;

const HIGH_RISK_CORE_PATTERNS = [
  /(^|\/)packages\/core\/src\/policy\//i,
  /(^|\/)packages\/core\/src\/scheduler\//i,
  /(^|\/)packages\/core\/src\/shell-safety/i,
  /(^|\/)packages\/core\/src\/policy\/command-hygiene\.ts$/i,
  /(^|\/)packages\/core\/src\/policy\/policy-engine\.ts$/i,
  /(^|\/)packages\/core\/src\/policy\/autopilot-command-gate\.ts$/i,
  /(^|\/)packages\/core\/src\/policy\/deferred-command-queue\.ts$/i,
  /(^|\/)packages\/core\/src\/scheduler\/scheduler\.ts$/i,
];

const POLICY_SCHEDULER_PATTERNS = [
  new RegExp('(^|/)packages/core/src/policy/', 'i'),
  new RegExp('(^|/)packages/core/src/scheduler/', 'i'),
];

const AUTH_SECRETS_PATTERNS = [
  new RegExp('(^|/)(?:auth|oauth)(?:[/. _-]|$)', 'i'),
  new RegExp(
    '(^|/)(?:secret|secrets|token|tokens|credential|credentials)(?:[/. _-]|$)',
    'i',
  ),
  new RegExp('(^|/)api[-_]?key(?:[/. _-]|$)', 'i'),
];

const LOCALHOST_DASHBOARD_PATTERNS = [
  /(^|\/)packages\/cli\/src\/ui\/local-dashboard\//i,
  /(^|\/)packages\/cli\/src\/ui\/commands\/localhostCommand\./i,
  /(^|\/)LOCALHOST_DASHBOARD_WIP\.patch$/i,
];

const UI_ONLY_PATTERNS = [
  /(^|\/)packages\/cli\/src\/ui\//i,
  /(^|\/)packages\/cli\/src\/services\/BuiltinCommandLoader\.ts$/i,
];

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function isDocumentationFile(path: string): boolean {
  const normalized = normalizePath(path).toLowerCase();
  return (
    DOCS_EXTENSIONS.has(normalized.slice(normalized.lastIndexOf('.'))) ||
    /(^|\/)(readme|changelog|license|contributing|soul)\.md$/i.test(normalized)
  );
}

function isTestFile(path: string): boolean {
  const normalized = normalizePath(path);
  return TEST_FILE_PATTERN.test(normalized);
}

function isSnapshotFile(path: string): boolean {
  return SNAPSHOT_FILE_PATTERN.test(normalizePath(path));
}

function isGeneratedFile(path: string): boolean {
  const normalized = normalizePath(path);
  return isSnapshotFile(normalized) || GENERATED_FILE_PATTERN.test(normalized);
}

function isDeletion(path: string): boolean {
  return path.startsWith('D\t') || path.startsWith('D ');
}

function stripStatus(path: string): string {
  return path.replace(/^[A-Z0-9]+\s+/, '');
}

function matchesAny(path: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(path));
}

export function scanDiffRisk(
  changedPaths: readonly string[],
): DiffRiskScanResult {
  const normalizedEntries = changedPaths
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  const paths = normalizedEntries.map((entry) => stripStatus(entry));
  const deletedPaths = normalizedEntries.filter((entry) => isDeletion(entry));
  const normalizedPaths = paths.map(normalizePath);

  const categories = new Set<DiffRiskCategory>();
  const reasons: string[] = [];
  const narrowTests = new Set<string>();

  const hasDocsOnly =
    normalizedPaths.length > 0 &&
    normalizedPaths.every((path) => isDocumentationFile(path));
  const hasTestsChanged = normalizedPaths.some((path) => isTestFile(path));
  const hasSourceChanged = normalizedPaths.some(
    (path) => !isDocumentationFile(path) && !isTestFile(path),
  );
  const hasSnapshotsChanged = normalizedPaths.some((path) =>
    isSnapshotFile(path),
  );
  const hasGeneratedChanged = normalizedPaths.some((path) =>
    isGeneratedFile(path),
  );
  const hasDeletion = deletedPaths.length > 0;
  const hasPolicyScheduler = normalizedPaths.some((path) =>
    matchesAny(path, POLICY_SCHEDULER_PATTERNS),
  );
  const hasHighRiskCore = normalizedPaths.some((path) =>
    matchesAny(path, HIGH_RISK_CORE_PATTERNS),
  );
  const hasAuthSecrets = normalizedPaths.some((path) =>
    matchesAny(path, AUTH_SECRETS_PATTERNS),
  );
  const hasLocalhostDashboard = normalizedPaths.some((path) =>
    matchesAny(path, LOCALHOST_DASHBOARD_PATTERNS),
  );
  const hasUiOnly = normalizedPaths.some((path) =>
    matchesAny(path, UI_ONLY_PATTERNS),
  );
  const testsMissing = hasSourceChanged && !hasTestsChanged;

  if (hasDocsOnly) {
    categories.add('docs-only');
    reasons.push('Only docs-like files changed.');
  }

  if (hasUiOnly && !hasPolicyScheduler && !hasHighRiskCore && !hasAuthSecrets) {
    categories.add('ui-only');
    reasons.push('Change is confined to the CLI UI layer.');
  }

  if (hasPolicyScheduler) {
    categories.add('policy-scheduler-touched');
    reasons.push('Policy or scheduler code changed.');
    narrowTests.add(
      'npm test -w @google/gemini-cli-core --ignore-scripts -- src/policy/policy-engine.test.ts src/policy/autopilot-command-gate.test.ts src/scheduler/scheduler.test.ts',
    );
  }

  if (hasHighRiskCore) {
    categories.add('high-risk-core-touched');
    reasons.push('High-risk core policy or scheduler files changed.');
    narrowTests.add(
      'npm test -w @google/gemini-cli-core --ignore-scripts -- src/policy/policy-engine.test.ts src/policy/autopilot-command-gate.test.ts src/scheduler/scheduler.test.ts',
    );
  }

  if (hasAuthSecrets) {
    categories.add('auth-secrets-touched');
    reasons.push('Auth, OAuth, secrets, or credential-related paths changed.');
  }

  if (hasSnapshotsChanged || hasGeneratedChanged) {
    categories.add('generated-snapshots-changed');
    reasons.push('Generated or snapshot files changed.');
  }

  if (hasTestsChanged) {
    categories.add('tests-changed');
    reasons.push('Test files changed.');
  }

  if (testsMissing) {
    categories.add('tests-missing');
    reasons.push('Source changed without any tests changed in the diff.');
  }

  if (hasDeletion) {
    categories.add('deletions-present');
    reasons.push('Deleted files are present in the diff.');
  }

  if (hasLocalhostDashboard) {
    categories.add('localhost-dashboard-touched');
    reasons.push('Localhost dashboard or command wiring changed.');
    narrowTests.add(
      'npm test -w @google/gemini-cli --ignore-scripts -- src/ui/commands/localhostCommand.test.ts src/ui/local-dashboard/DashboardServer.test.ts',
    );
  }

  if (hasSnapshotsChanged) {
    narrowTests.add(
      'npm test -w @google/gemini-cli --ignore-scripts -- src/ui/cockpit/components/StaticCockpitPanel.test.tsx',
    );
  }

  if (hasUiOnly && !hasLocalhostDashboard) {
    narrowTests.add(
      'npm test -w @google/gemini-cli --ignore-scripts -- src/ui/cockpit/components/StaticCockpitPanel.test.tsx',
    );
  }

  if (
    hasDocsOnly &&
    normalizedPaths.some((path) => /README|SOUL|AGENTS/i.test(path))
  ) {
    reasons.push('Docs-only change does not need broad tests.');
  }

  if (testsMissing && hasUiOnly) {
    narrowTests.add(
      'npm test -w @google/gemini-cli --ignore-scripts -- src/ui/commands/cockpitCommand.test.ts src/ui/cockpit/CockpitState.test.ts',
    );
  }

  const level: DiffRiskLevel =
    hasAuthSecrets || hasHighRiskCore || hasDeletion
      ? 'high'
      : hasPolicyScheduler ||
          hasLocalhostDashboard ||
          hasSnapshotsChanged ||
          testsMissing
        ? 'medium'
        : hasDocsOnly
          ? 'low'
          : hasUiOnly && !testsMissing
            ? 'low'
            : 'medium';

  const humanReviewRecommended =
    level === 'high' ||
    hasAuthSecrets ||
    hasDeletion ||
    hasHighRiskCore ||
    hasPolicyScheduler;

  const broadTestsUnnecessary =
    hasDocsOnly ||
    (hasSnapshotsChanged && !hasSourceChanged) ||
    (hasUiOnly && !testsMissing && !hasPolicyScheduler && !hasHighRiskCore);

  if (narrowTests.size === 0 && hasSourceChanged) {
    narrowTests.add(
      'npm test -w @google/gemini-cli --ignore-scripts -- src/ui/cockpit/components/StaticCockpitPanel.test.tsx',
    );
  }

  return {
    level,
    categories: [...categories],
    reasons,
    suggestedNarrowTests: [...narrowTests],
    broadTestsUnnecessary,
    humanReviewRecommended,
  };
}
