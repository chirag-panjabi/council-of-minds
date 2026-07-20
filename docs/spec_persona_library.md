# Local Persona Library Specification

## Route and Purpose

The library route is /personas. It is the open-source product's only persona discovery and management surface; there is no hosted marketplace, premium tier, or remote catalog.

## Data Source

The library reads durable persona records from IndexedDB and combines them with shipped default personas. Default personas are marked as defaults and can be hidden locally without mutating the bundled source.

## Core Actions

- Create opens /personas/create.
- Edit opens /personas/edit/[id].
- Chat begins 1-on-1 setup with the selected persona.
- Favorite, archive, unarchive, and delete update IndexedDB transactionally.
- Search and filtering operate on local name, description, tags, archive state, and favorite state.

Deleting a persona that appears in prior sessions must not corrupt those sessions; historical messages render their stored persona snapshot.

## Import

The library accepts either a single Base64URL persona share code or a versioned JSON backup. Before any durable write, the UI:

1. decodes the candidate;
2. shows its identity, description, tags, instructions, and format version;
3. validates the expected schema and size limits;
4. identifies collisions using stable identity, not name alone; and
5. offers Replace, Duplicate, Skip, and Apply to All for bulk imports.

Imported system instructions are untrusted content. They are displayed for review and never interpreted as application code.

## Export

A single-persona share export produces a framework-engine.persona/v1 JSON profile encoded as Base64URL. It includes identity and behavior fields only. It excludes API keys, provider/model preferences, voice selection, device paths, archived state, favorites, usage history, and other local metadata.

Bulk backups use the versioned manifest described in [Data Management](./spec_data_management.md).

## Accessibility and Performance

The library supports keyboard browsing, clearly labelled context actions, focus restoration after dialogs, and a virtualized list/grid when the local collection is large.
