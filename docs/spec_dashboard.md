# Dashboard / Home Specification

## Target Page: Dashboard (`/`)

### 1. Functional Purpose

- **Primary goal:** Provide the central route to new Council and 1-on-1 sessions, the local Persona Library, Settings, and durable chat history.
- **Prerequisites:** The dashboard is always available. A configured provider is required only to send a new model request; users can still review locally stored sessions and personas without one.

### 2. Interactive Elements Inventory

1. Sidebar toggle
2. Browser-style back and forward controls
3. Settings link
4. Setup-required banner (conditional)
5. Start Council flow
6. Start 1-on-1 flow
7. Persona Library link
8. Recent sessions list

### 3. Detailed Component and Interaction Flows

#### 3.1 Sidebar Toggle

- **Type:** Button with an accessible name that reflects its current action (for example, `Open navigation`).
- **Behavior:** Opens or closes the global sidebar. The sidebar is the primary history navigation and displays durable `IndexedDB` sessions grouped by date.
- **Persistence:** Only the expanded/collapsed preference is stored in the namespaced key `framework-engine:ui:sidebar`; session data is never stored in `localStorage`.

#### 3.2 Back and Forward Controls

- **Type:** Buttons.
- **Behavior:** Use the application router's history APIs. Disabled controls must expose their disabled state and must not intercept the browser's native back/forward behavior.

#### 3.3 Settings Link

- **Type:** Link.
- **Behavior:** Routes to `/settings`, where users manage providers, preferences, and local-data actions.

#### 3.4 Setup-Required Banner

- **Trigger:** The user has not configured an enabled provider, or the last validation failed.
- **Content:** Explain that a provider is required to send model requests, not that the entire application is read-only. Provide a single clear action to `/settings` (or `/onboarding` before onboarding is complete).
- **Accessibility:** Use a non-disruptive status/alert pattern, do not rely on color alone, and keep the action keyboard reachable.

#### 3.5 Start Council

- **Behavior:** Opens the Council setup flow. After the user selects the required personas and creates a session, route to `/chat/council/[sessionId]`.
- **Provider state:** Do not block setup because a key is missing. Disable the send action in the chat with an explanation and a Settings link instead.

#### 3.6 Start 1-on-1

- **Behavior:** Opens the persona/model setup flow. After a session is created, route to `/chat/1-on-1/[sessionId]`.

#### 3.7 Persona Library Link

- **Behavior:** Routes to `/personas` for local persona creation, import, export, and management.

#### 3.8 Recent Sessions

- **Scope:** Show the most recent durable sessions (for example, the latest four) from `IndexedDB`; the sidebar contains the complete durable history.
- **Per item:** Display a generated/default title and a text mode label in addition to any icon.
- **Routing:** A 1-on-1 item routes to `/chat/1-on-1/[sessionId]`; a Council item routes to `/chat/council/[sessionId]`.
- **Incognito:** Incognito sessions never create durable session metadata, so they cannot appear here, in the sidebar, search, analytics, or exports.

### 4. Accessibility and Motion

- Meet WCAG 2.2 AA for contrast, target size, visible focus, and focus-not-obscured behavior.
- Use semantic navigation landmarks and descriptive link/button names. On route changes, move focus to the destination page heading without unexpectedly stealing focus during an in-page update.
- The mobile sidebar is a modal drawer: trap focus while open, close with `Escape`, restore focus to the toggle on close, and make the background inert.
- Respect `prefers-reduced-motion`; opening, closing, and loading states must remain understandable with motion removed.

### 5. Background Data Rules

- Fetch durable session records and persona records from `IndexedDB` only. Built-in personas may be loaded from versioned static application data.
- `localStorage` is reserved for namespaced API keys, lightweight preferences, onboarding state, and unsent drafts. It must not be used as a fallback chat store.
- The dashboard performs no model streaming and sends no dashboard data to a server.
