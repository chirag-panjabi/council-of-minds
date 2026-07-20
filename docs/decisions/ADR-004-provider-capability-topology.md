# ADR-004: Separate cloud and local provider topology

**Date:** 2026-07-16
**Status:** Accepted

## Context

A remotely deployed proxy cannot reach a user’s loopback model server. Treating cloud and local providers as one network path would make local models fail or weaken the privacy model.

## Decision

The MVP supports OpenAI, Anthropic, and Gemini through the same-origin proxy defined in ADR-001. Ollama is the MVP local provider and is called directly by the browser at `localhost` through its CORS-enabled API. Groq, OpenRouter, xAI, LM Studio, and vLLM are deferred.

## Rationale

This topology matches network reality while keeping the first provider matrix small enough to test thoroughly. It preserves a no-application-proxy path for Ollama.

## Trade-offs

Ollama availability and CORS configuration are user-environment concerns; the MVP does not offer every compatible endpoint or provider.

## Consequences and mitigations

- A provider capability registry declares each provider’s transport, streaming support, model selection, and applicable features.
- The app performs a clear local connectivity check and surfaces actionable CORS or unavailable-server errors.
- The UI distinguishes local Ollama execution from cloud-provider egress and never routes `localhost` requests through the remote proxy.

## Revisit trigger

Revisit when adding another local runtime, expanding the cloud-provider matrix, or when capability differences require a more formal adapter contract.
