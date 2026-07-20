# Error Boundaries and Fallback UI Specification

## Overview

Runtime errors, unavailable `IndexedDB`, blocked database deletion, and deleted local sessions must never leave the user at a blank screen or cause silent data loss. Error UI is local-only; it does not transmit prompts, API keys, attachments, stack traces, or diagnostics to a remote service.

## 1. Not Found and Missing Local Records

- **Trigger:** A route does not exist, or a canonical session route resolves to no durable record, for example `/chat/1-on-1/[sessionId]` or `/chat/council/[sessionId]` after that session has been deleted.
- **Content:** A friendly, non-alarming page with a plain-language message such as “This chat is unavailable or was deleted.” Do not expose internal errors or guess that an Incognito session should exist.
- **Actions:** Offer `Return to Dashboard` (`/`) and, where relevant, `Open Chat History`. Do not invent or redirect to the obsolete `/chat/[id]` route.
- **Accessibility:** Use a page-level heading, move focus to it after navigation, keep actions keyboard reachable, and do not rely on a decorative illustration to convey the error.

## 2. Global Error Boundary

- **Trigger:** A rendering or unrecoverable local-data error occurs.
- **Primary UI:** Show “Something went wrong” with a short explanation and a `Try again` action that retries rendering without deleting data.
- **Technical details:** Production UI must redact stack traces, provider keys, prompt text, attachment names, and raw storage contents. Detailed errors may be available only in local development tooling.
- **Recovery sequence:** First offer retry and a non-destructive `Reset UI preferences` action. Link separately to Data & Privacy for export/restore or the explicit destructive wipe flow; never make wiping the default recovery action.
- **Focus and status:** Move focus to the error heading, use `role="alert"` only for the initial meaningful error announcement, and leave recovery controls visible and operable without a pointer.

## 3. Storage and Wipe Failures

- If `IndexedDB` is unavailable, corrupt, quota-limited, or blocked by another open tab, show the affected feature's error in place and preserve any recoverable draft in its namespaced draft key.
- If `indexedDB.deleteDatabase()` reports that deletion is blocked, explain that another tab/window must close, keep the app-owned `localStorage` keys intact until deletion can complete, and provide Retry and Cancel. The UI must not claim the wipe succeeded until it has.
- A confirmed wipe removes only the application's `IndexedDB` database/stores and `framework-engine:` namespaced local-storage keys; it must never call blanket `localStorage.clear()`.

## 4. Inline Error States

- Localized failures, such as an avatar load failure, an unsupported attachment, or a provider validation error, must not crash the page. Show an appropriate local fallback and keep the rest of the interface usable.
- Every inline error includes plain text, an associated retry/fix action where applicable, and programmatic association to the affected control. Color, iconography, and motion are supplementary only.
