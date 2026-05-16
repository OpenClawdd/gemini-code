/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AutopilotMode,
  getAutopilotMode,
  setAutopilotMode,
} from '@google/gemini-cli-core';
import {
  CommandKind,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

function parseAutopilotMode(value: string): AutopilotMode | undefined {
  switch (value) {
    case 'off':
      return AutopilotMode.OFF;
    case 'attended':
      return AutopilotMode.ATTENDED;
    case 'unattended':
      return AutopilotMode.UNATTENDED;
    default:
      return undefined;
  }
}

export const autopilotCommand: SlashCommand = {
  name: 'autopilot',
  description: 'Set gemini-code Autopilot mode.',
  kind: CommandKind.BUILT_IN,
  isSafeConcurrent: true,
  action: async (context, args): Promise<SlashCommandActionReturn> => {
    const subcommand = args.trim().toLowerCase();

    if (!subcommand || subcommand === 'status') {
      return {
        type: 'message',
        messageType: 'info',
        content: `Autopilot is ${getAutopilotMode()}.`,
      };
    }

    const mode = parseAutopilotMode(subcommand);
    if (!mode) {
      return {
        type: 'message',
        messageType: 'error',
        content: 'Usage: /autopilot [off|attended|unattended|status]',
      };
    }

    setAutopilotMode(mode);
    context.services.agentContext?.config
      .getPolicyEngine()
      .setAutopilotMode(mode);

    return {
      type: 'message',
      messageType: 'info',
      content:
        mode === AutopilotMode.UNATTENDED
          ? 'Autopilot unattended. Approval-needed commands will be deferred, not prompted.'
          : `Autopilot ${mode}.`,
    };
  },
};
