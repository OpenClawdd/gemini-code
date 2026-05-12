# GC v1 Plan: The Professional AI Terminal

## 1. GC v1 Vision

Gemini CLI (GC) v1 aims to be a robust, professional-grade AI agent that feels
like a native extension of the developer's workflow. It moves beyond "chatting
about code" into "orchestrating work" with transparency, speed, and safety.

Key Pillars:

- **Transparency:** Real-time visibility into agent thoughts, risks, and plans
  via the Cockpit.
- **Efficiency:** Silent, auto-allowed verification for common repository tasks.
- **Orchestration:** Delegation to specialized sub-agents with clear boundaries.
- **Safety:** Strict policy enforcement that prevents destructive actions while
  allowing fast read-only checks.

## 2. Current Implemented Foundation

- **Autopilot v2:** Shell hygiene logic with auto-allow for simple read-only
  commands and explicit gating for compound/risky operators.
- **Cockpit v0.5:** Functional CLI overlay with Phase tracking, Risk scanning
  (Mission Council), and truncated Mission Goals.
- **Policy Engine:** Extensible gate logic in `autopilot-command-gate.ts`.
- **Mission Lifecycle:** Structured `/mission` command that generates executable
  briefs.

## 3. Missing v1 Systems

- **Localhost Cockpit Dashboard:** A read-only web view of the Cockpit for
  better visibility during long tasks.
- **Real Subagent Registry:** Formalized management of specialized agents
  (Coder, Tester, Reviewer) with persistent state.
- **Model Council Specialist Lanes:** Dynamic routing of sub-tasks based on
  expertise (e.g., UI vs. Backend).
- **Autopilot Event History:** Persistent log of all tool calls, decisions, and
  outcomes for audit and Pollux (Buddy) feedback.
- **Simple Customization:** User-defined "safe" command aliases and
  project-specific safety rules.

## 4. Recommended First Implementation Slice: Autopilot Event History

**Reason:** Lowest risk, highest immediate value.

- Provides the data foundation for both the Localhost Dashboard and Pollux
  (Buddy) reactions.
- Enhances transparency without changing tool execution internals.
- Safe to implement as an observer pattern.

## 5. Implementation Plan (First Slice)

1. **Define Event Schema:** Create a structured `AutopilotEvent` type
   (timestamp, command, decision, reason, outcome).
2. **Event Bus/Store:** Implement a simple, in-memory (or local temp file) event
   store.
3. **Hook Integration:** Attach listeners to `evaluateAutopilotCommand` and
   shell tool execution to capture events.
4. **Pollux (Buddy) Wiring:** Allow Buddy components to consume the event
   history for reactive feedback.

## 6. Test Plan

- **Unit Tests:** Verify event capture for ALLOW, ASK, and DENY decisions.
- **Integration Tests:** Ensure event history survives across turns in a
  session.
- **Performance Tests:** Verify that event logging does not add latency to tool
  execution.

## 7. Risks

- **Context Bloat:** Storing too much history might impact memory if not handled
  carefully (must be separate from LLM context).
- **Concurrency:** Ensure event logging is thread-safe for parallel tool calls.
- **Privacy:** Ensure no sensitive command outputs (secrets) are leaked into the
  event log.

## 8. What Not to Claim Yet

- We do NOT have multi-agent autonomous swarm capabilities.
- We do NOT have a persistent database for long-term project memory across
  different sessions.
- We do NOT have auto-fixing for complex build failures yet.

---

_Created by Gemini CLI (Shower Mode)_
