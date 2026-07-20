# Unified Chat Interface Specification

## Purpose

The shared chat interface supplies message history, a header, an input area, streaming states, attachment staging, and safe error handling for both 1-on-1 and Council sessions. Mode-specific behavior is added without duplicating the core interaction model.

## Shared Header

- Editable session title for saved sessions.
- Active participant indicators and session-only model overrides.
- Export and delete actions for non-Incognito sessions.
- A visible normal or Incognito state. Incognito is selected before the first message and cannot silently reclassify existing history.

## Message Model

Each message records a stable identifier, role, creation time, lifecycle state, parent relationship where applicable, displayed persona snapshot, and optional attachment references. A streamed assistant message has pending, complete, failed, or cancelled state.

The interface must distinguish user, assistant, system, and moderation events in both visual presentation and accessible labels. A persona name and avatar identify assistant content in all modes.

## Streaming Behavior

- Only one response stream is active per session.
- A pending bubble appears before time to first token.
- Stop cancels the request and leaves a clear cancelled state.
- Network, provider, validation, and rate-limit errors use actionable inline messages with a retry path only when retrying is safe.
- Live regions announce final response completion, not every token.

## Input Behavior

- The input is an auto-expanding textarea with explicit Send and Stop controls.
- Enter sends only when the focus is in the chat textarea and no modifier key requests a newline.
- Attachments remain in a removable staging area until send.
- A provider capability check occurs before content is submitted.

## Council Additions

Council mode adds a participant roster, sequential turn queue, manual Continue action, per-persona request action, finite Auto-Pilot, synthesis, and direct mentions. These controls follow [Council Specification](./spec_council.md).

## Accessibility

All controls have names, visible focus, keyboard operation, and appropriate disabled-state explanations. Modals trap focus and return it to their trigger. Motion respects reduced-motion preferences.
