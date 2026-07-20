# Global Settings Page Specification

## Target Page: Settings (`/settings`)

### 1. Functional Purpose

Settings is the centralized place to configure providers, chat defaults, accessibility-aware appearance preferences, local-data operations, and application information. It is available from global navigation.

### 2. Current Scope and Provider Boundary

- **Cloud providers in the initial build:** OpenAI, Anthropic, and Google Gemini.
- **Local provider in the initial build:** Ollama, connected directly from the browser to a loopback `localhost` endpoint after the user configures CORS. It does not use the cloud proxy.
- **Deferred:** Groq, OpenRouter, xAI, LM Studio, vLLM, and other OpenAI-compatible endpoints are not shown as available provider toggles or model choices until they have a dedicated, reviewed integration.
- **Cloud request path:** A cloud key, prompt, selected model, and any transmitted attachment travel from the browser through the same-origin stateless proxy to the chosen provider. The proxy must not persist, cache, or log request bodies, API-key headers, attachments, or response content; production logging must redact them. The chosen provider's own data handling still applies.
- **Validation path:** Cloud-key validation uses the same stateless proxy path as a chat request and makes a minimal provider request. The UI tells the user that the key transits the proxy and provider for validation.

### 3. Interactive Elements Inventory

1. **Settings navigation:** Personal profile, API Keys & Providers, Advanced Chat, Appearance, Data & Privacy, and About.
2. **API Keys & Providers:** Provider enablement, password-style key fields for supported cloud providers, `Validate & Save`, `Replace Key`, and Ollama connection configuration/test.
3. **Advanced Chat:** Provider-first default-model selector, optional summarizer selector, and context-memory controls.
4. **Appearance:** Theme, density, and typography preferences. Custom chat wallpapers are post-MVP and are not a current setting.
5. **Data & Privacy:** Full backup export, portable persona export/import, restore-from-backup, reset UI preferences, and the destructive wipe flow.

### 4. Detailed Component and Interaction Flows

#### 4.1 Settings Navigation and Responsiveness

- Desktop uses a persistent two-column navigation/content layout. Smaller viewports use an accessible menu or horizontally scrollable tab list.
- Tabs or links expose the active panel programmatically, remain keyboard reachable, and never hide focused content behind sticky controls.

#### 4.2 API Keys and Providers

- **New key entry:** Use a password input. The temporary reveal control has an explicit accessible name and automatically returns to masked state when the field loses focus.
- **Validate and save:** Explain the cloud request path before validation. On success, store the key only in its namespaced browser key (for example, `framework-engine:api-key:openai`), mask the field, and show a text success state. On failure, preserve the entered value until the user changes it and display a field-associated error that does not expose the key.
- **Saved state:** Saved keys cannot be revealed through the UI. `Replace Key` deliberately clears only that provider field after confirmation of any unsaved input.
- **Key-storage disclosure:** A saved key remains in the browser profile under its `framework-engine:` local-storage key. The application must never put it in a URL, export, analytics record, error message, or log, and must not describe this browser storage as application-level encryption.
- **Ollama:** Configure a loopback base URL and use `Test Connection` to call Ollama directly from the browser. Show clear CORS, unavailable-server, and model-list errors; see the Local LLM Connectivity specification.

#### 4.3 Advanced Chat Behaviors

- **Provider-first selection:** First select an enabled provider, then a model it currently supports. Do not present deferred providers.
- **Defaults:** The global default applies unless a session/persona explicitly overrides it.
- **Context memory:**
  - Background summarization sends a generated summary to the selected model provider on later requests.
  - Raw message retention controls how many recent messages accompany a request: `0`, `4`, `10`, or `All`.
  - Tooltips state the privacy and cost effect: retained messages and summaries are transmitted to the selected provider (or directly to local Ollama), while Incognito still prevents durable local history, analytics, search entries, and exports.

#### 4.4 Appearance

- Theme choices are Light, Dark, and System. Density and type size update the interface immediately.
- Persist only these lightweight preferences in namespaced `localStorage` keys such as `framework-engine:preference:theme`.
- Respect system reduced-motion preferences, preserve readable contrast at each supported text size, and never use color as the sole state signal.

#### 4.5 Data and Privacy

- **Full backup:** Exports a versioned archive containing a manifest plus selected durable chats, personas, and attachment blobs. Incognito content is never included.
- **Portable persona export/import:** Uses the canonical persona schema and validates before writing to `IndexedDB`.
- **Restore full backup:** Validates and previews the archive before the user chooses whether to restore chats, personas, or both. No durable data is written before confirmation.
- **Reset UI preferences:** Removes only application-owned preference keys; it does not remove API keys, chats, personas, or attachments.
- **Wipe all local data:** Requires typing `DELETE`. It removes the app's `IndexedDB` data and only `framework-engine:` namespaced `localStorage` keys. If another tab blocks database deletion, show Retry/Cancel instructions and do not claim completion.

#### 4.6 Personal Profile

- The user can save a preferred name or optional contextual profile for use in prompts. Treat it as durable app data and store it in `IndexedDB`, not in an unnamespaced browser key.
- Explain that any profile content included in a model request is transmitted along the same route as the prompt.

#### 4.7 About

- Show the application version, documentation link, and source repository link.
- Do not claim that cloud-provider traffic is fully offline or that API keys never transit a server; refer to the provider-boundary disclosure above.

### 5. Persistence and Accessibility Rules

- `IndexedDB` is the durable store for chats, messages, personas, attachments, analytics, and profile data. `localStorage` is limited to `framework-engine:` namespaced API keys, preferences, onboarding state, and drafts.
- No user data is persisted by the backend. This does not mean cloud requests are zero-egress: the selected provider receives request content, and the same-origin proxy relays cloud requests without persistence or logging.
- Settings controls meet WCAG 2.2 AA: visible focus, keyboard operation, labelled fields, programmatically associated validation errors, non-color status cues, adequate target sizes, and reduced-motion support.
