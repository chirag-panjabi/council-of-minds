# Data Management and Import/Export Specification

## Overview

`IndexedDB` is the durable local database for chats, messages, personas, attachment blobs, profile data, and analytics. Import, export, restore, and wipe must be explicit, previewable, and local browser operations. API keys are deliberately excluded from all exports and restores.

## 1. Export Workflows

### 1.1 Full Backup

- **Trigger:** The user selects `Export Full Backup` in Settings → Data & Privacy.
- **Format:** Create a client-side ZIP archive with a versioned `manifest.json`, structured persona/session/message files, and attachment binary files. Attachments remain Blob/binary entries; do not turn them into persisted Base64 strings merely for backup.
- **Manifest:** At minimum identify `format`, `schemaVersion`, `createdAt`, app version, included data categories, and the archive paths needed to restore them. It must allow a future version to identify whether a safe migration is available.
- **Contents:** Include selected durable chats, messages, personas, and their attachment blobs. Exclude API keys, local drafts, onboarding state, transient UI state, and every Incognito message, attachment, title, analytics record, search entry, and history record.
- **Feedback:** Show progress such as “Preparing 45 chats…” with an accessible busy state. Create the archive in a worker where practical so the main UI stays responsive, then hand it to the browser download flow.

### 1.2 Portable Persona Export

- **Trigger:** The user selects `Export Custom Personas`.
- **Format:** Export the canonical, versioned persona schema as JSON. It includes only persona data necessary for a recipient to use it; it does not include chats, user profile data, API keys, analytics, or provider credentials.
- **Feedback:** Clearly identify the generated file as sensitive prompt content the user is choosing to share.

## 2. Import and Restore Workflows

### 2.1 Entry Points and File Validation

- `Import Personas` accepts JSON files up to **5 MiB**. `Restore Full Backup` accepts the versioned archive format. A file picker is always available; drag-and-drop is an optional equivalent, not the only interaction.
- Validate file type, byte size, archive paths, manifest version, and schema before reading data into `IndexedDB`. Never execute imported content or treat a filename, prompt, or archive path as HTML.
- A full-backup restore checks available storage and reports a clear failure before writes if the browser cannot safely complete it. Do not invent a universal storage-size promise because browser quotas vary.

### 2.2 Preview Before Any Write

- Parse and validate into memory/temporary worker state, then show a preview: backup creation date, schema version, counts of chats/personas/messages/attachments, estimated local storage required, unsupported items, and conflicts.
- Let the user choose to restore **personas**, **chats**, or **both**. No durable record changes until they confirm the preview.
- Supported older schema versions are migrated before the preview; unsupported or future versions stop with a clear, non-destructive error.

### 2.3 Collision Detection and Resolution

- A canonical `id` is the identity collision key. A matching normalized name is a warning only, because different personas may intentionally share a name.
- For each identity collision, offer `Replace existing`, `Keep both` (assign a new UUID and append an imported label), or `Skip`. Allow an accessible “Apply to all remaining identity conflicts” option.
- When restoring chats, preserve their IDs only when no collision exists; otherwise create a new session ID and update its message/attachment references atomically.

### 2.4 Completion and Recovery

- Write the selected restore set in transactions/batches that leave a recoverable error state. If a batch fails, report what completed and offer retry rather than claiming an all-or-nothing restore that did not occur.
- On completion, announce the restored counts and link to the Persona Library or the relevant canonical session URL. Incognito content cannot be restored because it was never persisted or exported.

## 3. Data Wiping: Danger Zone

- **Trigger:** The user selects `Wipe All Local Data`.
- **Confirmation:** Use a clearly labelled destructive dialog and require the exact text `DELETE`. Explain that chats, messages, personas, attachment blobs, analytics, profile data, provider keys, preferences, drafts, and onboarding state will be removed from this browser.
- **Deletion:** Delete the application `IndexedDB` database/stores and only browser keys beginning with `framework-engine:`. Never call blanket `localStorage.clear()`.
- **Blocked deletion:** If another tab/window has the database open, report that deletion is blocked, ask the user to close the other tab, and provide Retry and Cancel. Keep app keys until database deletion completes; do not display success or reload as if the wipe completed.
- **Completion:** Once both local stores are removed, reload and route to `/onboarding` because provider configuration no longer exists.

## 4. Security, Privacy, and Accessibility

- Import/export/restore/wipe processing runs in the browser and sends no archive bytes, filenames, or import metadata to the application backend. This local-operation guarantee does not change the separately disclosed cloud-provider request path for chat content.
- Durable app data remains on the current browser until the user deletes an item or completes a wipe; the app has no hidden remote backup or automatic remote retention. Downloaded backup files are outside the app's control and remain the user's responsibility to retain or delete.
- Backups may contain sensitive prompts and attachments. The UI warns users before export and does not imply that downloaded files are encrypted.
- All progress, validation, conflict, and failure states meet WCAG 2.2 AA: keyboard-operable file selection and dialogs, visible focus, text alternatives to color, programmatically associated errors, and reduced-motion-safe feedback.
