# Open-Source BYOK Implementation Rules

## Status

These are binding rules for the next Framework Engine implementation. They describe the target product rather than the legacy codebase.

## Product Boundary

- Do not add user accounts, authentication, billing, remote databases, cloud sync, hosted persona discovery, or product telemetry to the open-source edition.
- Do not reintroduce a hosted marketplace. Personas are local profiles shared only through explicit user export/import.
- Treat [Target Scope](./PRODUCT_SCOPE.md), [Privacy, Security, and Safety](./PRIVACY_AND_SAFETY.md), and the ADRs as architectural authority.

## Storage Rules

- IndexedDB is the durable store for personas, sessions, messages, attachments, summaries, token usage, and recently used personas.
- Namespaced localStorage keys hold API keys, preferences, onboarding state, and drafts only.
- Never call localStorage.clear(); remove only documented app-owned keys.
- Incognito conversations are memory-only and must not create durable records, analytics, search entries, exports, or recent metadata.

## Provider Rules

- Cloud-provider requests and key validation go through the same-origin stateless proxy.
- The proxy must not persist or log API keys, prompts, attachments, summaries, or provider responses.
- The proxy must have a provider allowlist, origin checks, request-size limits, rate limits, timeouts, and safe error handling.
- Ollama uses a browser-to-localhost path. Do not route a user's local model through a remote deployment.
- Before adding a provider, document its capability metadata, error modes, privacy disclosure, and fallback behavior.

## Persona Rules

- A portable persona is framework-engine.persona/v1 JSON encoded as Base64URL.
- Export only persona identity and behavior. Exclude API keys, model/provider preferences, voice selections, device paths, and other local settings.
- Decode, preview, validate, and explicitly confirm all imports. Never execute an imported persona's instructions as application code.

## Conversation Rules

- Council generations are sequential. Auto-Pilot is off by default and always has a finite turn cap.
- Background summarization is off by default, discloses its selected provider, and separates generated summary text from trusted system instructions.
- Cancellation, provider failures, validation failures, and partial streams must retain understandable user-visible state.

## Quality Rules

- Meet the MVP acceptance checklist before declaring a feature complete.
- Maintain WCAG 2.2 AA behavior in core flows.
- Do not make claims that a cloud request or browser API is private, offline, or free without documenting its actual data flow and cost model.
