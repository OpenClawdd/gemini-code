/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CommandClass {
  SIMPLE_READ_ONLY = 'SimpleReadOnly',
  COMPOUND_READ_ONLY = 'CompoundReadOnly',
  RISKY = 'Risky',
  DANGEROUS = 'Dangerous',
}

const safeReadOnlyTools = ['ls', 'cat', 'grep', 'pwd', 'which'];

const readOnlySubcommands: Record<string, string[]> = {
  git: [
    'status',
    'log',
    'branch',
    'diff',
    'show',
    'rev-parse',
    'remote',
    'ls-files',
    'describe',
  ],
};

const mutationPatterns = [
  /\brm\b/i,
  /\bmv\b/i,
  /\bcp\b/i,
  /\btouch\b/i,
  /\bmkdir\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bdd\b/i,
  /\bsudo\b/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /\bssh\b/i,
  /\bscp\b/i,
  /\bftp\b/i,
  /\btelnet\b/i,
  /\bnetcat\b/i,
  /\bnc\b/i,
  /\bgit\s+push\b/i,
  /\bgit\s+commit\b/i,
  /\bgit\s+tag\b/i,
];

/**
 * Classifies a shell command for safety hygiene.
 */
export function classifyCommand(command: string): CommandClass {
  const trimmed = command.trim();
  if (!trimmed) return CommandClass.SIMPLE_READ_ONLY; // Empty is harmless

  const hasCompoundOperator = /[&|;><]/.test(trimmed);
  const hasRedirection = /[><]/.test(trimmed);
  const hasPipe = /\|/.test(trimmed);

  // Split into parts to check first tool
  const parts = trimmed.split(/\s+/);
  const tool = parts[0].toLowerCase();

  const isSafeTool = safeReadOnlyTools.includes(tool);
  const isReadOnlyGit =
    tool === 'git' &&
    parts.length > 1 &&
    readOnlySubcommands['git'].includes(parts[1].toLowerCase());

  const isReadOnlyCommand = isSafeTool || isReadOnlyGit;

  // Check for mutation patterns anywhere in the command
  if (mutationPatterns.some((pattern) => pattern.test(trimmed))) {
    return CommandClass.DANGEROUS;
  }

  if (hasCompoundOperator || hasRedirection || hasPipe) {
    return isReadOnlyCommand
      ? CommandClass.COMPOUND_READ_ONLY
      : CommandClass.RISKY;
  }

  if (isReadOnlyCommand) {
    return CommandClass.SIMPLE_READ_ONLY;
  }

  return CommandClass.RISKY;
}
