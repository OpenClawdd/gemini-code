/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LaneDetail {
  id: string;
  confidence: number;
  reason: string;
}

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
    laneDetails?: LaneDetail[];
    overallConfidence: number;
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

  const laneDetails: LaneDetail[] = [
    { id: 'scout', confidence: 1.0, reason: 'Initial discovery is mandatory.' },
    { id: 'surgeon', confidence: 0.9, reason: 'Implementation is expected.' },
    {
      id: 'test-captain',
      confidence: 0.9,
      reason: 'Verification is mandatory.',
    },
  ];

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
    laneDetails.push({
      id: 'risk-officer',
      confidence: 1.0,
      reason: 'Explicit safety boundary detected.',
    });
  }

  if (
    normalizedRequest.includes('refactor') ||
    normalizedRequest.includes('redesign') ||
    normalizedRequest.includes('architect')
  ) {
    architect.proposedStructure = ['Multi-phase structural refactor'];
    laneDetails.push({
      id: 'architect',
      confidence: 0.8,
      reason: 'Structural change requested.',
    });
  }

  if (
    normalizedRequest.includes('ui') ||
    normalizedRequest.includes('css') ||
    normalizedRequest.includes('cockpit')
  ) {
    laneDetails.push({
      id: 'ux-voice',
      confidence: 0.7,
      reason: 'User interface modification detected.',
    });
  }

  if (normalizedRequest.includes('search')) {
    scout.contextNeeded.push('Identify which search system the user means');
  }

  const uniqueLanes = [...new Set(laneDetails.map((l) => l.id))];
  const overallConfidence =
    laneDetails.reduce((sum, l) => sum + l.confidence, 0) / laneDetails.length;

  const finalRoute: MissionCouncilResult['finalRoute'] = {
    firstAction: 'Inspect likely files before editing',
    lanes: uniqueLanes,
    laneDetails,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
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
