# Frontend Functional Specification: Unified Persona Selector Modal

## 1. Overview & Trigger Points

- **Primary Purpose:** A centralized popup/modal component used across the application to search, filter, and select personas without leaving the active context. Never queries an external marketplace.
- **Invocation Trigger Points:**
  - *Dashboard & 1-on-1 Chat:* Clicking "New Chat", selecting a persona card, or clicking the header persona indicator.
  - *Council Mode:* Clicking "Add Agent" to add debaters to the roster or selecting a Synthesizer persona.
  - *Active Chat:* Clicking a persona avatar/name to swap personas or view details mid-conversation.

## 2. Interface Layout & Core Components

### 2.1. Header Bar (Top)
- **Auto-Focused Search Input:** Text field automatically focused on modal open. Filters by persona name, description, and tags in real-time.
- **Filter Chips / Categories:** Toggles for *Favorites*, *Recently Used*, *Custom*, *Default/System*, and *Archived*.
- **Create Persona Shortcut Button (`+ New`):** Fixed button positioned in the header beside search/filters so it remains visible without scrolling. Clicking opens the Persona Creator (`spec_persona_creator.md`) and returns to the selector with focus restored upon save.

### 2.2. Main Persona List
- **List & Grid Rendering:** Displays scrollable persona cards with Avatar, Name, Short Description, and Tag badges.
- **In-Selector Favorite Toggle:** Each item features an interactive heart/star icon to toggle favorite status directly within the selector, writing to `IndexedDB` in real-time.
- **Empty State:** If a search returns zero results, displays a "No personas found" card with a prominent action button to create a new persona.

### 2.3. Action Footer (Bottom)
- **Selection Confirmation Pattern:** Clicking a persona highlights/marks it as selected rather than closing immediately. The footer confirms choice.
  - *1-on-1 Mode:* Single selection. Button reads **"Start Chat"** or **"Select Persona"**.
  - *Council Mode:* Multi-selection checklist. Button reads **"Add to Council"** (shows count of marked agents).
  - *Synthesizer Slot:* Single selection. Button reads **"Assign Synthesizer"**.
- **Enter & Escape Behavior:** Pressing `Enter` confirms choice only when a candidate is marked. `Escape` closes the modal without altering caller selection.

## 3. Data Handling & Incognito Privacy Boundary

- **Data Source:** Reads local custom personas and bundled default personas from `IndexedDB`.
- **Recently Used Tracking:** Maintains an array of previously selected persona IDs and timestamps in `IndexedDB`.
- **Strict Incognito Privacy Rule:** Recently Used timestamps are updated **only during non-Incognito sessions**. Selecting a persona for an Incognito session explicitly skips timestamp updates to prevent local usage tracking.
- **Corrupt Record Recovery:** If a stored persona record is unreadable or fails schema validation, it is gracefully skipped from the list and an actionable recovery path is presented.

## 4. Accessibility & Performance at Scale

- **Focus Trapping:** Traps focus inside the modal while open and restores focus to the triggering element on close.
- **Keyboard Navigation:** Full arrow-key navigation through list items.
- **Screen Reader Announcements:** Announces marked/selected states accessibly.
- **List Virtualization:** Uses list virtualization for large local collections (hundreds of personas) to ensure smooth rendering.
