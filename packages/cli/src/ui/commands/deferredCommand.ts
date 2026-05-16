/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearDeferredCommands,
  listDeferredCommands,
} from '@google/gemini-cli-core';
import {
  CommandKind,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

function formatDeferredCommands(): string {
  const records = listDeferredCommands();
  if (records.length === 0) {
    return 'No deferred commands.';
  }

  return records
    .map((record) => `${record.id}. ${record.command} — ${record.reason}`)
    .join('\n');
}

export const deferredCommand: SlashCommand = {
  name: 'deferred',
  description: 'List or clear commands deferred by Autopilot.',
  kind: CommandKind.BUILT_IN,
  isSafeConcurrent: true,
  action: async (_context, args): Promise<SlashCommandActionReturn> => {
    const subcommand = args.trim().toLowerCase();

    if (!subcommand || subcommand === 'list') {
      return {
        type: 'message',
        messageType: 'info',
        content: formatDeferredCommands(),
      };
    }

    if (subcommand === 'clear') {
      clearDeferredCommands();
      return {
        type: 'message',
        messageType: 'info',
        content: 'Deferred command queue cleared.',
      };
    }

    return {
      type: 'message',
      messageType: 'error',
      content: 'Usage: /deferred [list|clear]',
    };
  },
};
