# Persona Creator and Editor Specification

## Routes and Purpose

Create uses /personas/create and edit uses /personas/edit/[id]. The editor creates a local persona profile without binding it to a cloud account, provider key, or device-specific model configuration.

## Persona Profile

A persona contains:

- stable identifier and schema version;
- name, tagline, avatar reference, accent color, and tags;
- primary instructions, optional advanced rules, and optional first message; and
- created and updated timestamps.

Provider, model, voice, recent-use, favorite, archive, and API-key settings are separate local metadata. They are never part of the portable profile.

## Validation

- Name and primary instructions are required.
- Name, instruction, tag, avatar, and total record sizes have documented limits before saving.
- Accent color meets contrast requirements in its supported UI treatment.
- Uploaded avatars are validated by MIME type and size, processed locally, and stored as a bounded Blob or safe local reference rather than uncontrolled Base64 text.

## Save and Draft Behavior

Saving validates the record and writes it to IndexedDB in a transaction. A namespaced localStorage draft may be retained only until save, discard, or explicit user deletion. The editor warns before abandoning an unsaved draft.

Editing a persona updates future selection behavior only. It does not rewrite persona snapshots stored in existing sessions.

## Portable Export

The creator may preview the exact profile that a share export will produce. The profile uses the framework-engine.persona/v1 format and contains identity and behavior only. It intentionally excludes all machine-local preferences and credentials.

## Accessibility

Every field has a programmatic label, validation error association, keyboard-operable color selection, and focus movement to the first failed field after submit.
