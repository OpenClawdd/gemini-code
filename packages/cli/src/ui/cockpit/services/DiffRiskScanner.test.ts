/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import { scanDiffRisk } from './DiffRiskScanner.js';

describe('scanDiffRisk', () => {
  it('treats README-only changes as low risk', () => {
    const result = scanDiffRisk(['README.md']);

    expect(result.level).toBe('low');
    expect(result.categories).toContain('docs-only');
    expect(result.broadTestsUnnecessary).toBe(true);
    expect(result.humanReviewRecommended).toBe(false);
    expect(result.reasons.join(' ')).toContain('docs-like');
  });

  it('flags policy engine changes as high risk with core tests', () => {
    const result = scanDiffRisk(['packages/core/src/policy/policy-engine.ts']);

    expect(result.level).toBe('high');
    expect(result.categories).toContain('policy-scheduler-touched');
    expect(result.categories).toContain('high-risk-core-touched');
    expect(result.humanReviewRecommended).toBe(true);
    expect(result.suggestedNarrowTests.join(' ')).toContain(
      'policy-engine.test.ts',
    );
    expect(result.suggestedNarrowTests.join(' ')).toContain(
      'scheduler.test.ts',
    );
  });

  it('flags scheduler changes as high risk', () => {
    const result = scanDiffRisk(['packages/core/src/scheduler/scheduler.ts']);

    expect(result.level).toBe('high');
    expect(result.categories).toContain('policy-scheduler-touched');
    expect(result.categories).toContain('high-risk-core-touched');
    expect(result.humanReviewRecommended).toBe(true);
  });

  it('flags localhost dashboard changes as medium risk', () => {
    const result = scanDiffRisk([
      'packages/cli/src/ui/local-dashboard/DashboardServer.ts',
      'packages/cli/src/ui/commands/localhostCommand.ts',
    ]);

    expect(result.level).toBe('medium');
    expect(result.categories).toContain('localhost-dashboard-touched');
    expect(result.suggestedNarrowTests.join(' ')).toContain(
      'localhostCommand.test.ts',
    );
    expect(result.suggestedNarrowTests.join(' ')).toContain(
      'DashboardServer.test.ts',
    );
  });

  it('flags snapshot changes as medium risk', () => {
    const result = scanDiffRisk([
      'packages/cli/src/ui/components/__snapshots__/StaticCockpitPanel.test.tsx.snap.svg',
    ]);

    expect(result.level).toBe('medium');
    expect(result.categories).toContain('generated-snapshots-changed');
    expect(result.reasons.join(' ')).toContain('snapshot');
  });

  it('flags auth and secrets paths as high risk', () => {
    const result = scanDiffRisk([
      'packages/core/src/code_assist/oauth2.ts',
      'packages/core/src/config/secrets.ts',
    ]);

    expect(result.level).toBe('high');
    expect(result.categories).toContain('auth-secrets-touched');
    expect(result.humanReviewRecommended).toBe(true);
  });

  it('mentions tests missing when source changes without tests', () => {
    const result = scanDiffRisk([
      'packages/cli/src/ui/cockpit/services/DiffRiskScanner.ts',
    ]);

    expect(result.categories).toContain('tests-missing');
    expect(result.reasons.join(' ')).toContain('tests changed');
    expect(result.broadTestsUnnecessary).toBe(false);
  });

  it('flags deletions present in the diff', () => {
    const result = scanDiffRisk(['D packages/core/src/policy/foo.ts']);

    expect(result.categories).toContain('deletions-present');
    expect(result.level).toBe('high');
    expect(result.humanReviewRecommended).toBe(true);
  });
});
