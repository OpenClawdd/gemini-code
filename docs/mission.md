# Mission Runner

`/mission` is the gemini-code mission loop. It is no longer only a prompt
stretcher.

## Usage

```bash
/mission <task>
/mission plan <task>
/mission ship <task>
```

`/mission <task>` runs Phase 1 of the mission loop:

- activates the cockpit mission state
- scans the task for destructive intent
- runs a narrow read-only repo inspection
- builds a small execution plan
- stops before file edits if the task requires editing

`/mission plan <task>` preserves the old brief-only behavior. It submits the
existing mission-brief prompt to Gemini and tells the model not to use tools,
edit files, or run commands.

`/mission ship <task>` records ship intent, but commit and push are not wired in
Phase 1. Shipping must wait until validation has run after real edits and the
user explicitly confirms the commit/push step.

## Current Execution Policy

Mission Runner only auto-runs a small read-only allowlist:

- `git rev-parse --abbrev-ref HEAD`
- `git status -sb`
- `git diff --stat`
- `git diff --check`
- `git diff --cached --stat`
- `ls`
- `ls -la`
- `ls -1`
- `pwd`

Compound shell syntax is blocked for Mission Runner inspection commands. Push,
reset, clean, remove, sudo, secret-file reads, and environment dumps are
blocked.

## Current Limitation

`EDIT_FILE` does not edit yet. When a mission needs file changes, Mission Runner
prints a clear limitation and stops before validation:

> EDIT_FILE execution is not wired to the existing Gemini file-edit tool path
> yet. Mission Runner stopped before validation; no files were edited.

This is intentional. Do not claim `/mission` can code until `EDIT_FILE` is
connected to the existing Gemini/file-edit tool path.

## Implementation Notes

The built-in command is registered through
`packages/cli/src/services/BuiltinCommandLoader.ts`, which imports
`packages/cli/src/ui/commands/missionCommand.ts`.

The runner uses `ShellExecutionService` for read-only Phase 1 inspection
commands. It does not use `execSync`.

The next smallest implementation step is to connect `EDIT_FILE` to the existing
Gemini edit/tool path, then run focused validation and gate ship mode behind
validation success plus explicit confirmation.
