/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getLocalDashboardStatus,
  startLocalDashboard,
  stopLocalDashboard,
} from '../local-dashboard/DashboardServer.js';
import {
  CommandKind,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

function formatStatus(): string {
  const status = getLocalDashboardStatus();
  return status.running
    ? `Localhost dashboard running at ${status.url}.`
    : 'Localhost dashboard stopped.';
}

export const localhostCommand: SlashCommand = {
  name: 'localhost',
  description: 'Manage the optional gemini-code localhost dashboard.',
  kind: CommandKind.BUILT_IN,
  isSafeConcurrent: true,
  action: async (_context, args): Promise<SlashCommandActionReturn> => {
    const subcommand = args.trim().toLowerCase();

    if (!subcommand || subcommand === 'status') {
      return { type: 'message', messageType: 'info', content: formatStatus() };
    }

    if (subcommand === 'start' || subcommand === 'on') {
      const status = await startLocalDashboard();
      return {
        type: 'message',
        messageType: 'info',
        content: `Localhost dashboard running at ${status.url}.`,
      };
    }

    if (subcommand === 'stop' || subcommand === 'off') {
      await stopLocalDashboard();
      return {
        type: 'message',
        messageType: 'info',
        content: 'Localhost dashboard stopped.',
      };
    }

    return {
      type: 'message',
      messageType: 'error',
      content: 'Usage: /localhost [status|start|stop|on|off]',
    };
  },
};
