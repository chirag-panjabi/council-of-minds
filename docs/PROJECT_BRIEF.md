# Framework Engine

## Target Product Brief

Framework Engine is a local-first, Bring-Your-Own-Key workspace for people who want to test ideas through focused 1-on-1 conversations and structured multi-persona deliberation. It is designed for developers, researchers, creators, and reflective users who need control over their prompts, data, models, and costs.

This brief describes the next implementation. It supersedes the legacy implementation and is governed by [Target Scope](./PRODUCT_SCOPE.md) and the ADRs in [decisions](./decisions/).

## Product Principles

- **User-owned data:** Durable application data stays in the user's browser. There are no accounts, backend database, billing system, or hosted marketplace in the open-source edition.
- **Honest privacy:** Cloud requests necessarily leave the browser for the selected provider. The application must explain this rather than claim that prompts or keys never leave the device.
- **Bring your own key:** Users choose and control their cloud-provider keys. Local-model users can instead connect to their own Ollama server.
- **Deliberate multi-agent work:** Council Mode favors understandable, sequential turns over opaque parallel activity.
- **Cost visibility and control:** Generation, summarization, and Auto-Pilot must be bounded, cancellable, and visible to the user.
- **Portable personas:** Personas are local, inspectable, shareable profiles—not hosted marketplace inventory.

## MVP Experience

### Dashboard and Navigation

The dashboard provides entry points to 1-on-1 setup, Council setup, the persona library, recent sessions, settings, and analytics. The sidebar provides the same durable navigation without creating a second source of truth for session routes.

### Personas

Users can create, edit, archive, search, import, export, and select local personas. A persona defines identity and behavior only; provider and model choices remain local preferences. Imports must be decoded, previewed, validated, and confirmed before use.

### 1-on-1 Chat

The user selects a persona and model, sends a prompt, receives a cancellable streamed response, and can continue, edit, or regenerate a conversation. Saved sessions use the mode-specific session route defined in Target Scope.

### Council Chat

The user selects at least two personas, chooses models, and moderates a sequential debate. Manual stepping is the default. Auto-Pilot is off initially and always finite. A separately selected synthesizer may close a debate with a final response. Saved sessions use the mode-specific session route defined in Target Scope.

### Local Data and Portability

IndexedDB stores durable app data. Namespaced localStorage keys store API keys, preferences, onboarding state, and drafts. Users can create versioned full backups and restore them after a preview. Wiping data never clears unrelated origin storage.

## Trust and Data Flow

Cloud-provider requests use a same-origin stateless proxy. API keys, prompts, and attachments transit the proxy and then the selected provider, but the proxy must not persist or log them. Ollama requests go directly from the browser to a user-configured localhost endpoint. The detailed contract is in [Privacy, Security, and Safety](./PRIVACY_AND_SAFETY.md).

## Product Boundaries

The open-source edition excludes accounts, hosted persona discovery, payments, cloud sync, remote databases, web search, and code execution. Planned work is tracked only in [Future To-Do](./future_todo.md), so this brief remains a stable MVP contract.

## Success Criteria

The product is ready for MVP implementation when every item in [MVP Acceptance Checklist](./MVP_ACCEPTANCE.md) is demonstrably satisfied and each significant architecture decision is reflected in the ADRs.
