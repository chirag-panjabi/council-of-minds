# Global Sidebar Specification

## 1. Overview & Architectural Role

The Sidebar is the **primary chat-list-and-launcher surface** of the application (visible on the left side of the screen, fixed-width collapsible on desktop, modal drawer on mobile). Following a messaging-app launcher paradigm (Telegram/WhatsApp style), the Sidebar prioritizes quick creation and resumption of conversations over static navigation.

Out-of-scope for the Sidebar:
- Full persona management stays on the dedicated Persona Library page (`/personas`).
- App settings stay on the dedicated Settings page (`/settings`).

## 2. Core Interface Components

### 2.1. Top Section: Primary Actions
- **App Logo / Title:** Branding. Clicking navigates to the Dashboard (`/`).
- **New Chat Button:** Prominent button to launch a fresh chat. Triggers the Unified Persona Selector (`spec_persona_selector.md`). Single-select starts 1-on-1 mode; multi-select routes to Council setup.
- **Personas Shortcut:** Routes to the full Persona Library (`/personas`).

### 2.2. Groups Section (Launcher Surface)
- **Placement:** Immediately below Top Section, positioned above Recent Conversations. Groups are launchers, not history items.
- **Group List Item Display:** Renders a stacked-avatar cluster (composited from member avatars, capped at 4 visible + "+N" overflow badge) alongside the Group's name.
- **Tap Action:** Opens Council Setup (`/chat/council`) with the Group's saved roster and speaking order pre-filled.
- **Create New Group Action:** Compact action at top of section launching the Group Creator modal (`spec_persona_groups.md`).
- **Overflow & Empty State:** Scrolls independently of Recent Conversations below it. If more Groups exist than visible space allows, a "See all groups" link routes to the Dashboard Groups Overview Grid (`spec_dashboard.md`). If no Groups exist, collapses to a compact "Create your first group" prompt.

### 2.3. Middle Section: Recent Conversations (History)
- **Source:** Reads metadata strictly from `IndexedDB` (no `localStorage` fallback).
- **Grouping:** Grouped by local date: *Today*, *Yesterday*, *Previous 7 Days*, *Older*.
- **Visual Chat Item Display (Messaging-List Treatment):**
  - *1-on-1 Sessions:* Display single persona avatar, persona name, and first-prompt title.
  - *Council Sessions:* Display stacked-avatar cluster of participating personas, session title, and (if launched from a saved Group) the launching Group's name as a secondary line (e.g., "Dev Council, 3 weeks ago").
- **Hover / Long-Press Actions:**
  - *Rename:* Inline text field. Preserves old title if validation fails.
  - *Delete:* Triggers confirmation dialog. On confirmation, permanently deletes the session, messages, and **message-owned attachment blobs** from `IndexedDB` (no trash bin).
- **Incognito Isolation:** Incognito sessions never create or reserve an entry in the sidebar.

### 2.4. Bottom Section: Utility and Links
- **Settings:** Routes to `/settings`.
- **GitHub Repository:** Direct link to project repository.
- **Theme Toggle:** Switch between Light and Dark mode. Accessible name states resulting action.

## 3. Scrolling, State & Accessibility Behavior

- **Independent Scroll Viewports:** The Groups Section and Recent Conversations list scroll independently so long history records never push launchers out of view.
- **Persistence:** Sidebar expanded/collapsed state is saved in `localStorage`.
- **No-Key State:** Existing history items remain readable. If no API key is configured, launching new chats or sending messages is disabled, showing an inline prompt linking to Settings.
- **Desktop Navigation:** Uses semantic `<nav>` landmark, list structures, and visible WCAG 2.2 AA compliant focus indicators.
- **Mobile Drawer:** Accessible drawer name, traps focus while open, makes background page inert, handles `Escape` key, and restores focus to opener on close.
- **Action Targets & Motion:** Rename/delete controls are keyboard-reachable with minimum 24x24px CSS touch targets. Respects `prefers-reduced-motion`.
