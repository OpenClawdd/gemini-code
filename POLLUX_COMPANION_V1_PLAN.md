# Pollux Companion v1 Plan

Pollux should become a real terminal companion without pretending to be an
autonomous agent. v1 is a small, useful presence attached to actual CLI state:
mission phase, Autopilot decisions, deferred commands, and narrow test results.

## Current State

- `/buddy` toggles Pollux visibility.
- Cockpit compact mode can show a short Pollux message.
- Pollux is status copy today, not an animated pet and not a second agent.

## v1 Goals

1. Show meaningful reactions to real events only.
2. Stay quiet during normal editing and inspection.
3. Surface safety-relevant changes: DENY, DEFER, SUPPRESS, failed focused tests.
4. Use compact terminal animation only when it does not shift layout.
5. Keep all behavior local and deterministic.

## Event Inputs

- Autopilot event history: allow, ask, defer, suppress, deny.
- Deferred command queue count and newest reason.
- Mission cockpit phase and risk level.
- Focused test pass/fail summaries.

## Non-Goals

- No autonomous pet mode in v1.
- No remote dashboard control.
- No generated personality text disconnected from state.
- No layout-breaking animation in compact cockpit mode.

## Proposed Milestones

1. Add a small event-to-message reducer for Pollux.
2. Add tests for each safety event message.
3. Add optional low-frame animation behind a feature flag.
4. Wire cockpit and buddy panels to the same reducer.
5. Revisit pet mode only after the reducer is useful and quiet.
