# ADR-001: Define the network and privacy boundary

**Date:** 2026-07-16
**Status:** Accepted

## Context

The product is BYOK and local-first, but cloud-model requests necessarily leave the browser. Earlier specifications mixed "never leaves the device" language with proxy and direct-provider flows. These decisions govern the greenfield implementation; legacy code is out of scope.

## Decision

OpenAI, Anthropic, and Gemini requests use a same-origin, stateless proxy. API keys, prompts, responses, and attachment bytes may transit that proxy solely to reach the selected provider; they are never persisted or logged by the application or proxy. The product must not claim that cloud-provider data stays on the device.

## Rationale

A same-origin proxy gives cloud providers one controlled request boundary and avoids browser CORS differences, while an explicit egress disclosure is more truthful than an absolute privacy claim.

## Trade-offs

The proxy becomes an availability and trust boundary, and users who need no network egress must choose a local model. Direct browser-to-cloud calls are not an MVP path.

## Consequences and mitigations

- Request/response bodies, authorization headers, API keys, and attachment content are excluded from logs, traces, analytics, and error reports.
- Diagnostics retain only scrubbed operational metadata needed for reliability; redaction is tested at the proxy boundary.
- The UI identifies the selected provider and warns that submitted content is sent to that provider.

## Revisit trigger

Revisit if the product adds a credential broker, self-hosted proxy, provider-side privacy guarantees, or a transport that changes the egress boundary.
