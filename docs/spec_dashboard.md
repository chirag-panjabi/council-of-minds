# Frontend Functional Specification: Dashboard / Home (`/`)

## 1. Functional Purpose & Page Role

- **Primary Goal:** Serve as an **orientation surface**—where the user lands to understand their setup state, review token usage, and browse saved **Persona Groups** (`spec_persona_groups.md`).
- **Relationship to Navigation:** Primary chat launching and session history navigation live in the persistent Sidebar (`spec_sidebar.md`). The Dashboard focuses on state, analytics, and browsing views rather than duplicating Sidebar navigation.
- **Prerequisites:** Accessible without prior setup or API keys. Users can review stored personas, saved Groups, and analytics without configuring a key.

## 2. Interactive Elements Inventory

1. **Setup Required Banner** (Conditional alert)
2. **Usage-at-a-Glance Widget** (Token usage summary card)
3. **Groups Overview Grid** (Browsing cards for saved Persona Groups)
4. **Zero Groups Empty State** (Guidance card + Group Creator button)
5. **Primary Launch Entry Points** (Start Council, Start 1-on-1, Persona Library shortcuts)

## 3. Component Specifications & Interaction Flows

### 3.1. Setup Required Banner (Conditional)
- **Trigger:** Displays if `hasSkippedOnboarding` is true or no valid provider API keys exist in `localStorage`.
- **Content & Action:** Reminds the user that the application is in a read-only state. Contains a direct action link to `/settings` or `/onboarding`.
- **Accessibility:** Uses a non-disruptive ARIA status/alert pattern; keyboard reachable.

### 3.2. Usage-at-a-Glance Widget
- **Content:** Displays total tokens consumed, most active Persona or Group, and a summary metric card.
- **Action:** Clicking "View Details" routes directly to `/analytics` (`spec_analytics.md`).

### 3.3. Groups Overview Grid
- **Functionality:** Browsing view for all saved Groups, complementary to the Sidebar's quick-scanning list.
- **Card Display:** Shows stacked-avatar cluster (member avatars), Group name, member count, and default Synthesizer badge (if set).
- **Sorting & Filtering:** Recency sort by default (most recently edited/launched first); includes a search input filtering by Group name.
- **Card Action:** Clicking a card opens Council Setup (`spec_council.md`) with that Group's roster and speaking order pre-filled.
- **Card Context Menu:** Launch Council, Edit Group, Duplicate Group, Delete Group (`spec_persona_groups.md` §3.3).

### 3.4. Zero Groups Empty State
- **Trigger:** Active when zero saved Groups exist in `IndexedDB`.
- **Content:** Replaces the grid with a centered explanation card explaining Persona Groups (reusable Council rosters) and a prominent "Create your first Group" button routing to the Group Creator (`spec_persona_groups.md` §3.2).

### 3.5. Primary Launch Shortcuts
- Provides quick-launch action cards for **Start Council** (`/chat/council`), **Start 1-on-1** (`/chat/1-on-1`), and **Persona Library** (`/personas`).

## 4. Background Data & Performance Rules

- **Data Fetching:** Fetches saved Groups from `IndexedDB` `groups` store and recent token usage from `IndexedDB` `tokenUsage` store.
- **Single Source of History:** Recent Conversations are owned exclusively by the Sidebar (`spec_sidebar.md`) to avoid duplicate `IndexedDB` queries and redundant UI elements.
- **Storage Rules:** `localStorage` is restricted to API keys, light preferences, and drafts. Durable data stays in `IndexedDB`.

## 5. Accessibility & Focus Management

- Meets **WCAG 2.2 AA** guidelines for color contrast, target size (24x24px minimum), and visible focus indicators.
- Semantic navigation landmarks and descriptive button labels. Route transitions move focus to the page heading without interrupting in-page state updates.
