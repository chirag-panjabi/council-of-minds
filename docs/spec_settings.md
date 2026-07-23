# Frontend Functional Specification: Global Settings Page (`/settings`)

## 1. Routes & Functional Purpose

- **Route:** `/settings`
- **Primary Goal:** Provide a centralized hub to configure provider API keys (BYOK), default chat models, context memory thresholds, appearance preferences, data privacy operations, user profile info, and application information.
- **Accessibility:** Reachable globally via the sidebar bottom launcher or navbar header icon.

## 2. Current Provider Scope & Proxy Transparency Boundary

- **Supported Cloud Providers:** OpenAI, Anthropic, and Google Gemini.
- **Supported Local Provider:** Ollama (connected directly from browser to loopback `localhost` endpoint after user configures CORS). Does not transit the proxy.
- **Deferred Provider Integrations:** Groq, OpenRouter, xAI, LM Studio, vLLM, and other OpenAI-compatible endpoints are hidden until dedicated, reviewed integrations are completed.
- **Cloud Proxy Transit & Data Handling:** Cloud API keys, prompts, models, and attachments travel from browser through the same-origin stateless proxy to provider endpoints. The proxy must **never log, cache, or persist** API keys, prompts, or response bodies. Provider validation makes a lightweight non-billing call (e.g. `/models`) with clear transparency disclosures.

## 3. Navigation & Tab Sections

Persistent two-column layout on desktop; collapses into a scrollable horizontal tab bar or menu on mobile viewports.
1. **Personal Profile:** User name and contextual bio for system prompt injection.
2. **API Keys & Providers:** Provider enablement, password key fields, validation, key replacement, and Ollama connectivity testing.
3. **Advanced Chat Behaviors:** Two-step default model selector, summarizer model selector, and two-axis context memory controls.
4. **Appearance:** Theme (Light, Dark, System), Chat Density (*Comfortable* vs *Compact*), and Typography size.
5. **Data & Privacy:** Chat history `.zip` export, custom persona `.json` export/import, full backup restore, UI preferences reset, and destructive data wipe.
6. **About:** Version info, documentation links, and source repository links.

## 4. Detailed Section Specifications

### 4.1. Personal Profile Section
- **User Profile Fields:** Preferred Name and Optional Contextual Profile text.
- **System Prompt Injection:** Stored in `IndexedDB` and dynamically injected into persona system prompts so AI agents refer to the user correctly.

### 4.2. API Keys & Providers Section
- **Password Input & Temporary Reveal:** Key fields use password masking with an explicit temporary "eye" reveal button that auto-masks when field loses focus.
- **Validate & Save Flow:** Clicking "Validate & Save" sends a lightweight test call via the stateless proxy. On success, locks the field, displays a "✓ Key Configured" badge, and stores the key under its `framework-engine:api-key:<provider>` `localStorage` key.
- **Locked Saved Key Security:** Saved keys **cannot be revealed or unmasked** in the UI. Replacing a key requires clicking `Replace Key`, which clears the field after confirmation.

### 4.3. Advanced Chat Behaviors Section
- **Two-Step Cascading Model Selectors:** Select Provider -> Select Model for Global Default Model and Background Summarizer Model.
- **Two-Axis Context Memory System:**
  - *Axis 1: Background Summarization Toggle:* Summarizes history in background and attaches summary to prompt.
  - *Axis 2: Raw Message Retention Presets:* Slider/select for `0` (None), `4` (Short), `10` (Medium), or `All` (Infinite).
  - *Tooltip Memory Combinations:* Explains 4 combinations:
    - *Stateless:* Summarization = OFF | Raw Messages = 0
    - *Summary Only:* Summarization = ON | Raw Messages = 0 (Cost-efficient long memory)
    - *Hybrid:* Summarization = ON | Raw Messages = 4 to 10 (Balanced rolling memory)
    - *Infinite:* Summarization = OFF | Raw Messages = All (Maximum fidelity, highest cost)

### 4.4. Appearance Section
- **Theme Controls:** Light, Dark, System Default visual cards.
- **Chat Density Presets:** *Comfortable* vs *Compact* message padding choices.
- **Typography & Motion:** Adjusts base `rem` typography size. Respects `prefers-reduced-motion`. Custom chat wallpapers are designated as post-MVP.

### 4.5. Data & Privacy Section
- **Export Chat History (`.zip`):** Packages all saved conversations and attachment references into a downloadable `.zip` archive. Incognito sessions are excluded.
- **Export Custom Personas (`.json`):** Packages all user-created personas into a portable JSON array.
- **Import Custom Personas (`.json`):** File uploader supporting `.json` persona arrays with schema validation and collision handling.
- **Full Backup Archive & Restore:** Generates/restores versioned full backup archives with interactive preview before commit.
- **Reset UI Preferences:** Removes `framework-engine:preference:` keys without deleting API keys, chats, or personas.
- **Wipe All Local Data (Danger Zone):** Completely clears `IndexedDB` stores and `framework-engine:` `localStorage` keys. Requires typing `"DELETE"` to confirm.

## 5. Security, Persistence & WCAG Guidelines

- **Persistence Rules:** `IndexedDB` stores durable app data (chats, personas, attachments, user profile). `localStorage` is restricted to `framework-engine:` namespaced API keys, preferences, and drafts.
- **WCAG 2.2 AA Compliance:** Focus trapping in dialogs, visible focus rings, aria-describedby validation errors, non-color status cues, and touch target sizes.
