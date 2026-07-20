# MVP Acceptance Checklist

This checklist turns the target documentation into build-verifiable outcomes.

## Privacy and Provider Paths

- [ ] A cloud key is validated and used only through the same-origin stateless proxy.
- [ ] Proxy logs, diagnostics, and errors redact cloud keys, prompts, attachments, and provider responses.
- [ ] The UI explains provider egress before first cloud request and before enabling background summarization.
- [ ] An Ollama connection test is browser-to-localhost and reports a CORS or unavailable-server failure without falling back to a cloud provider.

## Storage, Import, and Deletion

- [ ] Durable personas, sessions, messages, attachments, token usage, and recent-persona metadata use IndexedDB.
- [ ] API keys and UI settings use documented, namespaced localStorage keys only.
- [ ] Persona import displays the decoded `framework-engine.persona/v1` profile, validates it, and offers Replace, Duplicate, Skip, and an apply-to-all option.
- [ ] Full backup exports a versioned manifest, chats, personas, and attachment files; restore previews changes before writing.
- [ ] Wipe closes database connections, handles a blocked database deletion, removes only app-owned storage, and returns to `/onboarding`.

## Conversation Behavior

- [ ] Saved sessions use the canonical mode-specific session routes.
- [ ] Council requests are sequential; the next generation cannot begin until the active one resolves, fails, or is cancelled.
- [ ] Auto-Pilot is off initially and cannot exceed the configured finite turn cap.
- [ ] Cancellation records a visible partial/cancelled state without retrying automatically.
- [ ] Summarization is off initially and has a clear provider disclosure, failure fallback, and untrusted-context delimiter.
- [ ] Incognito conversations leave no IndexedDB, analytics, search, export, recent-session, or recent-persona record.

## Quality, Accessibility, and Safety

- [ ] All core flows meet WCAG 2.2 AA: keyboard access, visible focus, modal focus trapping and restoration, reduced-motion support, and non-noisy streaming announcements.
- [ ] Search performs literal matching in a cancellable worker and opens canonical session routes.
- [ ] Provider, attachment, rate-limit, timeout, cancellation, and validation failures show actionable, non-sensitive error states.
- [ ] Advice-oriented flows show the appropriate safety disclosure and crisis path.
