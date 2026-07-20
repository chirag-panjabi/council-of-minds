# Global Sidebar Specification

## Overview

The sidebar is the primary navigation component. It is a fixed-width collapsible navigation region on desktop and a modal drawer on mobile. It provides access to new chats, durable local history, personas, and global settings.

## Core Interface Components

### 1. Top Section: Primary Actions

- **App logo/title:** Routes to the Dashboard (`/`).
- **New Chat:** Opens a menu to start either a 1-on-1 or Council setup flow. A created session uses `/chat/1-on-1/[sessionId]` or `/chat/council/[sessionId]`.
- **Persona Library:** Routes to `/personas`.

### 2. Middle Section: Durable Chat History

- **Source:** Read session metadata from `IndexedDB`; never use `localStorage` as a chat-history fallback.
- **Grouping:** Group durable sessions by local date: Today, Yesterday, Previous 7 Days, and Older.
- **Chat item:** Include a text title and mode label, with an optional supporting icon. Route each item using its mode-specific canonical session URL.
- **Rename:** Use an inline, labelled text field. Preserve the old title if validation or storage fails and announce the result.
- **Delete:** Open a clearly labelled confirmation dialog. On confirmation, permanently delete the selected session, messages, and message-owned attachment blobs from `IndexedDB`; there is no trash bin.
- **Incognito:** Never show or reserve an entry for an Incognito session. Incognito sessions have no durable history metadata.

### 3. Bottom Section: Utility and Information

- **Settings:** Routes to `/settings`.
- **GitHub:** Links to the project repository without treating it as a hosted marketplace.
- **Theme toggle:** Changes the namespaced appearance preference. Its accessible name must state the resulting theme action.

## State, Provider, and Accessibility Behavior

- **Persistence:** Save only the open/collapsed preference in `framework-engine:ui:sidebar`. API keys, preferences, onboarding state, and drafts use their own `framework-engine:` namespaced keys; durable app data belongs in `IndexedDB`.
- **No-key state:** Do not disable existing history. Users can open and read durable chats, but any composer that cannot send must explain that a provider needs configuration and link to Settings.
- **Desktop navigation:** Use a labelled `<nav>` landmark, semantic lists for history groups, and visible WCAG 2.2 AA-compliant focus indicators.
- **Mobile drawer:** Give the drawer an accessible name, trap focus while open, make the rest of the page inert, support `Escape`, and restore focus to the opener when closed.
- **Actions:** Hover-only controls are insufficient. Rename and delete must be keyboard reachable, have descriptive labels, preserve a minimum 24 by 24 CSS-pixel target, and expose errors in text as well as color.
- **Motion:** Respect `prefers-reduced-motion`; collapse and drawer transitions may be removed without losing state feedback.
