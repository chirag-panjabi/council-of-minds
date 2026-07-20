# Target Technology Decisions

## Status

These are target implementation decisions for the next build. They are not a claim about the legacy codebase.

## Core Application

| Need | Decision | Rationale |
|---|---|---|
| Application framework | Next.js App Router, React, TypeScript | One browser application and same-origin stateless cloud proxy |
| UI | Tailwind CSS and accessible component primitives | Fast, consistent UI construction without sacrificing keyboard behavior |
| Client state | React Context for low-frequency settings; Zustand for active conversation state | Avoid broad re-renders while streaming |
| Local database | Dexie over IndexedDB | Versioned schema, transactional writes, and testable queries |
| Validation | Zod | Validate imports, backups, route inputs, and provider configuration before persistence |
| Streaming | Vercel AI SDK provider adapters where compatible | Keep streaming semantics consistent while preserving explicit capability checks |

## Data and Portability

- Use a single versioned IndexedDB schema for personas, sessions, messages, attachments, summaries, token usage, and recent-persona metadata.
- Store API keys and small UI settings only under namespaced localStorage keys.
- Export full backups as a versioned archive with a manifest, JSON data, and binary attachments. Use JSON as the canonical portable format; Base64URL is only the transport encoding for a single persona share code.
- Compression is an optimization that may be introduced in a future format version. It is not part of framework-engine.persona/v1.

## Provider Architecture

- OpenAI, Anthropic, and Google Gemini are the initial cloud providers and use the same-origin proxy.
- Ollama is the initial local provider and uses the browser-to-localhost adapter.
- Provider adapters expose capabilities such as text streaming, vision input, context limits, and output-token control. The UI must not infer capabilities from a model name alone.

## Operational Constraints

- The proxy has an allowlist of supported providers; it must not proxy arbitrary URLs.
- All cloud traffic uses HTTPS. Sensitive headers and bodies are redacted before logs, traces, and error reporting.
- Search runs in a cancellable Web Worker. It uses literal matching and returns a bounded result set.
- Accessibility is a non-optional requirement: WCAG 2.2 AA, visible focus, keyboard navigation, focus restoration, reduced-motion support, and restrained live announcements.

## Deferred Technology Decisions

Dependencies for non-MVP providers, hosted services, web search, code execution, and other future capabilities are intentionally not selected yet. Add an ADR before introducing one.
