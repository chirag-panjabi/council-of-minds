# Target Technology Decisions

## 1. Core Architecture Pattern

- **Pattern:** Stateless Proxy + Local-First Data (BYOK - Bring Your Own Key).
- **Rationale:** Absolute privacy and zero server database overhead. The backend exists solely as a same-origin stateless proxy to relay LLM requests and bypass browser CORS restrictions. No user data, API keys, or chats are stored on a remote server.

## 2. Core Framework & UI Stack

| Category | Decision | Architectural Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router), React, TypeScript | Single unified codebase for frontend UI and stateless Route Handlers (`app/api/...`). Strict typing for multi-agent payloads. |
| Styling & Primitives | Tailwind CSS v4 + Radix UI (via shadcn/ui) | Radix UI provides battle-tested focus trapping in modals (Persona Selector) and keyboard navigation in dropdowns. |
| Micro-Animations | Framer Motion | Smooth UI micro-animations (chat bubble streaming, pulsing thinking indicators) without manual CSS transition headaches. |
| Icons | Lucide React | Clean, consistent UI icon primitives. |
| State Management | Zustand + React Context | React Context for low-frequency settings; **Zustand for atomic, high-frequency updates** during multi-agent Council SSE streaming to prevent app-wide re-renders. |
| Local Database | Dexie.js (IndexedDB wrapper) | Versioned relational local schema (Chats, Messages, Personas, Groups), transactional writes, and Promise-based queries for gigabytes of local storage. |
| Local Preferences | `localStorage` | Restricted to `framework-engine:` namespaced API keys, preferences, onboarding state, and drafts. |

## 3. Data Validation, Import/Export & Compression

- **Zod:** Strict schema validation for persona imports/exports, backup restoration, and route payloads to prevent corrupt data insertion into `IndexedDB`.
- **JSZip:** Client-side `.zip` archive generation for full chat history exports (processed entirely in browser with zero server egress).
- **lz-string:** Compresses persona JSON before Base64URL encoding to shorten share code length for Discord and forum sharing.

## 4. Specialized Feature Libraries

- **Analytics Visualization:** **Recharts** for rendering browser token usage charts natively in the browser (token counts only; cost estimation excluded).
- **Audio Integration:** **Native Web Speech API** for dictation (Speech-to-Text) and basic voice generation (Text-to-Speech), keeping the app free and offline, with architectural abstraction for future ElevenLabs/OpenAI TTS.

## 5. Deployment & Hosting Target

- **Deployment Target:** **Vercel** (or standard Serverless Node environment).
- **Rationale:** Optimized zero-config deployment pipeline for stateless Next.js App Router route handlers.

## 6. Deferred Technology Decisions

- Dependencies for non-MVP providers (Groq, OpenRouter, xAI, LM Studio, vLLM), hosted databases, remote auth, or web search are intentionally deferred. An ADR must be written before introducing any new dependency.
