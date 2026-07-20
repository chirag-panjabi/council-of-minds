# ADR-005: Execute Council turns sequentially with hard cost controls

**Date:** 2026-07-16
**Status:** Accepted

## Context

Council discussions can multiply provider calls, cost, and latency. Earlier material implied both simultaneous streams and sequential debate, and left Auto-Pilot and summarization insufficiently bounded.

## Decision

Council generates persona turns sequentially. Each run defaults to six generated turns and permits a user-selected range of one through twelve, with twelve as a hard cap. Auto-Pilot is off by default. The user confirms the planned run and its available or explicitly unknown cost estimate before execution. Summarization is opt-in and off by default.

## Rationale

Sequential turns preserve conversational context and make speaker order, cancellation, and spend visible. A firm cap prevents accidental unbounded automation.

## Trade-offs

Sequential execution takes longer than parallel calls, and cost estimates may be incomplete when a provider lacks usable pricing or token data.

## Consequences and mitigations

- The UI shows the queue, completed turns, remaining turn allowance, and the active speaker.
- Cancellation stops future turns; retries and partial responses are recorded explicitly rather than being treated as complete turns.
- Estimates label unknown values as unknown, and confirmation is requested again when a meaningful run configuration changes.

## Revisit trigger

Revisit if user research supports parallel sub-deliberations, providers add reliable cost telemetry, or an alternative orchestration design can preserve the same spend and cancellation guarantees.
