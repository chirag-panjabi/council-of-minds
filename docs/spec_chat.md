# Frontend Functional Specification: Unified Chat Interface

## 1. Overview & UI Scaling Paradigm

- **Primary Goal:** Provide a single, reusable chat interface (Header, Message History, Input Area) that scales seamlessly from single-persona 1-on-1 conversations to multi-persona Council debates.
- **Council Mode Scaling:** When more than one AI persona is active, the shared layout conditionally renders the **Persistent Right-Hand Panel** (`spec_council.md`) and the **Moderator Strip** (`spec_council.md`), maintaining a single unified codebase for all chat experiences.

## 2. Shared Header Bar

- **Editable Title:** Inline editable title for saved non-Incognito sessions.
- **Participant Indicators & Model Overrides:** Displays single persona avatar (1-on-1) or stacked-avatar cluster (Council). Clicking an avatar opens a menu to swap personas or configure **Provider & Model Overrides**. Prompts user to select *"Remember for this persona forever"* or *"Just this chat"*.
- **Incognito Toggle & Watermark:** Incognito toggle in header. When active, a persistent ghost watermark/tinted border renders in the Chat Input area. Incognito can only be toggled before sending the first message.
- **Export & Copy Actions:** Export transcript to Markdown/JSON (with a toggle to include/exclude system events) or copy raw text to clipboard.

## 3. Message History & Bubble Styling

- **Layout Differentiation:** User messages are right-aligned; AI messages are left-aligned.
- **Visual Persona Identification:** WhatsApp/Telegram-style message header featuring Persona Avatar, Name, and subtle accent-color left border/tint on chat bubbles.
- **Reasoning Models (`<think>` Token Filtering):** For reasoning models (e.g. DeepSeek-R1), raw internal `<think>...</think>` tokens are stripped from user-facing text and rendered inside an expandable **"Thought Process"** UI accordion with a pulsing brain icon.
- **System & Moderation Events:** Distinct italicized blockquote presentation (e.g., *"Agent added to Council"*, *"Model override applied"*).

## 4. Input Area & Staging Behavior

- **Auto-Expanding Textarea:** Textarea expands dynamically on input up to a max-height limit.
- **Keyboard Shortcuts:** Pressing `Enter` (without modifier keys) submits the prompt. Pressing `Shift+Enter` inserts a newline.
- **Attachment Staging:** Supports uploading files/images into a removable staging bar. Performs provider capability pre-flight checks before submission (e.g., verifies vision model support for images).
- **Send / Stop Morphing Button:** Submit button morphs into a square **Stop** button while generation is active. Clicking Stop aborts the active stream immediately.

## 5. Council Additions & Moderator Strip

When Council Mode is active:
- **Persistent Right Panel:** Hosts Roster display, reorderable Speaking Queue, Auto-Pilot with mandatory Round Limits, Response Length control, and Synthesizer live status (`spec_council.md` §3).
- **Moderator Strip (Input Area):**
  - *`@` Mentioning:* Typing `@` in the textarea anchors a popup menu to tag specific Council members.
  - *Request Persona Reply Button:* Forces a selected persona to respond next without typing a new prompt.
  - *Stepping Controls:* Quick-action "Continue" and "Synthesize" buttons.

## 6. Message Lifecycle Data Model & Transactional Safety

- **Message Lifecycle States:** Every message records `id`, `role` (`user` | `assistant` | `system`), `timestamp`, `state` (`pending` | `streaming` | `complete` | `failed` | `cancelled`), `personaSnapshot`, and optional `attachmentReferences`.
- **Transactional Branch Editing:** Editing a user message or regenerating an AI message truncates history from that point. Original history remains intact until the new replacement branch commits successfully. Summaries, token counts, and attachments are reconciled in `IndexedDB`.

## 7. Accessibility & Screen Reader Guidelines

- **Screen Reader Quiet Streaming Rule:** Screen readers announce final response completion once upon stream finish, avoiding repetitive announcements per SSE chunk.
- **WCAG Compliance:** All actions feature programmatic names, visible focus indicators, and strict keyboard operation. Modals trap focus and respect `prefers-reduced-motion`.
