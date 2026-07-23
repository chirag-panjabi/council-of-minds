# Comprehensive Project Brief: Council of Minds

## Authority and Scope

This document defines the comprehensive product brief for **Council of Minds**. It is governed by [Target Scope](./PRODUCT_SCOPE.md), the privacy contract in [Privacy, Security, and Safety](./PRIVACY_AND_SAFETY.md), and the architectural decision records in [decisions/](./decisions/).

## 1. Product Overview & Vision

### What is Council of Minds?
**Council of Minds** is a local-first, multi-agent orchestration and experimentation studio. At its core, it is an advanced, Bring-Your-Own-Key (BYOK) workspace that allows users to create, manage, and interact with highly customized AI personas. Unlike traditional 1-on-1 chat interfaces, Council of Minds specializes in orchestrating **multiple AI agents simultaneously** in a shared, structured sandbox context.

### Core Purpose & Principles
- **User-Owned Data & Sovereignty:** 100% local-first architecture. All chats, personas, and API keys reside in browser `localStorage` or `IndexedDB`. There are no backend databases, user accounts, telemetry, or centralized billing.
- **Honest Privacy:** Cloud requests transit a stateless proxy to selected providers. The app clearly explains this network boundary to users.
- **Bring Your Own Key:** Users manage their own provider API keys (OpenAI, Anthropic, Gemini) or connect directly to local loopback models (Ollama).
- **Deliberate Multi-Agent Work:** Council Mode favors understandable, sequential turns over opaque parallel background activity.
- **Cost Visibility & Control:** Token consumption, auto-pilot limits, and memory sliders are strictly bounded and transparent.
- **Portable Personas:** Personas are local, inspectable, shareable profiles—not hosted marketplace inventory.

### Key Use Cases
- **Personal Introspection & Advice:** Consult a personalized "board of directors" or philosophical archetypes (Stoic, Marxist, Buddhist) for holistic life advice.
- **Professional Red-Teaming & Brainstorming:** Pitch ideas to a room of AI agents acting as a *Skeptical VC*, *UX Expert*, and *Security Auditor*.
- **Educational Simulations:** Recreate historical debates or simulate diplomatic negotiations by programming personas with specific historical contexts.
- **Creative Writing & Worldbuilding:** Drop custom characters into Council Mode to generate multi-agent dialogue and narrative arcs.
- **LLM Benchmarking & Routing:** Simultaneously test the same prompt across GPT-4o, Claude 3.5 Sonnet, and Gemini 1.5 Pro within the same chat interface.

## 2. Architecture & Tech Stack Constraints

- **Frontend Framework:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui.
- **Stateless Backend Proxy:** Next.js API Routes acting as a stateless proxy for streaming LLM requests (via Vercel AI SDK). Keys transit in headers and are never logged or stored.
- **Local Persistence:**
  - `IndexedDB` (via Dexie.js) for structured data: `Personas`, `Groups`, `ChatSessions`, `Messages`, and `TokenUsage`.
  - `localStorage` for settings, UI preferences, and API keys.
- **Local Models:** Direct browser-to-localhost connection for Ollama / local endpoints.

## 3. Core App Layout & Routing

- **Global Sidebar:** Primary chat-list-and-launcher surface. Features:
  - Dedicated **Groups** section (saved, reusable Council rosters launchable in one tap).
  - Scrollable date-grouped Recent Conversations distinguishing 1-on-1 (single avatar) from Council (stacked avatars) sessions.
  - New Chat action, Settings, and Persona Library access.
- **Dashboard (`/`)**: Orientation surface containing:
  - "Setup Required" banner if keys are missing.
  - Usage-at-a-glance widget.
  - Browsable Groups Overview Grid.
- **Onboarding (`/onboarding`)**: Intercepted by a Route Guard if no API keys are configured, walking users through privacy and key validation via a stateless pre-flight check.

## 4. Persona & Group Ecosystem

- **Persona Creator (`/personas/create`)**: Define Avatar, Accent Color, Name, Tagline, System Prompt, Advanced Rules, and Icebreaker message.
- **Local Library (`/personas`)**: Search, filter (by tags/favorites), edit, and manage local personas.
- **Unified Selector Modal:** Universal search modal to swap personas mid-conversation.
- **Import/Export & Collision Handling:** Export/import personas as Base64 strings. Import includes collision resolution options: *Replace*, *Duplicate*, or *Skip*.
- **Persona Groups (`/groups` / `spec_persona_groups.md`)**: Save named, ordered sets of personas as reusable **Groups** (e.g., "Dev Council", "Philosophy Circle"). Groups store persona references, speaking order, and optional default Synthesizers—launchable in one tap.

## 5. Unified Chat Interface

### A. 1-on-1 Mode (`/chat/1-on-1`)
Single-persona direct consultation. Supports file attachments (vision models), response streaming, regeneration, and message editing.

### B. Council Mode (`/chat/council`)
Multi-agent debate sandbox:
- **Roster & Model Setup:** Select 2-N personas or load a saved Group. Assign a unified model or individual models per persona.
- **Persistent Right Moderator Panel:**
  - *Speaking Order Queue:* Drag-and-drop ordering (pre-filled from Group default).
  - *Request Reply:* Force a specific persona to speak next.
  - *Auto-Pilot Controls:* Automatic agent debate looping. **Strict Rule:** Auto-Pilot cannot be enabled without setting a finite round limit.
  - *Manual Stepping:* Default step-by-step "Continue" execution.
- **Synthesis:** A dedicated Synthesizer persona (e.g., "Judge") evaluates the debate and provides a final summary.

## 6. Context, Memory & Cost Management

- **Two-Axis Memory System:**
  1. *Raw Retention Slider:* Configures how many recent raw messages are included in the payload.
  2. *Background Summarization:* Optional background model (e.g., `gpt-4o-mini`) continuously summarizes older context to inject into system prompts.
- **Analytics (`/analytics`)**: Client-side tracking of prompt/completion tokens. Visualizes token usage, model distribution, and persona activity over 30/90 days (tracks token counts directly for transparency).

## 7. Data Privacy, Backup & Safety

- **Export:** Export full chat history and personas as compressed `.zip` files (JSON/Markdown) via client-side processing.
- **Data Wipe Danger Zone:** Securely delete local databases (`indexedDB.deleteDatabase()` and `localStorage.clear()`).
- **Incognito Mode:** Toggle incognito per session to disable history tracking with a visual watermark indicator.

## 8. Product Boundaries & Excluded Features

The open-source MVP explicitly excludes:
- User accounts, authentication, hosted persona discovery, payments, billing, cloud sync, remote databases, web search, and remote code execution.
- Future enhancements (Voice STT/TTS with Whisper/ElevenLabs, advanced routing) are tracked in [Future To-Do](./future_todo.md).

## 9. Success Criteria

The product satisfies MVP requirements when all criteria in [MVP Acceptance Checklist](./MVP_ACCEPTANCE.md) are met and implementation matches the ADRs in [decisions/](./decisions/).
