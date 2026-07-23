# Data Management and Import/Export Specification

## Overview

`IndexedDB` acts as the sole local database for chats, messages, personas, attachment Blobs, user profile data, and token usage analytics. Import, export, restore, and wipe must be explicit, previewable, zero-egress browser operations. API keys are strictly excluded from all data exports.

## 1. Export Workflows

### 1.1 Full Backup & Chat History Archive (`.zip`)
- **Trigger:** The user clicks `Export Full Backup` or `Export Chat History` in Settings → Data & Privacy.
- **Format:** Generates a client-side `.zip` archive via `JSZip` containing:
  - Versioned `manifest.json` (format, `schemaVersion`, `createdAt`, app version, included data categories).
  - Structured JSON chat session and message files.
  - Optional **Readable Markdown Transcripts (`.md`)** for each conversation.
  - Attachment binary Blobs preserved as raw binary entries (not converted to Base64 text).
- **Exclusions:** Excludes API keys, local drafts, onboarding state, transient UI state, and all Incognito content (messages, attachments, titles, analytics, search entries).
- **UI Progress:** Shows a loading spinner and accessible progress bar (e.g., *"Zipping 45 chats..."*) processed inside a Web Worker so the main UI thread stays responsive.

### 1.2 Portable Persona Export (`.json`)
- **Trigger:** The user clicks `Export Custom Personas`.
- **Format:** Serializes user-created personas into a portable JSON array (`personas_backup_YYYY-MM-DD.json`). Excludes API keys, model overrides, device paths, and local settings.
- **UI Feedback:** Displays a notice reminding the user that exported persona prompts are saved locally for sharing.

## 2. Import and Restore Workflows

### 2.1 Entry Points & Drag-and-Drop Dropzone
- **Entry Points:** File picker button or an interactive **Drag-and-Drop Dropzone** supporting `.json` files up to **5 MiB** (for personas) and `.zip` archives (for full backups).
- **Pre-Flight Validation:** Validates MIME type, byte size, archive manifest, and schema using Zod before parsing into `IndexedDB`. Never executes imported content as code. Checks browser storage quota before restore.

### 2.2 Preview Before Commit
- Parses backup archive into temporary worker state and displays an interactive preview: creation date, schema version, counts of chats/personas/messages/attachments, estimated storage required, and conflicts.
- User can choose to restore **Personas**, **Chats**, or **Both**. No durable database changes occur until preview is confirmed.

### 2.3 Collision Detection & Resolution UI
- Identity collision key is a matching `id`. A matching name triggers a warning prompt only.
- For each identity conflict, the UI presents a modal with 3 explicit resolution buttons:
  1. **Replace Existing:** Overwrites local persona/session with imported version.
  2. **Keep Both (Duplicate):** Assigns a new UUID and appends `"(Copy)"` or `"(Imported)"` label to the record name.
  3. **Skip:** Preserves local record and ignores imported item.
- **Bulk Action:** Includes an accessible **"Apply to all conflicts"** checkbox for bulk processing.

### 2.4 Completion & Transactional Recovery
- Writes restore batches in transactions that preserve error state. Reports exact restored counts and links to the Persona Library or restored session URL upon completion.

## 3. Data Wiping: Danger Zone (`/settings`)

- **Trigger:** The user clicks `Wipe All Local Data`.
- **Confirmation Modal:** Displays a severe red-themed confirmation modal requiring the user to manually type `"DELETE"`. Explains that all chats, personas, attachments, API keys, and settings will be permanently erased.
- **Execution & Storage Cleanup:** Deletes the `IndexedDB` database and clears only `framework-engine:` namespaced `localStorage` keys. Blanket `localStorage.clear()` is strictly forbidden.
- **Multi-Tab Blocked Deletion:** If another tab has the database open, halts wipe, warns the user to close competing tabs, and presents *Retry* / *Cancel*. App keys remain intact until DB deletion succeeds.
- **Post-Wipe Hard Refresh:** Upon successful wipe, executes `window.location.reload()`, forcing the client route guard to redirect the user to `/onboarding` since API keys and profile settings no longer exist.

## 4. Security, Privacy & Accessibility

- **Zero-Egress Guarantee:** File API processing, Blob creation, and compression run 100% locally within the browser sandbox. No file chunks, transcripts, or telemetry leave the client.
- **WCAG 2.2 AA Compliance:** Full keyboard operation for dropzones and dialogs, visible focus rings, text alternatives to color, programmatically associated errors, and reduced-motion feedback.
