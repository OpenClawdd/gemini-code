# AGENTS.md

This repo is not just upstream Gemini CLI with a new name. gemini-code is a fork
that keeps the Gemini CLI engine and adds a mission-control layer for coding
work. Agents working here should understand the cockpit, Autopilot, and
deferred-command surfaces before changing behavior.

## Product Truth

gemini-code is a terminal coding cockpit built on Gemini CLI.

The upstream engine still provides auth, model access, tools, MCP, sandboxing,
slash-command plumbing, React/Ink UI, and the scheduler. The fork adds:

- mission briefs through `/mission`
- a cockpit overlay through `/cockpit`
- command hygiene and Autopilot policy checks
- unattended-mode deferral instead of surprise execution
- `/deferred` review commands
- Pollux as a status companion through `/buddy`
- an optional localhost-only dashboard through `/localhost`

Do not describe current v1.1 as AGI, a real swarm, or a proven multi-model
council. MissionCouncil lanes are deterministic role lanes today. Pollux is a
status companion today. Pet mode is future work.

## Main Surfaces

### CLI layer

Most user-facing behavior lives under `packages/cli/src`.

- Built-in slash commands are registered in
  `packages/cli/src/services/BuiltinCommandLoader.ts`.
- `/mission` lives in `packages/cli/src/ui/commands/missionCommand.ts`.
- `/cockpit` lives in `packages/cli/src/ui/commands/cockpitCommand.ts`.
- `/autopilot` lives in `packages/cli/src/ui/commands/autopilotCommand.ts`.
- `/deferred` lives in `packages/cli/src/ui/commands/deferredCommand.ts`.
- `/buddy` lives in `packages/cli/src/ui/commands/buddyCommand.ts`.
- `/localhost` lives in `packages/cli/src/ui/commands/localhostCommand.ts`.

When adding a slash command, add the command file, focused tests, and explicit
registration in `BuiltinCommandLoader.ts`. Keep startup-safe commands optional
and side-effect-free until the user invokes them.

### Core policy layer

Autopilot behavior is split across core policy and scheduler code:

- `packages/core/src/policy/autopilot-command-gate.ts` classifies commands as
  allow, suppress, ask, or deny.
- `packages/core/src/policy/command-hygiene.ts` owns command classification
  details. Do not casually bypass it with ad hoc regexes.
- `packages/core/src/policy/policy-engine.ts` records Autopilot events and turns
  `ASK` into `DEFER` in unattended mode.
- `packages/core/src/scheduler/scheduler.ts` handles `PolicyDecision.DEFER` by
  adding the command to the deferred queue and returning before confirmation or
  execution.
- `packages/core/src/policy/deferred-command-queue.ts` owns UUID-backed queue
  entries, statuses, count, clear, update, and listeners.

Core safety invariants:

- Dangerous commands still `DENY`.
- User-requested validation is `ASK` in attended mode and `DEFER` in unattended
  mode. Do not suppress it as ritual ceremony.
- Tiny docs-only ritual tests may be `SUPPRESS`.
- `DEFER` means the command did not run.
- `DEFER` must not open permission UI.
- Compound read-only commands should not silently bypass the gate.

### Cockpit and mission layer

Cockpit state lives under `packages/cli/src/ui/cockpit`.

- `CockpitState.ts` stores cockpit visibility, current mission, mission brief,
  deterministic council result, phase, expansion state, recent Autopilot events,
  and recent deferred commands.
- `MissionParser.ts` creates the initial brief. It is intentionally conservative
  and does not pretend to know more than it inspected.
- `MissionCouncil.ts` is the deterministic role-lane layer. It detects obvious
  risk cues and suggests lanes like scout, surgeon, test-captain, risk-officer,
  architect, and ux-voice.
- `StaticCockpitPanel.tsx` renders the compact/expanded cockpit and should stay
  dense, honest, and layout-stable.

Do not fill cockpit panels with fake placeholders when data is unknown. Use
plain unknown states like "No active mission" or "Inspect phase will choose the
files."

### Pollux

Pollux state lives in `packages/cli/src/ui/companion/BuddyState.ts`.

Pollux is currently a status companion, not an autonomous animal/pet mode. It
reacts to Autopilot events:

- deny -> blocked
- ask -> protective
- suppress -> steady
- defer -> busy
- allow -> busy

Keep Pollux copy short and state-linked. Avoid generated personality text that
is disconnected from real mission, policy, test, or queue state. Future pet mode
belongs in `POLLUX_COMPANION_V1_PLAN.md` until implemented.

### Localhost dashboard

The dashboard is optional and off by default.

- Server: `packages/cli/src/ui/local-dashboard/DashboardServer.ts`
- Command: `packages/cli/src/ui/commands/localhostCommand.ts`
- Tests: adjacent `*.test.ts` files

It must bind only to `127.0.0.1`. Starting it should require `/localhost start`
or `/localhost on`. CLI startup must not start it implicitly.

## Documentation Truth

Use these files for product identity:

- `README.md` for external-facing identity and command summary.
- `SOUL.md` for product voice, naming, and cockpit laws.
- `POLLUX_COMPANION_V1_PLAN.md` for future Pollux terminal companion work.
- `LOCALHOST_DASHBOARD_WIP.patch` is preserved historical/WIP context. Do not
  delete it casually.

Avoid overclaims:

- Do not say gemini-code beats other tools as fact.
- Do not say Model Council is real multi-model execution.
- Do not say subagents are real parallel autonomous agents unless the code
  proves it.
- Do not say Pollux is a terminal pet yet.
- Do not imply deferred commands ran.

## Development Style

Keep changes narrow and reviewable.

Prefer existing local patterns over new abstractions:

- React/Ink for CLI UI.
- Vitest for tests.
- Existing policy types from `packages/core/src/policy/types.ts`.
- Existing slash-command shape from `packages/cli/src/ui/commands/types.ts`.

For source files, keep the Apache-2.0 header. For docs, keep copy direct and
honest. Avoid grandiose claims and placeholder theater.

## Testing Guidance

Use focused workspace tests. Do not default to root test runs for small changes.

Common focused tests:

```bash
npm test -w @google/gemini-cli-core --ignore-scripts -- src/policy/autopilot-command-gate.test.ts src/policy/policy-engine.test.ts src/scheduler/scheduler.test.ts src/policy/deferred-command-queue.test.ts src/policy/autopilot-state.test.ts
```

```bash
npm test -w @google/gemini-cli --ignore-scripts -- src/ui/commands/autopilotCommand.test.ts src/ui/commands/deferredCommand.test.ts src/ui/commands/localhostCommand.test.ts src/ui/companion/BuddyState.test.ts src/ui/cockpit/components/StaticCockpitPanel.test.tsx
```

For docs-only changes, `git diff --check` is usually enough unless the docs
describe behavior you just changed.

## High-Risk Areas

Treat these as protected unless the task explicitly targets them:

- policy engine behavior
- command hygiene
- deferred-command queue semantics
- scheduler execution flow
- auth and token storage
- sandbox policy and shell parsing
- command approval UI

If touching one of these, add focused tests that prove the invariant, not just
snapshot churn.

## Agent Operating Rules

Before editing, inspect the relevant command, state, policy, and tests. The repo
has several similarly named surfaces, and the safe behavior often depends on the
handoff between packages.

When implementing:

1. Identify whether the change is CLI UI, core policy, scheduler execution, or
   docs.
2. Preserve current Autopilot guarantees.
3. Keep `/localhost` optional and localhost-only.
4. Keep Pollux tied to real state.
5. Prefer narrow tests over broad ceremony.
6. Review the diff for overclaims, stale upstream wording, and accidental
   regressions.

The best gemini-code changes make the cockpit more truthful, more useful, and
less theatrical.
