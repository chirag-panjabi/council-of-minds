# Framework Engine Target Scope

## Status and Authority

This is the canonical scope for the next implementation. It describes the intended open-source product, not the legacy implementation. When this document conflicts with an older feature specification, this document and the ADRs in `docs/decisions/` win until the older specification is updated.

## Product Boundary

Framework Engine is a local-first, Bring-Your-Own-Key workspace for 1-on-1 and sequential multi-persona conversations. The open-source edition has no accounts, backend database, billing, hosted marketplace, or product telemetry.

"Local-first" means the browser owns durable application data. It does not mean that prompts, attachments, or API keys never leave the browser: cloud-provider requests transit the application proxy and then the user-selected provider.

## MVP

| Area | Included in MVP | Explicitly not included |
|---|---|---|
| Cloud providers | OpenAI, Anthropic, Google Gemini through a same-origin stateless proxy | Groq, OpenRouter, xAI |
| Local providers | Ollama through a browser-to-`localhost` adapter with user-configured CORS | LM Studio, vLLM, llama.cpp |
| Conversations | 1-on-1 chat and sequential Council chat | Parallel agent generation, tools, web search, code execution |
| Council controls | Manual stepping, per-turn request, synthesis, finite Auto-Pilot cap | Drag-and-drop turn ordering |
| Personas | Local create, edit, archive, versioned import/export | Hosted marketplace, premium tiers |
| Data | IndexedDB storage, versioned full backup/restore, scoped wipe | Cloud sync |
| Accessibility | WCAG 2.2 AA baseline | None |

## Canonical Data Ownership

| Data | Storage | Persistence rule |
|---|---|---|
| Personas, sessions, messages, summaries, attachments, token usage, recent-persona metadata | IndexedDB | Durable unless the session is Incognito |
| API keys, UI preferences, onboarding state, persona drafts | Namespaced `localStorage` keys | Never use a blanket `localStorage.clear()` |
| Active Incognito conversation | Memory only | Never appears in history, search, analytics, exports, or recent lists |

## Canonical Routes

| Purpose | Route |
|---|---|
| Dashboard | `/` |
| Onboarding | `/onboarding` |
| Settings | `/settings` |
| Persona library | `/personas` |
| Create persona | `/personas/create` |
| Edit persona | `/personas/edit/[id]` |
| Start/setup 1-on-1 | `/chat/1-on-1` |
| Saved 1-on-1 session | `/chat/1-on-1/[sessionId]` |
| Start/setup Council | `/chat/council` |
| Saved Council session | `/chat/council/[sessionId]` |
| Analytics | `/analytics` |

## Non-Negotiable Behavior

- Cloud key validation and inference use the same stateless proxy. The proxy must not persist or log keys, prompts, attachments, or provider responses.
- Ollama requests go directly from the browser to the user-configured local endpoint. A remotely deployed proxy must never be expected to reach a user's `localhost`.
- Auto-Pilot is off by default. A Council has a default limit of six generated turns and a user-selectable hard cap from one through twelve turns.
- Background summarization is off by default. Enabling it requires a selected summarizer model and a disclosure that historical content is sent to that provider.
- A portable persona is a `framework-engine.persona/v1` JSON profile encoded as Base64URL. It excludes provider, model, voice, API-key, and other machine-local preferences.

## Change Control

New work must update this scope document when it changes MVP status, privacy behavior, provider support, storage ownership, or routes. Record expensive-to-reverse choices as ADRs in `docs/decisions/`.
