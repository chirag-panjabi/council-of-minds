# Frontend Functional Specification: Local Persona Library (`/personas`)

## 1. Route, Purpose & Open-Core Model

- **Route:** `/personas`
- **Primary Goal:** Serve as the local command center for managing, creating, searching, filtering, importing, and exporting AI personas.
- **Open-Core Model:** Because Council of Minds is a local-first application, there is no remote marketplace or hosted catalog. The Library manages local custom personas stored in `IndexedDB` alongside bundled default personas.

## 2. Interactive Elements & Top Action Bar

- **Top Action Bar:**
  - *Create New Persona:* Directs to `/personas/create` (`spec_persona_creator.md`).
  - *Import Persona Button:* Opens the Import Modal dialog (§3.4).
- **Global Navigation Bar:** Includes Sidebar Toggle, Back button, and Settings button.

## 3. Library Filters, Search & View Controls

### 3.1. Search & Dynamic Tag Filter Menu
- **Search Input:** Real-time fuzzy text search against Persona Names and Descriptions.
- **Favorites Filter Toggle:** Quick-filter toggle (star/heart icon) to display favorited personas.
- **Dynamic Tag Filter Menu:**
  - Opens a dropdown menu featuring a tag search field.
  - Automatically extracts all unique tags from saved library personas.
  - Dynamically filters the tag list on keystroke. Supports multi-tag selection for complex filtering.

### 3.2. View Toggles (Grid, List, Card)
- **View Options:**
  - *Grid View:* Compact card grid.
  - *List View:* Dense vertical list prioritizing names and tag badges.
  - *Card View:* Detailed cards with larger avatars and full system descriptions.
- **Persona Card Display:** Avatar, Name, Tagline, Description, Tag Badges, and Favorite indicator.
- **Card Context Menu (Hover / Three-Dot Menu):**
  - *Chat:* Starts a new 1-on-1 session with this persona (`/chat/1-on-1`).
  - *Favorite / Unfavorite:* Toggles favorite status in `IndexedDB`.
  - *Edit:* Routes to `/personas/edit/[id]`.
  - *Export:* Opens the Export Share Code Modal (§3.5).
  - *Archive:* Hides the persona into the Archived tab.
  - *Delete:* Prompts confirmation dialog and permanently removes from `IndexedDB`.

### 3.3. Archived Personas View Tab
- A dedicated "Archived" tab allows users to browse hidden personas.
- Users can click **Unarchive** on any card to restore it to the main active library.

### 3.4. Import Modal & Collision Resolution
- **Input Methods:** Text area for Base64 share codes + raw `.json` file upload fallback.
- **Preview & Validation Steps:**
  1. Decodes candidate Base64/JSON string.
  2. Displays candidate identity, avatar, description, tags, instructions, and format version.
  3. Validates against expected schema and size limits.
  4. Identifies collisions using stable identity IDs (not name alone).
  5. Presents explicit collision resolution choices: *Replace*, *Duplicate*, *Skip*, and *Apply to All* (for bulk imports).
- **Security Rule:** Imported system instructions are displayed for review as untrusted text and never executed as application code.

### 3.5. Export Modal & Base64 Share Code
- **Functionality:** Serializes selected persona into portable format.
- **Schema & Data Isolation:** Exports a `framework-engine.persona/v1` JSON profile encoded as Base64URL.
  - *Included:* Identity, avatar, tagline, system prompt, advanced rules, icebreaker, tags.
  - *Strictly Excluded:* API keys, provider/model overrides, device paths, favorites, archived state, token history, or local metadata.
- **Copy Action:** Displays encoded Base64 string with a prominent 1-click **"Copy Share Code"** button for sharing to community forums (Reddit, Discord).

## 4. Data Storage & Historical Preservation

- **Hydration:** Queries `IndexedDB` `personas` store and combines with static default personas.
- **Non-Destructive Default Hiding:** Bundled default personas can be hidden locally without mutating static source.
- **Historical Session Integrity:** Deleting a persona from the library **never corrupts historical chat sessions**; past sessions render their stored persona snapshot.
- **Performance & Virtualization:** Supports keyboard navigation, visible focus indicators, and list virtualization for large collections.
