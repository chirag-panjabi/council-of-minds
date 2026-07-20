# Onboarding Specification

## Route and Purpose

The onboarding route is /onboarding. It helps a first-time user configure a cloud provider key or an Ollama connection and understand the real data flow before the first request.

## Entry Rules

- A client-side gate checks the namespaced onboarding and key state after hydration.
- If no usable provider is configured and onboarding has not been skipped, the client routes the user to onboarding.
- Server middleware must not be described as reading browser storage.
- A user may skip onboarding and explore non-generation screens. Generation controls remain unavailable until a valid provider is configured.

## Provider Setup

### Cloud Provider

1. The user chooses OpenAI, Anthropic, or Google Gemini.
2. The UI explains that the key is stored in namespaced localStorage and will transit the same-origin stateless proxy when a request is made.
3. The user enters a key in a masked field and selects Validate and Save.
4. The client calls the same proxy path used for generation. The proxy must not store or log the key.
5. On success, the key is saved locally and the user can continue to the dashboard. On failure, the key is not saved and the UI explains whether the problem is validation, connectivity, or provider availability without exposing sensitive details.

### Ollama

1. The user provides or confirms the localhost endpoint.
2. The UI explains that this browser-direct connection requires the local server to allow the application origin through CORS.
3. The client tests the endpoint directly. It never sends the request through a remote proxy.
4. On failure, the UI offers an actionable unavailable-server or CORS explanation.

## Privacy Notice

The onboarding screen must not say that prompts, attachments, or keys never leave the device. It must state that cloud requests transit the stateless proxy and selected provider, while Ollama requests go to the user-selected localhost endpoint. Link to [Privacy, Security, and Safety](./PRIVACY_AND_SAFETY.md).

## Skip Behavior

Skipping stores only a namespaced onboarding preference. The dashboard displays a non-dismissible generation gate with a direct path to Settings or Onboarding. It must not prevent viewing local personas, documentation, or previous non-Incognito data.

## Acceptance Criteria

- Cloud key validation and generation use the same proxy boundary.
- A failed validation never persists the entered key.
- An Ollama validation request is browser-to-localhost and reports CORS clearly.
- The screen is keyboard accessible, masks key entry by default, restores focus after errors, and contains no false privacy promise.
