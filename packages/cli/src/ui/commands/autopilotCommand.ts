/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAutopilotMode, setAutopilotMode } from '@google/gemini-cli-core';
import {
  CommandKind,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

export const autopilotCommand: SlashCommand = {
  name: 'autopilot',
  description: 'Manage Autopilot mode (normal/unattended).',
  kind: CommandKind.BUILT_IN,
  isSafeConcurrent: true,
  action: async (_context, args): Promise<SlashCommandActionReturn> => {
    const subcommand = args.trim().toLowerCase();

    if (subcommand === 'normal') {
      setAutopilotMode('normal');
      return {
        type: 'message',
        messageType: 'info',
        content: 'Autopilot mode set to NORMAL (will prompt for approval).',
      };
    }

    if (subcommand === 'unattended') {
      setAutopilotMode('unattended');
      return {
        type: 'message',
        messageType: 'info',
        content:
          'Autopilot mode set to UNATTENDED (will defer commands needing approval).',
      };
    }

    if (subcommand === 'status' || !subcommand) {
      return {
        type: 'message',
        messageType: 'info',
        content: `Autopilot Mode: ${getAutopilotMode().toUpperCase()}`,
      };
    }

    return {
      type: 'message',
      messageType: 'error',
      content: 'Usage: /autopilot [normal|unattended|status]',
    };
  },
};
