# Future To-Do & Ideas Backlog

This file contains work outside the target MVP. The MVP boundary is defined in [Target Scope](./PRODUCT_SCOPE.md).

## Provider Expansion

- Groq
- OpenRouter
- xAI
- LM Studio
- vLLM and llama.cpp compatibility
- Additional compatible local servers

Each provider needs an adapter, capability metadata, privacy disclosure, connection test, and failure behavior before it can move into the supported-provider list.

## Audio

- Speech-to-text with a clear browser/privacy disclosure and an optional local transcription path.
- Text-to-speech with browser voices, optional BYOK providers, per-persona voice configuration, and explicit cost controls.
- Council auto-speak and accessible playback controls.

## Advanced Agent Capabilities

- User-approved web search with visible source attribution and egress disclosure.
- Sandboxed local code execution.
- Local document retrieval and vector search.

## Council Enhancements

- Drag-and-drop visual turn ordering. The MVP supports an accessible ordered queue with move controls; drag-and-drop is an enhancement, not a prerequisite.
- Additional moderation policies, reusable debate templates, and richer synthesis formats.

## Personalization

- Chat themes and optional wallpapers.
- Custom raw-message retention beyond MVP presets.

## Revisit Criteria

Promote an item only after its privacy impact, cost behavior, accessibility requirements, data retention, and error handling are documented. Add an ADR when it changes the system boundary or durable data model.
