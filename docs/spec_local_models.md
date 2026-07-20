# Local LLM Connectivity Specification (Ollama)

## Overview

The initial local-model integration supports **locally served Ollama only**. It is a direct browser-to-loopback connection, not a proxy request. LM Studio, vLLM/llama.cpp, Groq, OpenRouter, xAI, and generic OpenAI-compatible endpoints are deferred and must not appear as active integrations.

## 1. Connection Architecture

- **Default base URL:** `http://localhost:11434/api`, with chat at `/chat` and model discovery at `/tags`.
- **Allowed destinations:** Accept only loopback hosts (`localhost`, `127.0.0.1`, or `[::1]`) in the initial build. Do not allow LAN, public, tunnelled, or arbitrary remote URLs through this “local” setting.
- **Request path:** Browser → local Ollama server. Cloud proxies are not involved, and prompts/attachments for a local Ollama request are not sent to the application's same-origin proxy.
- **Local-only scope:** This integration is for models served by the local Ollama daemon. Cloud-hosted model services and credentials are not configured through this local path.

## 2. CORS and Setup

- The browser still enforces CORS for a page loaded from a different origin. The Settings UI displays the exact current application origin and instructs the user to configure their Ollama allowed origins accordingly (for example, through Ollama's `OLLAMA_ORIGINS` configuration) and restart the local service.
- Never advise a wildcard CORS setting as the default. The instructions should direct the user to allow only the displayed application origin and link to the [current official Ollama setup guidance](https://docs.ollama.com/faq).
- The connection test calls the local `/api/tags` endpoint directly. A successful response populates the model selector with installed local models; it does not validate a cloud API key.

## 3. Settings and User Feedback

- **Provider control:** A single `Ollama (local)` enablement control, loopback base-URL input, `Test Connection` action, and dynamically populated model selector.
- **Connection indicator:** While selected, label the provider as `Direct local connection` so the user can distinguish it from a cloud provider routed through the stateless proxy.
- **Failure states:** Distinguish unavailable server, blocked CORS request, invalid loopback URL, no installed models, and a model that cannot process the selected attachment. Give each a clear retry/configuration action.
- **Privacy disclosure:** State that local requests stay between the browser and the configured loopback server. The user is responsible for the local server and model configuration; the application must not claim that every Ollama configuration is offline or risk-free.

## 4. Accessibility and Safety

- Connection test status, model-fetch loading, and errors are conveyed in text and a polite status region, not only with a color/icon.
- Inputs, test controls, and error recovery meet WCAG 2.2 AA keyboard, label, visible-focus, target-size, and reduced-motion requirements.
