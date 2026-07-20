# 1-on-1 Chat Specification

## Routes and Purpose

The setup route is /chat/1-on-1. A saved session uses /chat/1-on-1/[sessionId]. The mode provides a direct conversation between the user and one local persona.

## Preconditions

- A selected persona is required.
- The selected provider must be configured and support the requested input capability.
- The UI must explain which provider receives the request before the first message in a session.

## Session Lifecycle

1. The user selects a local persona through the Unified Persona Selector.
2. The user chooses a session-only provider/model override or uses the saved local preference.
3. The user chooses normal or Incognito before sending the first message.
4. The first send creates a session and routes to the mode-qualified session URL unless it is Incognito.
5. The client appends the user message, creates a pending assistant message, streams the response, and commits durable data only after the state is complete.

Selecting a different persona starts a new session after confirmation. It must not silently apply a new system prompt to an existing conversation context.

## Header Controls

- Show the active persona and model.
- Support a session-only provider/model override. Saving a preference updates only local persona configuration and never the portable persona profile.
- Allow rename, export, and delete for saved sessions.
- Incognito can be selected only before the first message. Turning it on after a saved conversation has started offers Start New Incognito Conversation or Cancel.

## Input and Attachments

- The send action remains disabled until a valid provider and compatible model are selected.
- Attachments are validated for MIME type, per-file and per-message limits, and provider capability before a request begins.
- The UI discloses that a supported attachment is sent to the selected provider.
- Stop cancels the active request and leaves a visible cancelled partial-response state. It never silently retries.

## Editing and Regeneration

- Editing a user message creates an explicit branch decision: replace the later messages or cancel. The original history is retained until the replacement branch commits successfully.
- Regeneration creates a new assistant attempt for the same parent message rather than overwriting an existing answer without trace.
- Summaries, token usage, and attachments from discarded branches must be reconciled transactionally.

## Rendering and Accessibility

- User messages and persona messages are visually and programmatically distinguishable.
- Do not expose hidden provider reasoning or remove literal user content by matching text patterns.
- Announce a completed response once rather than every streamed chunk.
- Preserve scroll position when the user has scrolled away from the latest message.

## Acceptance Criteria

- Saved sessions use the canonical mode-qualified route.
- A provider error, abort, timeout, or incompatible attachment produces an actionable inline state.
- Incognito creates no history, analytics, search, export, or recent-persona data.
- Keyboard users can operate persona selection, send, stop, edit, regenerate, and all header actions.
