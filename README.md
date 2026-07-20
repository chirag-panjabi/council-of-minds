# Framework Engine

Framework Engine is a local-first, Bring-Your-Own-Key workspace for structured 1-on-1 and sequential multi-persona conversations.

## Project Status

The repository is being rebuilt from the target documentation. The existing application code is legacy material and is not the source of truth for the next implementation.

Start with the [documentation index](./docs/README.md), then read:

- [Target Product Scope](./docs/PRODUCT_SCOPE.md)
- [Target Architecture](./docs/ARCHITECTURE.md)
- [Privacy, Security, and Safety Contract](./docs/PRIVACY_AND_SAFETY.md)
- [MVP Acceptance Checklist](./docs/MVP_ACCEPTANCE.md)

## Target MVP

- OpenAI, Anthropic, and Google Gemini through a same-origin stateless proxy.
- Ollama through a direct browser-to-localhost connection.
- Local personas, 1-on-1 chat, sequential Council chat, versioned backup/restore, search, and local analytics.
- No accounts, hosted marketplace, billing, cloud sync, remote database, web search, or code execution.

## Privacy Summary

Durable application data belongs in the browser. Cloud requests, including their required API keys and submitted content, transit the stateless proxy and selected provider; the proxy must not persist or log them. Local Ollama requests go directly to the configured loopback server.

The detailed requirements, data contracts, and implementation decisions live in the documentation rather than this overview.

## Build Handoff

The executable implementation sequence is in [tasks/plan.md](./tasks/plan.md). Antigravity should begin with [tasks/ANTIGRAVITY_HANDOFF.md](./tasks/ANTIGRAVITY_HANDOFF.md), work through [tasks/todo.md](./tasks/todo.md), and use [tasks/acceptance_matrix.md](./tasks/acceptance_matrix.md) as the release gate.
