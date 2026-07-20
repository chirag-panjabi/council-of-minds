# ADR-007: Keep Incognito memory-only and scope data operations

**Date:** 2026-07-16
**Status:** Accepted

## Context

An Incognito label is meaningful only if it prevents all local retention paths. Data-management features also need to delete this application’s data without harming other applications that share the browser.

## Decision

Incognito conversations exist only in memory. They create no history, search index, analytics event, export, draft, summary, or durable session record. Before sending an Incognito message, the UI discloses that content still egresses to the chosen cloud provider or local Ollama endpoint. Persistent-data export and wipe operate only on named application stores and namespaced keys.

## Rationale

This gives users a concrete local-retention guarantee without obscuring the separate provider-network boundary, and scoped operations protect unrelated browser data.

## Trade-offs

Incognito chats cannot survive reloads, be recovered after a crash, searched, exported, or resumed. The mode does not make a cloud provider private or offline.

## Consequences and mitigations

- Incognito mode has a persistent visual indicator and automated tests verify that no persistence or analytics code path runs.
- Export omits API keys and never includes Incognito state; wipe cancels in-flight work where possible and removes only the application’s IndexedDB stores and namespaced `localStorage` keys.
- The privacy notice names the selected destination before each session starts or provider changes.

## Revisit trigger

Revisit if offline-only operation, encrypted recovery, user-controlled telemetry, or a new persistence mechanism changes the retention contract.
