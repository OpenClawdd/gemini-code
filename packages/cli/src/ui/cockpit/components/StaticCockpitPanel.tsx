/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { useCockpitState } from '../CockpitState.js';
import { PhaseStatusPanel } from './PhaseStatusPanel.js';
import { MissionPanel } from './MissionPanel.js';
import { CouncilPanel } from './CouncilPanel.js';
import { useBuddyState } from '../../companion/BuddyState.js';

export const StaticCockpitPanel: React.FC = () => {
  const {
    missionBrief,
    missionCouncil,
    phase: activePhase,
    detailsExpanded,
    latestEvent,
    recentEvents,
  } = useCockpitState();
  const buddy = useBuddyState();

  const riskLevel = missionCouncil?.riskOfficer.riskLevel ?? 'Safe';
  const riskColor =
    riskLevel === 'Safe' ? 'green' : riskLevel === 'Medium' ? 'yellow' : 'red';
  const nextAction = missionCouncil?.finalRoute.firstAction;

  const statusColor =
    buddy.mood === 'blocked'
      ? 'red'
      : buddy.mood === 'protective'
        ? 'yellow'
        : buddy.mood === 'busy'
          ? 'blue'
          : 'cyan';

  return (
    <Box
      borderStyle="round"
      borderColor={statusColor}
      flexDirection="column"
      paddingX={1}
      marginBottom={1}
      flexShrink={0}
    >
      <Box justifyContent="space-between">
        <Box>
          <Text bold color={statusColor}>
            GC COCKPIT
          </Text>
          <Text dimColor>
            {' '}
            · F10 {detailsExpanded ? 'collapse' : 'details'}
          </Text>
        </Box>
        <Box>
          <Text dimColor>Pollux: </Text>
          <Text italic color="magenta">
            {buddy.message}
          </Text>
        </Box>
      </Box>

      <PhaseStatusPanel activePhase={activePhase} />

      {latestEvent && !detailsExpanded && (
        <Box marginTop={1}>
          <Box width={12}>
            <Text dimColor>Activity:</Text>
          </Box>
          <Text
            color={
              latestEvent.decision === 'deny'
                ? 'red'
                : latestEvent.decision === 'allow'
                  ? 'green'
                  : 'yellow'
            }
          >
            [{latestEvent.decision.toUpperCase()}] {latestEvent.command}
          </Text>
        </Box>
      )}

      {detailsExpanded ? (
        <>
          {missionBrief && (
            <MissionPanel
              brief={missionBrief}
              council={missionCouncil ?? undefined}
            />
          )}
          {missionCouncil && <CouncilPanel result={missionCouncil} />}

          {recentEvents.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold dimColor>
                RECENT ACTIVITY
              </Text>
              {recentEvents.map((event) => (
                <Box key={event.id} marginLeft={1}>
                  <Box width={11}>
                    <Text
                      color={
                        event.decision === 'deny'
                          ? 'red'
                          : event.decision === 'allow'
                            ? 'green'
                            : 'yellow'
                      }
                    >
                      {event.decision.toUpperCase()}
                    </Text>
                  </Box>
                  <Text>{event.command}</Text>
                </Box>
              ))}
            </Box>
          )}
        </>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Box width={12}>
              <Text dimColor>Mission:</Text>
            </Box>
            <Text color="white" bold>
              {missionBrief?.goal ?? 'No active mission'}
            </Text>
          </Box>
          <Box>
            <Box width={12}>
              <Text dimColor>Risk:</Text>
            </Box>
            <Text color={riskColor}>{riskLevel}</Text>
          </Box>
          {nextAction && !latestEvent && (
            <Box>
              <Box width={12}>
                <Text dimColor>Next:</Text>
              </Box>
              <Text>{nextAction}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
