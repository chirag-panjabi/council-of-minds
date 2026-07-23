# Frontend Functional Specification: Persona Groups

## 1. Functional Purpose

- **Primary Goal:** Allow users to save a named, reusable set of personas as a **Group**, so a recurring Council roster (e.g., "Dev Council", "Philosophy Circle") can be launched in one action instead of being reassembled from the Unified Persona Selector every session.
- **Relationship to Existing Concepts:** A Group is a saved *roster*, not a saved *conversation*. It stores which personas belong together and, optionally, who acts as their default Synthesizer. It does **not** store model/provider assignments, chat history, or memory state—those remain properties of an individual Council session (see `spec_persona_creator.md`).
- **Prerequisites:** At least two existing personas in the user's library (matching Council Mode's two-persona minimum).

## 2. Interactive Elements Inventory

1. **Sidebar: Groups Section**
   - *Group List Items:* Avatar-stack + name, tap to launch Council Setup.
   - *Create New Group Button:* Opens inline creator modal.
2. **Group Creator / Editor (Inline Panel or Lightweight Modal)**
   - *Group Name Input:* Required text field.
   - *Member Picker:* Reuses the Unified Persona Selector in multi-select mode.
   - *Selected Members List:* Reorderable (drag to reorder, sets default speaking order).
   - *Default Synthesizer Selector:* Optional designated Judge persona.
   - *Save Button:* Validates and writes to `IndexedDB`.
3. **Group Card / List Item Context Menu**
   - *Launch Council:* Opens pre-filled Council Setup.
   - *Edit Group:* Re-opens creator modal.
   - *Duplicate Group:* Creates copy with "(Copy)" suffix.
   - *Delete Group:* Removes group from `IndexedDB` without deleting member personas.
4. **Dashboard: Groups Overview Grid**
   - Browsing view displaying card layout with avatar-stacks and action badges.

## 3. Detailed Component & Interaction Flows

### 3.1. Sidebar Groups Section
- **Placement:** Dedicated section in the sidebar positioned above/alongside Recent Conversations.
- **Group List Item Display:** Stacked-avatar cluster (composited from member avatars, capped at 4 visible + "+N" overflow badge) and Group name.
- **Tap Action:** Opens Council Setup (`spec_council.md`) with member personas pre-selected in saved order. User completes model assignments before debate starts.
- **Create Button:** Launches Group Creator (§3.2).

### 3.2. Group Creator / Editor
- **Type:** Lightweight inline panel or modal.
- **Group Name Input:** Required string.
- **Member Picker:** Integrates `spec_persona_selector.md` in checklist configuration.
- **Selected Members List:** Reorderable drag-and-drop list defining default speaking order in Council.
- **Default Synthesizer Selector:** Pre-fills the Synthesizer slot in Council setup if designated.
- **Save Action:**
  1. Validates name and at least 2 members.
  2. Generates unique UUID `id` (or updates existing).
  3. Writes to `IndexedDB` `groups` store.
  4. Immediately refreshes sidebar and closes modal.

### 3.3. Group Context Menu
- **Launch Council:** Starts pre-filled setup.
- **Edit Group:** Modifies existing record.
- **Duplicate Group:** Clones roster with "(Copy)" suffix.
- **Delete Group:** Prompts confirmation and removes `IndexedDB` record. Deleting a group **never** deletes member personas.

### 3.4. Dashboard Groups Overview Grid
- Browsing grid view complementary to sidebar list. Shows larger avatar-stacks, member counts, and synthesizer badge.

## 4. Data Model Schema

```ts
interface Group {
  id: string;             // UUID
  name: string;           // Group display name
  personaIds: string[];   // Ordered persona IDs defining default speaking order
  synthesizerId?: string; // Optional default synthesizer persona ID
  createdAt: Date;
  updatedAt: Date;
}
```
- Stored in `IndexedDB` under the `groups` object store via Dexie.js.
- **Explicitly Excluded:** Model/provider selections, chat history, and summarization state remain session-specific.

## 5. Edge Cases & Conditional Logic

- **Member Persona Deleted:** Deleted personas display as "Persona Unavailable" in editor. Excluded automatically from avatar stack and Council setup. Group remains launchable if at least 2 valid personas remain.
- **Fewer Than 2 Members Remain:** Sidebar shows warning badge; primary action becomes "Edit Group" instead of "Launch Council".
- **Synthesizer Removed:** If a persona assigned as Synthesizer is removed from member list, Synthesizer field clears automatically.
- **Empty State:** Sidebar shows compact "No groups yet" state with emphasized Create button.

## 6. Explicitly Out of Scope

- **Cross-session Group memory:** Groups are roster shortcuts, not cross-session memory containers.
- **Shared/Hosted Groups:** Groups are local-only (Base64 group export/import is deferred to future roadmap).
