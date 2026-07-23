# Frontend Functional Specification: 1-on-1 Chat Mode

## 1. Routes & Functional Purpose

- **Routes:** Setup route is `/chat/1-on-1`. Saved session route is `/chat/1-on-1/[sessionId]`.
- **Primary Goal:** Facilitate a direct, back-and-forth conversation between the user and a single selected AI persona.
- **Preconditions:** Requires a selected persona and a configured API key for the corresponding provider and model. The UI discloses which provider receives the prompt before the first message.

## 2. Header & Global Navigation Controls

- **Global Navigation Bar:**
  - *Sidebar Toggle Button:* Opens or closes the global persistent sidebar.
  - *Back Button:* Navigates back to the previous view (e.g. Dashboard).
  - *Settings Button:* Transitions directly to `/settings`.
- **Active Persona & Model Indicator:** Displays active persona's avatar, name, and current model in the header. Clicking opens a menu to swap personas (via Unified Persona Selector) or configure model overrides.
- **Model Override Persistence:** Changing a model prompts the user to select:
  - *"Remember for this persona forever"* (saves model preference to local persona record).
  - *"Just this chat"* (applies model override to current session only).
  - Defaults to the Global Model set in Settings.
- **Header Session Actions:** Rename session, export chat history, and delete session.
- **Incognito Header Rule:** Incognito can only be toggled before sending the first message. Toggling after a saved conversation has started prompts the user to "Start New Incognito Session" or "Cancel".

## 3. Persona Selector Integration Flow

- Clicking the persona indicator opens the **Unified Persona Selector Modal** (`spec_persona_selector.md`).
- **Search & Filters:** Real-time search by name/description, plus filter toggles ("My Library", "Favorites"). Includes a prominent "Create New Persona" button.
- **Card Highlight & Action Menu:** Clicking a persona card highlights it in the grid, revealing action buttons (*Detail*, *Edit*, *Export*).
- **Confirmation:** Clicking "Start Chat" confirms selection, saves the active chat to history, and routes to a fresh session with the chosen persona.

## 4. Input Area, Attachments & Incognito Watermark

- **Incognito Ghost Watermark:** When Incognito is ON, the Chat Input area displays a persistent visual watermark (e.g. ghost icon or tinted border) providing clear confirmation at the point of action.
- **Attachment Button & Multimodal Validation:** Supports uploading text files (.txt, .md, .pdf) or images. If an image is attached but the chosen model lacks vision capabilities, the UI displays a validation error and blocks sending. Enforces file size limits before upload.
- **Input Disabled State:** Chat input and send controls are disabled if the required API key for the selected model is missing, displaying an explanatory tooltip.
- **Send / Stop Button Morphing:**
  - Submit button remains disabled until valid model and input exist.
  - While LLM generation is streaming, the Send button transforms into a **Stop** button (square stop icon). Clicking Stop aborts generation immediately and leaves a visible partial response state.

## 5. Message Rendering, Styling & Streaming Logic

- **Visual Identification:** WhatsApp/Telegram-style message header with Persona Avatar, Name, and subtle accent-color left border/tint on chat bubbles (avoids full bubble saturation for text readability).
- **Thinking Animation & Token Filtering:** Displays a subtle "Thinking" animation during network latency and generation. Automatically strips raw internal `<think>` reasoning tokens from reasoning models during streaming.
- **Dual Scroll Strategy:**
  - *Default:* Auto-scrolls chat log to bottom as SSE chunks stream in.
  - *User Override:* If user manually scrolls up away from the bottom, scroll position is preserved until user scrolls back down.

## 6. Editing, Regeneration & Transactional Branching

- **Edit Message:** Hovering a User Message reveals an Edit icon. Submitting an edit turns the bubble into a text area, truncating history from that point.
- **Regenerate Message:** Hovering an AI Message reveals a Regenerate icon. Clicking deletes that AI message and requests a fresh response from the same point in history.
- **Transactional Branching:** Original history remains intact until the new replacement branch commits successfully. Summaries, token usage, and attachments from discarded branches are transactionally reconciled in `IndexedDB`.

## 7. Incognito Data Isolation

Incognito sessions are strictly memory-only: no messages, summaries, token usage, search index entries, recent-persona records, or export metadata are persisted to `IndexedDB` or `localStorage`.

## 8. Accessibility & Screen Reader Guidelines

- **Screen Reader Quiet Streaming:** Screen readers announce the completed assistant response once upon finish rather than announcing every streamed SSE chunk.
- **Keyboard Accessibility:** All header controls, persona selection, attachment upload, send/stop buttons, edit, and regenerate actions are fully operable via keyboard with visible focus rings.
