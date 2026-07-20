# ADR-006: Make persona sharing portable and reviewable

**Date:** 2026-07-16
**Status:** Accepted

## Context

Personas must be shareable without transferring a person’s provider choices, keys, voice settings, or local preferences. Imported prompt content is untrusted input and must not silently change a user’s setup.

## Decision

Persona sharing uses a versioned JSON profile encoded as Base64URL. The portable profile excludes provider, model, voice, API-key, and local-preference data. Every import is schema-validated and shown in a review screen; it is saved only after explicit user confirmation.

## Rationale

A portable, versioned profile makes exports durable across releases while keeping provider configuration local and making imported instructions inspectable.

## Trade-offs

Base64URL is an encoding, not encryption, and shared personas will not reproduce another user’s provider setup or voice experience.

## Consequences and mitigations

- The import flow enforces format/version and size limits, displays all user-visible fields, and rejects malformed or unsupported payloads.
- Imported instructions are treated as data, never executed as application commands; no import may make a network request or alter preferences automatically.
- Export/import fixtures cover forward-compatible version handling and clear user-facing upgrade errors.

## Revisit trigger

Revisit if signed profiles, encrypted exports, collaborative publishing, or a marketplace is introduced.
