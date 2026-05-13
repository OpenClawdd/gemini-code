# Pollux Companion v1 Plan

Pollux v1 should make gemini-code feel alive without becoming noisy, fake, or
hard to turn off. This is a plan only; pet mode is not implemented here.

## Goals

- Add a tiny ASCII terminal creature mode that fits inside the compact cockpit.
- React only to real events: mission accepted, command deferred, command denied,
  command suppressed, validation passed, validation failed, and localhost
  dashboard state changes.
- Keep messages short, practical, and sparse.
- Preserve the current off switch: `/buddy off` must hide Pollux completely.

## Moods

- `idle`: quiet, no work in flight.
- `watching`: mission active, waiting for the next real event.
- `thinking`: tool activity or analysis is in progress.
- `blocked`: command denied, command deferred, or validation failed.
- `cheering`: narrow tests pass, mission completes, or a risky command is safely
  avoided.
- `sleepy`: unattended mode is active and Pollux is monitoring quietly.

## UX rules

- No spam. One event should produce at most one visible reaction.
- No fake claims. Pollux must not say tests passed, files changed, or commands
  ran unless a real event proves it.
- No pressure copy: avoid “remember to,” “don’t forget,” and ritual nags.
- Keep compact cockpit integration first. If the cockpit is visible, Pollux uses
  the compact header/status slot rather than duplicating a panel.
- Accessibility matters: text-only, no rapid animation, and `/buddy off` remains
  respected everywhere.

## Implementation outline

1. Add a typed `PolluxEvent` union for real runtime events.
2. Route policy/scheduler outcomes into Pollux through a single event adapter.
3. Add a small ASCII renderer with a static fallback for narrow terminals.
4. Add debounce/de-duplication so repeated scheduler updates do not chatter.
5. Add settings or command controls for: off, status-only, and creature mode.

## Tests needed

- Pollux reacts once per deferred command.
- Pollux reacts once per denied command.
- Pollux does not react to synthetic/unproven success states.
- Pollux remains hidden after `/buddy off`.
- Compact cockpit shows Pollux without expanding full details.
- Creature mode falls back to status-only in narrow or non-interactive contexts.
