# Target Architecture: Framework Engine

## Status

This document describes the target open-source architecture. It intentionally does not describe the legacy implementation.

## System Boundary

Framework Engine is a browser-owned application with a stateless service boundary for cloud providers.

- The browser owns durable IndexedDB data.
- Namespaced localStorage contains keys, preferences, onboarding state, and drafts.
- Cloud requests travel from the browser to the same-origin stateless proxy and then to the selected provider.
- Ollama requests travel directly from the browser to the user-configured localhost endpoint.

The proxy may observe cloud request traffic in transit but must not store or log keys, prompts, attachments, or responses. It is not used to reach a user's local model server.

## Core Components

| Component | Responsibility |
|---|---|
| Browser client | UI, conversation state, local persistence, provider selection, import/export, search, analytics |
| IndexedDB | Personas, sessions, messages, attachments, summaries, token usage, recently used persona metadata |
| Namespaced localStorage | Cloud API keys, UI preferences, onboarding state, and recoverable drafts |
| Cloud proxy | Origin-checked, size-limited, stateless validation and streaming for supported cloud providers |
| Local adapter | Direct browser-to-Ollama communication with an explicit CORS and availability check |

## Cloud Request Flow

1. The client verifies that the chosen provider has a configured key.
2. The client sends the request to the same-origin proxy over HTTPS with the relevant provider key and structured payload.
3. The proxy validates the allowed provider, redacts diagnostics, forwards the request, and streams the response.
4. The client persists the completed result only when the session is not Incognito.

Cloud key validation follows the same proxy path. This avoids contradictory direct-to-provider validation behavior and centralizes request-size, origin, and redaction controls.

## Local Request Flow

1. The user enables Ollama and supplies a localhost endpoint.
2. The browser tests the configured endpoint directly and gives an actionable unavailable-server or CORS error.
3. The browser sends compatible requests directly to that endpoint.

Remote deployments must not assume that their proxy can access a user's localhost service.

## Conversation Model

1-on-1 and Council sessions have distinct mode-specific routes. Council generation is sequential: one active response at a time. Auto-Pilot is opt-in and has a finite turn cap. Background summarization is opt-in, provider-disclosed, and isolates generated summaries as untrusted conversation context.

## Security Controls

- Restrictive Content Security Policy and no untrusted executable third-party scripts.
- Redaction of sensitive headers and bodies from logs, errors, traces, and diagnostics.
- Proxy allowlist, origin checks, request-size limits, rate limits, and timeouts.
- Blob-first attachment storage with MIME, per-file, per-message, and browser-quota handling.
- Incognito sessions are memory-only and excluded from all durable indexes and telemetry-like metadata.

## Decision Records

- [ADR-001: Network and Privacy Boundary](./decisions/ADR-001-network-privacy-boundary.md)
- [ADR-002: Local-First Data Model](./decisions/ADR-002-local-first-data-model.md)
- [ADR-003: Routing and Session Lifecycle](./decisions/ADR-003-routing-and-session-lifecycle.md)
- [ADR-004: Provider Capability and Local Topology](./decisions/ADR-004-provider-capability-topology.md)
- [ADR-005: Council Execution and Cost Controls](./decisions/ADR-005-council-execution-and-cost-controls.md)
- [ADR-006: Persona Portability and Import Safety](./decisions/ADR-006-persona-portability-and-import-safety.md)
- [ADR-007: Incognito and Data Operations](./decisions/ADR-007-incognito-and-data-operations.md)
