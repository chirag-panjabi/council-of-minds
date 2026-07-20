# ADR-003: Use mode-qualified session routes

**Date:** 2026-07-16
**Status:** Accepted

## Context

The specifications refer to several incompatible chat URLs. Search, history, deep links, error handling, and restoration need one stable identity for every persistent session.

## Decision

Persistent conversations use mode-qualified routes: `/chat/1-on-1/[sessionId]` and `/chat/council/[sessionId]`. Creating a persistent chat generates a durable session ID before navigation. A route resolver validates that the stored session exists and matches the requested mode.

## Rationale

The route identifies both the interaction model and the exact session, so links, history entries, search results, and reload recovery all use the same canonical target.

## Trade-offs

Route handling is more explicit than a generic `/chat/[id]` page, and mode transitions require deliberate creation or conversion rules rather than URL rewriting.

## Consequences and mitigations

- Route helpers, not ad hoc string construction, generate all session links.
- Missing, malformed, or mode-mismatched IDs render a recoverable not-found state instead of silently opening a different chat.
- Incognito sessions are not assigned persistent IDs or history entries; their lifecycle is governed by ADR-007.

## Revisit trigger

Revisit if sessions become server-synced, shareable, collaboratively editable, or if a mode-neutral conversation model replaces the two current modes.
