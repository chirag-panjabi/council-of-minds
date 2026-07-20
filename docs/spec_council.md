# Council Specification

## Routes and Purpose

The setup route is /chat/council. A saved Council session uses /chat/council/[sessionId]. Council Mode is a moderated, sequential multi-persona conversation that starts with at least two active personas.

## Roster and Roles

- A Council contains two or more active debaters and may contain one separately selected synthesizer.
- A synthesizer may not be chosen from a persona whose required provider is unavailable.
- A persona is represented by a snapshot of its identity and behavior at the time it joins the session so later edits do not rewrite history.
- The MVP provides an accessible ordered queue with Move Earlier and Move Later controls. Drag-and-drop ordering is deferred.
- The roster displays provider/model choice, capability warnings, and estimated request-count impact before a debate begins.

## Execution State Machine

1. **Setup:** select roster, model choices, turn cap, and optional synthesizer.
2. **Ready:** a central prompt may be entered; generation has not begun.
3. **Generating:** exactly one persona has an active stream. All competing generation controls are disabled.
4. **Paused:** the user may Continue, request a specific next persona, send an interjection, synthesize, or end the session.
5. **Completed:** synthesis has finished or the user ended the session.
6. **Failed or Cancelled:** a clear partial state remains and the user can choose a safe next action.

Council generation is sequential. The next turn never starts until the current turn completes, fails, or is cancelled.

## Turn Controls and Cost Safety

- Manual stepping is the default.
- Auto-Pilot is off by default.
- The default generation limit is six turns. The user may select a hard cap from one through twelve generated turns.
- Enabling Auto-Pilot requires a confirmation showing the cap and that each turn can incur provider cost.
- The user can stop the active stream or end Auto-Pilot at any time.
- A request for a specific persona consumes one turn and then returns control to the ordered queue.
- Direct mentions target a named persona only for the next response; multiple or unresolved mentions require clarification rather than guessing.

## Synthesis

Synthesize is enabled only when a valid synthesizer is selected and no generation is active. It sends the current approved conversation context to that persona, produces a final result, and marks the debate complete. The user may start a new Council session without deleting the completed one.

## Context and Summarization

- Raw message retention and background summarization are independently configured.
- Summarization is off by default.
- Enabling it requires an explicit provider/model choice and a disclosure that older conversation content is sent to that provider.
- A summary is clearly delimited as untrusted conversation-derived context; it cannot override application policy or persona configuration.
- A summarization failure falls back to the configured raw-message window and shows a non-blocking warning.

## Incognito and Data

Incognito must be selected before the first prompt. It remains memory-only: no messages, summaries, token usage, search index entries, exports, recent-persona updates, or session metadata may be persisted. Provider egress still occurs for generation.

## Attachments and Editing

An attachment is evaluated for every persona/provider that would receive it. If any planned recipient lacks support, the interface blocks the request and explains the available choices. Editing a message pauses the Council and requires a branch/replace confirmation; it cancels active work and reconciles derived summaries and usage records before resuming.

## Acceptance Criteria

- No Council session has more than one active stream.
- Auto-Pilot cannot run without a finite cap and explicit cost confirmation.
- Each turn, cancellation, provider failure, queue edit, and synthesis transition is visible and recoverable.
- The roster, queue, and moderator controls are fully keyboard accessible.
