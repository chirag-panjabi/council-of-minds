# Privacy, Security, and Safety Contract

## Scope

This contract applies to the open-source Framework Engine target architecture. It explains data flows plainly; it does not promise that AI-provider requests remain on the user's device.

## Data Flows

| Data | Stored locally | Sent outside the browser | Notes |
|---|---|---|---|
| API keys for cloud providers | Namespaced `localStorage` | Same-origin stateless proxy, then selected provider | Keys must not be persisted or logged by the proxy |
| Prompts, chat context, summaries, and attachments | IndexedDB except Incognito | Selected cloud provider through the proxy | Summarization may use a different provider only after explicit opt-in |
| Ollama prompts and context | IndexedDB except Incognito | User-configured `localhost` endpoint directly from the browser | Requires a local-server CORS configuration |
| Incognito conversation | Memory only | Selected provider as required to generate a response | Excluded from local persistence, analytics, search, exports, and recent lists |
| Persona share code | User-selected export destination | Only when the user copies or downloads it | Base64URL is an encoding, not encryption |

## Security Requirements

- Serve the application over HTTPS and send cloud-provider requests only to the same-origin proxy.
- Set a restrictive Content Security Policy, avoid untrusted third-party scripts, and never render untrusted HTML from persona content, messages, or attachments.
- Redact API-key headers and request bodies from application logs, error reports, traces, and diagnostics.
- Apply request-size limits, origin checks, and rate limits to the proxy. It must not be an open arbitrary-URL proxy.
- Store only app-owned values under a documented key prefix. Wipe operations remove that prefix rather than unrelated origin storage.
- Importing a persona must show its decoded prompt and metadata before it is stored or used.

## Incognito Contract

Incognito must be chosen before the first message. Switching an existing saved conversation to Incognito offers only two choices: start a new Incognito conversation or cancel. It never silently deletes or reclassifies prior messages.

## Advice and Persona Safety

The product may support reflective, educational, and brainstorming use cases. It must not present generated material as professional medical, mental-health, legal, financial, or crisis advice. Relevant surfaces must disclose this limitation and provide an immediate emergency-resource path for crisis language. Historical, public-figure, and branded personas must be clearly presented as user-created simulations, not authentic endorsements or representations.
