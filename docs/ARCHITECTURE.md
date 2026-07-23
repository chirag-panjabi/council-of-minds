# Target Architecture: Council of Minds

## Status and Vision

This document describes the target open-source architecture for **Council of Minds**. The application is a local-first, multi-agent sandbox and experimentation studio designed around a Bring-Your-Own-Key (BYOK) model.

## Open Core Strategy

This repository represents the "Open Core" of Council of Minds. It is designed to be easily self-hostable by developers. As such, it avoids all server-side dependencies (no databases, no auth, no billing). It relies entirely on client-side state (`localStorage` / `IndexedDB`). A future SaaS version may fork from this core and add hosted features, but this repository remains 100% stateless and local-first.

## System Boundary

Council of Minds is a browser-owned application with a stateless service boundary for cloud providers.

- **Browser Storage:** The browser owns durable `IndexedDB` data and `localStorage` state.
- **Cloud Requests:** Cloud requests travel from the browser to the same-origin stateless Next.js proxy and then to the selected provider.
- **Ollama Requests:** Local Ollama requests travel directly from the browser to the user-configured localhost endpoint (`http://localhost:11434`).

The proxy may observe cloud request traffic in transit but must not store, persist, or log keys, prompts, attachments, or responses. It is not used to reach a user's local model server.

## Core Components & Data Schema

| Component | Responsibility & Storage Details |
|---|---|
| **Browser Client** | UI, conversation state, local persistence, provider selection, import/export, search, analytics |
| **IndexedDB (via Dexie.js)** | Object stores: `personas`, `groups` (saved rosters), `chatSessions`, `messages`, `attachments`, `summaries`, `tokenUsage`, and `recentlyUsedPersonas` |
| **Namespaced localStorage** | Cloud API keys (OpenAI, Anthropic, Gemini, OpenRouter, xAI), UI preferences, onboarding state, and recoverable drafts |
| **Cloud Proxy (`/api/chat`)** | Origin-checked, size-limited, stateless validation and SSE streaming using the Vercel AI SDK for supported cloud providers |
| **Local Adapter** | Direct browser-to-Ollama communication with explicit CORS and server availability checks |

## Supported Provider Topology

The Vercel AI SDK on the stateless proxy connects to:
- **OpenAI** (GPT-4o, GPT-4o-mini, etc.)
- **Anthropic** (Claude 3.5 Sonnet, Claude 3 Opus, etc.)
- **Google Gemini** (Gemini 1.5 Pro, Gemini 1.5 Flash, etc.)
- **OpenRouter** (Unified routing to open and proprietary models)
- **xAI** (Grok series)
- **Ollama** (Local loopback: Llama 3, Mistral, Qwen, etc. via direct client fetch)

## End-to-End Request Flows

### Cloud Request Flow
1. User enters a prompt; client verifies required API keys exist in `localStorage`.
2. Client sends a POST request over HTTPS to the same-origin proxy (`/api/chat`) with key headers and structured payload.
3. Proxy validates the provider, initializes the Vercel AI SDK, opens an async stream to the provider API, and streams SSE chunks back to the client.
4. Client persists the completed result in `IndexedDB` only when the session is not Incognito.

### Local Request Flow (Ollama)
1. User enables Ollama and configures a localhost endpoint (`http://localhost:11434`).
2. Browser tests the configured endpoint directly and gives an actionable unavailable-server or CORS diagnostic error if unreachable.
3. Browser sends compatible requests directly to that localhost endpoint.

## Conversation & Council Model

- **1-on-1 & Council Routes:** Distinct mode-specific session routes.
- **Council Generation:** Sequential turn execution (one active persona response at a time).
- **Moderator Panel:** Roster state, speaking order queue (pre-filled from a Group's default order), and request reply controls live in a persistent right panel.
- **Auto-Pilot Control:** Opt-in auto-looping. **Strict Rule:** Auto-Pilot cannot be enabled without a mandatory finite round limit; there is no unlimited option.
- **Two-Axis Memory:** Raw retention window combined with background summarization.

## Security Controls & Threat Mitigations

- **XSS Risk & Mitigation:** API keys stored in `localStorage` are vulnerable to XSS. No untrusted third-party scripts are allowed in the frontend codebase.
- **Unbounded Cost Risk Mitigation:** Council mode debates could consume excessive tokens if left unchecked. Mitigated by mandatory round limits on Auto-Pilot and cost visibility in `/analytics`.
- **Content Security Policy (CSP):** Restrictive CSP rules and strict origin checks on proxy routes.
- **Redaction:** Redaction of sensitive headers and request bodies from logs, errors, traces, and diagnostics.
- **Payload Limits:** Proxy allowlists, request-size limits, rate limits, and timeouts.
- **Attachment Quotas:** Blob-first attachment storage with MIME validation, per-file, per-message, and quota handling.
- **Incognito Mode:** Incognito sessions are memory-only and excluded from all durable indexes and telemetry-like metadata.

## Decision Records

- [ADR-001: Network and Privacy Boundary](./decisions/ADR-001-network-privacy-boundary.md)
- [ADR-002: Local-First Data Model](./decisions/ADR-002-local-first-data-model.md)
- [ADR-003: Routing and Session Lifecycle](./decisions/ADR-003-routing-and-session-lifecycle.md)
- [ADR-004: Provider Capability and Local Topology](./decisions/ADR-004-provider-capability-topology.md)
- [ADR-005: Council Execution and Cost Controls](./decisions/ADR-005-council-execution-and-cost-controls.md)
- [ADR-006: Persona Portability and Import Safety](./decisions/ADR-006-persona-portability-and-import-safety.md)
- [ADR-007: Incognito and Data Operations](./decisions/ADR-007-incognito-and-data-operations.md)
