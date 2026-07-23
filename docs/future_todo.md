# Future To-Do & Ideas Backlog

This document tracks features, integrations, and architectural enhancements outside the target MVP scope ([Target Scope](./PRODUCT_SCOPE.md)).

## 1. Provider Expansion

- **OpenRouter** (Single key access to hundreds of open/closed models)
- **Together AI**
- **Mistral API**
- **Cohere**
- **Groq & xAI**
- **LM Studio** (Dedicated local engine connection manager)
- **vLLM & llama.cpp** (OpenAI-compatible local server endpoints)
- **text-generation-webui** (Oobabooga API compatibility)

*Requirement:* Each provider requires a dedicated adapter, capability metadata, privacy disclosure, connection test, and error handling before promotion to the supported list.

## 2. Advanced Audio & Podcast Mode

- **High-Fidelity BYOK TTS (ElevenLabs / OpenAI TTS):** Integration for ultra-realistic persona voices using user-supplied keys.
- **Persona Voice Selector:** Voice ID dropdown in Persona Creator mapping personas to custom TTS voice IDs.
- **Council Auto-Speak (Podcast / Audiobook Mode):** Automatic sequential voice playback for Council debates without manual play button clicks.
- **Whisper API STT Integration:** Optional OpenAI Whisper API integration for high-accuracy Speech-to-Text dictation.

## 3. Advanced Agent Capabilities & Local RAG

- **Web Search Integration:** Opt-in web search via Tavily or SerpAPI with visible source attribution and egress disclosures.
- **Sandboxed Browser Code Execution:** Running generated Python or JavaScript safely in-browser via Pyodide or WebContainers.
- **Local Vector Database RAG (PGlite + pgvector):** In-browser vector store allowing users to query local PDF libraries without cloud uploads.

## 4. UI & Council Enhancements

- **Drag-and-Drop Avatar Queue Strip:** Persistent horizontal avatar strip above chat input allowing users to drag and drop bubbles to dictate Council speaking order.
- **Additional Moderation Policies:** Reusable debate templates, custom synthesis prompts, and structured debate formats.

## 5. Personalization & Context Control

- **Custom Background Themes & Wallpapers:** Custom chat bubble colors, backgrounds, and theme presets.
- **Arbitrary Integer Context Retention:** Input field allowing users to specify exact raw message retention numbers (beyond the 0, 4, 10, All presets).

## 6. Dollar-Cost Estimation in Analytics

- **Spend Estimation:** Convert tracked token counts (`spec_analytics.md`) into estimated dollar spend using an optional, community-maintained pricing feed.
- **Local Model Exclusion:** Local models (Ollama, LM Studio) will always display `$0.00` / `N/A` since they incur no API cost.

## 7. Revisit Criteria & Promotion Rules

Promote a backlog item only after its privacy impact, cost behavior, accessibility requirements, data retention, and error handling are fully documented. Add an ADR when a change alters the system boundary or durable data model.
