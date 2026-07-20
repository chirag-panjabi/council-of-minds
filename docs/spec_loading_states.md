# Loading States and Skeletons Specification

## Overview

`IndexedDB` reads and writes are asynchronous, and model requests can take significant time. Loading feedback must communicate the current operation without hiding the interface, causing duplicate actions, or relying on motion alone.

## 1. Initial Local Data Fetch

- **Source:** Heavy pages such as Dashboard, chat history, and persona selectors read durable records from `IndexedDB`, not `localStorage`.
- **Skeletons:** Show layout-matched placeholders for the chat-history list and persona grid rather than a blank screen. Mark the affected region `aria-busy="true"` and provide a concise text status for assistive technology.
- **Completion and failure:** Replace skeletons with data, an intentional empty state, or an inline retryable error. Do not leave an indefinite skeleton if `IndexedDB` is unavailable or blocked.
- **Motion:** Shimmer is decorative only. It must be disabled or substantially reduced for `prefers-reduced-motion` and must have sufficient non-animated contrast to remain understandable.

## 2. Model Requests and Streaming

- **Initial wait:** Create the pending assistant/message state immediately and identify the active persona or Council turn in visible text. A polite live region may announce one status such as “Waiting for Ada's response”; it must not announce every animation frame.
- **Streaming:** Append received text in the pending message. Preserve the complete visible text and offer an accessible `Stop generating` control while a request is active.
- **Scroll behavior:** Auto-scroll only while the reader remains at the bottom. If they scroll upward, preserve their reading position and offer a keyboard-reachable “Jump to latest” control.
- **Council state:** Show the active turn and the next orchestration stage in text, not only through an animated indicator. Partial outputs and retry/cancel results must follow the Council execution rules.
- **Request failure:** Replace the pending state with a clear error and a retry option where safe. Do not silently discard the user's draft or attachment staging state.

## 3. Page Transitions

- A thin top progress indicator may acknowledge route changes that take long enough to be perceptible.
- The destination page heading receives focus after a completed route change. A transition indicator must not steal focus, block navigation, or convey its state only by color or animation.

## 4. Mutations

- For operations such as export, restore, save persona, or delete chat, keep the initiating button's accessible name available and expose its busy state (for example, `aria-busy` plus “Exporting backup…”).
- Disable only the action currently in progress to prevent duplicate submission; do not make unrelated navigation inaccessible.
- On success, provide a concise non-modal confirmation. On failure, restore the control, preserve recoverable user input, and provide an actionable error message.

## 5. Accessibility Baseline

- Loading, streaming, and error feedback must meet WCAG 2.2 AA contrast, focus, and status-message requirements.
- Do not use flashing effects. Respect `prefers-reduced-motion`, and keep all wait, stop, retry, and jump-to-latest actions operable with keyboard and screen reader.
