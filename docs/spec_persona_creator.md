# Frontend Functional Specification: Persona Creator & Editor

## 1. Routes & Functional Purpose

- **Routes:** Create uses `/personas/create`. Edit uses `/personas/edit/[id]`.
- **Primary Goal:** Provide a streamlined form interface for users to build, edit, and configure custom AI personas to save to their local library.
- **Environment Isolation:** Creating or editing a persona profile configures identity and behavior only. It does not bind the persona to a cloud account, provider API key, or device-specific model configuration.

## 2. Interactive Form Elements & Layout

### 2.1. Core Identity & Styling
- **Avatar Upload / Emoji Picker:** Users can select a standard emoji or upload a custom image. Uploaded images are downscaled client-side via HTML5 canvas API and stored as a bounded Blob/reference in `IndexedDB` (validated by MIME type and file size limits).
- **Theme / Hex Accent Color Picker:** Assigns a specific accent color to the persona, used for visual identification (chat bubble border/tint and name styling) in 1-on-1 and Council chats. Must satisfy WCAG color contrast requirements.
- **Persona Name Input:** Required text field.
- **Tagline / Short Description Input:** Concise summary field for quick scanning in cards and lists.

### 2.2. Brain & Behavior (Progressive Disclosure)
- **Persona Instructions Textarea:** Primary system prompt definition field. Required validation.
- **First Message Textarea (Greeting / Icebreaker):** Optional initial message rendered when starting a fresh session with this persona.
- **+ Add Advanced Rules (Toggle):** Progressive disclosure button expanding a secondary textarea for *Advanced Rules & Formatting*. Moves rigid formatting rules, structural framing, and output constraints out of the primary definition.

### 2.3. Organization & Tags Combobox
- **Tags Input Combobox:** Multi-select combobox. As the user types, it searches and auto-suggests unique tags already present in the local library. Pressing Enter on a new string creates a new custom tag.

## 3. Save, Navigation & Draft Recovery

- **Validation:** Required fields (Name, System Prompt) are enforced. Field sizes, tag counts, and total record limits are checked before commit.
- **Submit Focus Management:** On validation failure, focus is automatically moved to the first failed form field with an associated programmatic ARIA error message.
- **Transactional Save:** Generates a unique UUID `id` (or overwrites existing record on edit) and writes to `IndexedDB` `personas` store in a single transaction.
- **Context-Aware Navigation:**
  - *Full Page:* Returns to `/personas` Library page upon save.
  - *Modal / Overlay:* Closes modal and immediately applies the updated persona to the active chat session.
- **Debounced Draft Auto-Save:** Unsaved form state is debounced to `localStorage` under namespaced key (`framework-engine:draft_persona`). The editor prompts a confirmation warning before abandoning an unsaved draft.
- **Historical Integrity:** Updating a persona profile affects future selections only; it never alters persona snapshots stored in existing historical chat sessions.

## 4. Portable Profile Schema & Export Preview

- **Export Profile Schema:** Profiles export using the `framework-engine.persona/v1` format.
  - *Included:* Identity (avatar, name, tagline), behavior (system prompt, advanced rules, first message), and tags.
  - *Strictly Excluded:* Provider API keys, model overrides, voice selection, local file paths, favorites, archived state, or token history.
- **Export Preview:** The editor provides a preview of the exact Base64URL share payload prior to export.

## 5. Accessibility Guidelines

- Programmatic labels for all inputs, keyboard-operable color picker, ARIA error associations, and compliance with `prefers-reduced-motion`.
