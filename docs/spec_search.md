# Global Search Specification

## Overview

Global Search finds durable local personas and chats without sending a query or result to a server. It deliberately searches only `IndexedDB` records that are meant to persist; Incognito data is never indexed, cached, or returned.

## 1. UI Integration

- **Triggers:** A labelled search control in the Sidebar and `Cmd/Ctrl + K`.
- **Interface:** A command-palette dialog with a search field, filters, categorized results, an empty state, and a recoverable local-error state.
- **Dialog behavior:** The palette follows the shared dialog rules: labelled title, focus moves to the input, focus is trapped while open, `Escape` closes it, and focus returns to the trigger.

## 2. Search Scope and Filters

Search the following durable `IndexedDB` data:

1. **Personas:** Name, tags, and description.
2. **Chats:** Session title and text content of durable messages.

Available filters are mode (`1-on-1` or `Council`), date range, and model. Attachment blobs are not searched. Incognito sessions have no durable data and therefore cannot appear in search results.

## 3. Literal Search and Worker Behavior

- Match the query as a case-insensitive, Unicode-normalized **literal substring**. Treat characters such as `*`, `(`, `[`, and `\\` as ordinary characters; never place a user query into an unescaped `RegExp`.
- Debounce typing briefly, then send a request ID, normalized query, and filters to a dedicated Web Worker. The worker reads a prepared local snapshot/index supplied by the app and returns results without blocking the main thread.
- When the query or a filter changes, send a cancellation message for the prior request and ignore any stale result whose request ID is no longer current. Closing the palette also cancels active work and clears in-memory result data.
- Limit each result category to 50 entries and tell the user to refine the query when the limit is reached. Do not create a second persistent copy of message text merely for the MVP search index.
- Failures to open/read local data produce a clear local error with Retry; they do not fall back to server search.

## 4. Results and Routing

- Categorize results as **Personas** and **Chats**. Each result includes an accessible text label, the matching field/snippet, and enough context to distinguish similarly named items.
- Highlight matches by rendering text nodes/semantic markup, never by injecting a query as HTML.
- A persona result routes to `/personas/edit/[id]`.
- A 1-on-1 chat result routes to `/chat/1-on-1/[sessionId]`; a Council chat result routes to `/chat/council/[sessionId]`. When a matching message ID exists, include it as a query parameter and scroll/highlight only after the session has loaded.
- If a result's record disappears before navigation, show the normal unavailable-session state rather than routing to the obsolete `/chat/[id]` form.

## 5. Accessibility and Privacy

- Results, filters, selection, and close actions are keyboard operable with visible WCAG 2.2 AA-compliant focus. Arrow-key navigation is additive; Tab navigation remains usable.
- Announce result-count, empty, and error changes concisely through a polite status region. Do not rely on background blur, color, or animation to show that the palette is open.
- Respect `prefers-reduced-motion`. Search queries, snippets, and result metadata stay in browser memory for the active search only and are not sent to analytics, the proxy, or a provider.
