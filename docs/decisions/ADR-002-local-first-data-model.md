# ADR-002: Use a local-first, versioned data model

**Date:** 2026-07-16
**Status:** Accepted

## Context

Sessions, messages, personas, summaries, and search data need durable local storage. Previous specs assigned overlapping ownership to `localStorage` and IndexedDB, which would make migrations, export, search, and deletion unreliable.

## Decision

IndexedDB is the canonical durable store for application data, including sessions, messages, personas, summaries, attachments metadata, and search indexes. `localStorage` is limited to namespaced API keys, lightweight preferences, onboarding state, and drafts. Persisted records use explicit schema versions and migrations.

## Rationale

IndexedDB supports larger structured data and transactional updates; a narrow `localStorage` role keeps synchronous browser storage from becoming a second database.

## Trade-offs

IndexedDB requires asynchronous access, migration code, and quota handling. API keys remain locally stored browser data and therefore require a strong XSS posture.

## Consequences and mitigations

- All `localStorage` keys use the application namespace; data operations remove only those keys and stores, never `localStorage.clear()`.
- One storage adapter owns serialization, schema migration, export, import, and quota/error handling.
- Export includes durable user data but excludes API keys by default; migrations are tested against prior schema fixtures.

## Revisit trigger

Revisit if multi-device sync, encrypted key storage, shared workspaces, or storage-volume measurements require a different persistence layer.
