/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MissionCouncilResult {
  scout: {
    contextNeeded: string[];
  };
  architect: {
    proposedStructure: string[];
  };
  riskOfficer: {
    riskLevel: 'Safe' | 'Medium' | 'Risky' | 'Blocked';
    protectedZones: string[];
    reasons: string[];
  };
  testCaptain: {
    testStrategy: string[];
  };
  critic: {
    potentialFlaws: string[];
  };
  finalRoute: {
    firstAction: string;
    lanes: string[];
  };
}

export function createMissionCouncilResult(
  request: string,
): MissionCouncilResult {
  const scout: MissionCouncilResult['scout'] = {
    contextNeeded: [],
  };
  const architect: MissionCouncilResult['architect'] = {
    proposedStructure: ['Default procedural execution'],
  };
  const riskOfficer: MissionCouncilResult['riskOfficer'] = {
    riskLevel: 'Safe',
    protectedZones: ['No protected zones identified yet'],
    reasons: ['No explicit protected zone detected yet.'],
  };
  const testCaptain: MissionCouncilResult['testCaptain'] = {
    testStrategy: ['Standard verification'],
  };
  const critic: MissionCouncilResult['critic'] = {
    potentialFlaws: [],
  };

  const normalizedRequest = request.toLowerCase();

  const lanes = ['scout', 'surgeon', 'test-captain'];

  if (
    normalizedRequest.includes('without touching auth') ||
    normalizedRequest.includes('do not touch auth')
  ) {
    riskOfficer.riskLevel = 'Medium';
    riskOfficer.protectedZones = [
      'auth',
      'OAuth',
      'credentials',
      'token storage',
    ];
    riskOfficer.reasons = [
      'User explicitly said not to touch auth-related code.',
    ];
    lanes.push('risk-officer');
  }

  if (
    normalizedRequest.includes('refactor') ||
    normalizedRequest.includes('redesign') ||
    normalizedRequest.includes('architect')
  ) {
    lanes.push('architect');
    architect.proposedStructure = ['Multi-phase structural refactor'];
  }

  if (
    normalizedRequest.includes('ui') ||
    normalizedRequest.includes('css') ||
    normalizedRequest.includes('cockpit')
  ) {
    lanes.push('ux-voice');
  }

  if (normalizedRequest.includes('search')) {
    scout.contextNeeded.push('Identify which search system the user means');
  }

  const finalRoute: MissionCouncilResult['finalRoute'] = {
    firstAction: 'Inspect likely files before editing',
    lanes: [...new Set(lanes)],
  };

  return {
    scout,
    architect,
    riskOfficer,
    testCaptain,
    critic,
    finalRoute,
  };
}
