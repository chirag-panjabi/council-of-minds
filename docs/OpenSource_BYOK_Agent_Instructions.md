# Open-Source BYOK Implementation Rules & Agent Instructions

## 1. Product Boundary & Strict Stateless Constraints

- **Strict Stateless Backend:** The application backend must remain 100% stateless.
  - **NO Server Databases:** Do not introduce SQLite, PostgreSQL, MongoDB, Prisma, Drizzle, Supabase, or Firebase on the backend.
  - **NO Authentication:** Do not implement NextAuth, Clerk, or Firebase Auth. There are no remote user accounts.
  - **NO Billing Gateways:** Do not introduce Stripe or server-side credit deduction logic.
- **Client-Side Persistence Only:** All user state (chat history, saved personas, API keys, settings) must reside in browser `localStorage` or `IndexedDB`.
- **Backend Proxy Only:** Next.js Route Handlers (`/api/...`) exist *solely* to securely proxy streaming requests to LLM providers (OpenAI, Anthropic, Gemini, etc.) and bypass browser CORS limits. The proxy must **never log, print, cache, or persist** user API keys or prompt bodies.

## 2. Bring Your Own Key (BYOK) & Pre-Flight Interception

- **Key Storage:** User API keys are entered on `/settings` and saved under `framework-engine:api-key:<provider>` in `localStorage`.
- **Pre-Flight Key Interception:** If a user attempts to start a chat without a configured API key for the selected model, the UI **must intercept the action before making a network call** and display a helpful modal/tooltip guiding them to `/settings` to enter the missing key.

## 3. Storage & Storage Key Namespacing

- **IndexedDB:** The durable store for personas, sessions, messages, attachments, summaries, token usage, and recently used personas.
- **localStorage:** Restricted to `framework-engine:` namespaced API keys, preferences, onboarding state, and drafts. Never invoke `localStorage.clear()`; remove only app-owned keys.
- **Incognito Privacy Guarantee:** Incognito conversations are strictly memory-only. They must not create durable records, analytics, search entries, exports, or recent metadata.

## 4. Persona Creation & Portable Sharing

- **Local Roster:** Hosted marketplaces are abandoned to maintain a decentralized architecture. Personas are created and edited locally in `IndexedDB`.
- **Base64URL Share Codes:** Exporting serializes the persona identity and behavior into a Base64URL string (`framework-engine.persona/v1`). API keys, model preferences, and device settings are strictly excluded.
- **Import Security:** Imported persona strings must be decoded, previewed, schema-validated with Zod, and explicitly confirmed. Imported instructions must never be executed as application code.

## 5. UI/UX Principles, Streaming & Thinking Process

- **Aesthetics First:** Built with Tailwind CSS v4, Radix UI (shadcn/ui), and Framer Motion featuring a modern "Structural Glassmorphism" theme.
- **Smooth Streaming:** All LLM responses stream smoothly via Vercel AI SDK SSE adapters.
- **Expandable Thinking Process Accordion:** Raw internal reasoning tokens (e.g. `<think>...</think>`) are stripped from the main bubble text and rendered inside an expandable **"Thought Process"** UI accordion (with a pulsing brain icon) so users can inspect the model's reasoning on demand.

## 6. Core Developer Motto

> **"Store it locally, proxy it statelessly, make it beautiful, and respect user privacy."**
