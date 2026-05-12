/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  getDeferredCommands,
  clearDeferredCommands,
  updateDeferredStatus,
} from '@google/gemini-cli-core';
import {
  CommandKind,
  type SlashCommand,
  type SlashCommandActionReturn,
} from './types.js';

export const deferredCommand: SlashCommand = {
  name: 'deferred',
  description: 'Manage the deferred command queue.',
  kind: CommandKind.BUILT_IN,
  isSafeConcurrent: true,
  action: async (_context, args): Promise<SlashCommandActionReturn> => {
    const parts = args.trim().split(/\s+/);
    const subcommand = parts[0].toLowerCase();

    if (subcommand === 'list' || !subcommand) {
      const commands = getDeferredCommands();
      if (commands.length === 0) {
        return {
          type: 'message',
          messageType: 'info',
          content: 'No deferred commands in the queue.',
        };
      }

      const list = commands
        .map(
          (c) =>
            `[${c.id.substring(0, 8)}] ${c.status.toUpperCase()}: ${c.command} (${c.reason})`,
        )
        .join('\n');

      return {
        type: 'message',
        messageType: 'info',
        content: `Deferred Commands:\n${list}`,
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

    if (subcommand === 'approve') {
      const id = parts[1];
      if (!id) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'Usage: /deferred approve <id>',
        };
      }
      updateDeferredStatus(id, 'approved');
      return {
        type: 'message',
        messageType: 'info',
        content: `Command ${id} approved (Ready for manual run).`,
      };
    }

    if (subcommand === 'reject') {
      const id = parts[1];
      if (!id) {
        return {
          type: 'message',
          messageType: 'error',
          content: 'Usage: /deferred reject <id>',
        };
      }
      updateDeferredStatus(id, 'rejected');
      return {
        type: 'message',
        messageType: 'info',
        content: `Command ${id} rejected.`,
      };
    }

    return {
      type: 'message',
      messageType: 'error',
      content: 'Usage: /deferred [list|clear|approve <id>|reject <id>]',
    };
  },
};
