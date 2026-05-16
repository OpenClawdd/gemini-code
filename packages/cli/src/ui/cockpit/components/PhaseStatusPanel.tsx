/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { PHASES, type Phase } from '../CockpitState.js';
import { useCockpitState } from '../CockpitState.js';

interface PhaseStatusPanelProps {
  activePhase: Phase;
}

export const PhaseStatusPanel: React.FC<PhaseStatusPanelProps> = ({
  activePhase,
}) => {
  const { skippedPhases } = useCockpitState();
  const activeIndex = PHASES.indexOf(activePhase);

  return (
    <Box flexDirection="row" flexWrap="wrap">
      {PHASES.map((phase, index) => {
        const isSkipped = skippedPhases.includes(phase);
        const isCompleted = index < activeIndex && !isSkipped;
        const isActive = index === activeIndex && !isSkipped;
        const isFuture = index > activeIndex && !isSkipped;

        let icon = '  ';
        let color: string | undefined;
        let dim = false;
        let strikethrough = false;

        if (isSkipped) {
          icon = '○ ';
          dim = true;
          strikethrough = true;
        } else if (isCompleted) {
          icon = '✔ ';
          color = 'green';
        } else if (isActive) {
          icon = '● ';
          color = 'yellow';
        } else if (isFuture) {
          dim = true;
        }

        return (
          <Box key={phase} marginRight={1}>
            <Text
              color={color}
              dimColor={dim}
              bold={isActive}
              strikethrough={strikethrough}
            >
              {icon}
              {phase}
            </Text>
            {index < PHASES.length - 1 && (
              <Box marginLeft={1}>
                <Text dimColor> → </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
