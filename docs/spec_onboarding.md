# Frontend Functional Specification: Onboarding & Welcome (`/onboarding`)

## 1. Route & Functional Purpose

- **Route:** `/onboarding`
- **Primary Goal:** Guide first-time users through initial setup to configure at least one cloud provider API key (OpenAI, Anthropic, Gemini) or a local Ollama connection.
- **Secondary Goal:** Educate the user on the local-first, privacy-conscious BYOK architecture and data boundaries before making their first generation request.

## 2. Interactive Elements Inventory & Layout

1. **Welcome Hero Section:** Application title, tagline, and local-first architecture summary.
2. **Privacy & Security Disclosure Banner:** Clear visual callout explaining local browser storage (`localStorage` / `IndexedDB`) and same-origin proxy transit disclosures. Links to [Privacy, Security, and Safety](./PRIVACY_AND_SAFETY.md).
3. **Provider Configuration Card:**
   - *Provider Selector Dropdown:* Allows choosing OpenAI, Anthropic, Google Gemini, or Local Ollama.
   - *Helper Links:* 1-click external links to provider API key dashboards (OpenAI Platform, Anthropic Console, Google AI Studio) to assist users in generating keys.
   - *API Key Password Field:* Masked input field with explicit temporary "eye" reveal control.
   - *Validate & Save Button:* Triggers stateless pre-flight key validation.
4. **"Skip for Now" Action:** Allows users to explore non-generation UI screens before entering keys.

## 3. Provider Setup & Validation Boundaries

### 3.1. Cloud Providers (OpenAI, Anthropic, Gemini)
- Clicking *Validate & Save* sends a lightweight non-billing test call (e.g. `/models` endpoint) via the same-origin stateless proxy.
- **Success:** Stores the key under its `framework-engine:api-key:<provider>` key in `localStorage` and routes the user to the Dashboard (`/`).
- **Failure:** Keeps the entered key unpersisted, displays a field-associated error message, and retains user input for correction.

### 3.2. Local Provider (Ollama)
- User specifies or confirms the loopback base URL (e.g., `http://localhost:11434`).
- Client tests connection directly from browser to localhost. On CORS or connection error, provides actionable configuration instructions.

## 4. Skip Behavior & Dashboard Generation Gate

- Clicking *Skip for Now* writes `framework-engine:has_skipped_onboarding = "true"` to `localStorage` and routes to the Dashboard (`/`).
- The app enters a "Read-Only Exploration" state: browsing local personas, reading documentation, or managing past data is allowed, but chat generation controls display a persistent, non-dismissible **Generation Gate Banner** linking directly to `/settings` or `/onboarding`.

## 5. Client Hydration Route Guard

- A client-side route guard in root layout evaluates browser storage state after hydration.
- If no valid provider key exists AND `framework-engine:has_skipped_onboarding` is not `"true"`, it automatically redirects unconfigured sessions to `/onboarding`.

## 6. Accessibility Guidelines

- WCAG 2.2 AA compliance: password field masking, visible focus indicators, aria-describedby validation error association, focus restoration on error, and keyboard navigation.
