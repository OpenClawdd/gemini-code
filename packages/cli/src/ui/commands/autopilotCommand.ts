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

    if (subcommand === 'semi-unattended') {
      setAutopilotMode('semi-unattended');
      return {
        type: 'message',
        messageType: 'info',
        content:
          'Autopilot mode set to SEMI-UNATTENDED (will defer commands needing approval).',
      };
    }

    if (subcommand === 'fully-unattended') {
      setAutopilotMode('fully-unattended');
      return {
        type: 'message',
        messageType: 'info',
        content:
          'Autopilot mode set to FULLY-UNATTENDED (will auto-apply safe edits, defer/block risky actions).',
      };
    }

    // backwards compatibility for 'unattended' mapped to 'semi-unattended'
    if (subcommand === 'unattended') {
      setAutopilotMode('semi-unattended');
      return {
        type: 'message',
        messageType: 'info',
        content:
          'Autopilot mode set to SEMI-UNATTENDED (will defer commands needing approval).',
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
      content:
        'Usage: /autopilot [normal|semi-unattended|fully-unattended|status]',
    };
  },
};
