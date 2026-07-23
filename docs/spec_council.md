# Frontend Functional Specification: Council Mode

## 1. Routes, Purpose & Control Surface Architecture

- **Routes:** Setup route is `/chat/council`. Saved session route is `/chat/council/[sessionId]`.
- **Primary Goal:** Facilitate an interactive, multi-agent debate where the user acts as a moderator, controlling the flow of conversation between 2 to N distinct AI personas, culminating in a synthesis phase.
- **Control Surface Architecture:** Council's control surface—roster, speaking queue, turn state, Auto-Pilot, round limits, response length, and synthesizer live status—lives in a **persistent right-hand panel**, visible for the full lifetime of the session. This ensures that a moderated proceeding keeps its structure visible at all times rather than hidden behind gear modals or dropdowns.

## 2. Roster Setup & Model Assignment (Pre-Debate State)

- **Launch Source Choice:** Before selecting personas, the user can choose to start with a blank roster or load a saved Group (`spec_persona_groups.md`), which pre-fills the active personas list, speaking order, and default Synthesizer slot.
- **Model Assignment Toggle:**
  - *Unified Model:* All personas run on the same LLM (selected via Provider and Model dropdowns).
  - *Individual Model Overrides:* Each persona in the active roster can use a different model. Changing a model prompts the user to select "Remember for this persona forever" or "Just this chat".
- **Active Personas List & Soft Warning:** Displays 2-N selected debaters. Selecting more than 4 personas displays a subtle warning text regarding high token costs and latency, but does not block submission.
- **Persona Snapshots:** Each persona is snapshot at session join time so subsequent edits to persona definitions do not alter historical debate records.
- **Synthesizer Persona Selector:** Dedicated slot/card for the designated "Judge" persona, distinct from active debaters. Pre-filled if loaded from a Group with a default Synthesizer.
- **Disabled State Tooltips:** If fewer than 2 personas are selected or required API keys are missing, the "Address Council" button is disabled; hovering or clicking displays targeted tooltips detailing missing prerequisites.

## 3. Persistent Right Panel (Active Debate State)

Replaces Roster Setup once the debate starts and remains visible for the session lifetime:

- **Roster Display:** Avatars, names, and current-speaker highlight indicator.
- **Speaking Order Queue:** Reorderable, drag-and-drop list of active personas. Pre-filled from Group default order if launched from a Group.
- **Auto-Pilot Toggle & Round Limit Control:**
  - Switches between Manual Stepping (default) and continuous looping.
  - **Strict Constraint:** Auto-Pilot **cannot be enabled without setting a finite round limit** (e.g. 1 to 20 rounds). There is no unlimited option.
  - Surfacing an inline notice ("Auto-Pilot stopped after N rounds") upon completion before reverting to Manual Stepping.
- **Response Length Control:** Granular word-limit input visible directly in the panel.
- **Synthesizer Slot:** Shows live status ("Not yet called" / "Closed debate at [timestamp]").

## 4. Moderator Strip & Chat Interface (Active Debate State)

- **Identification & Accent Styling:** WhatsApp/Telegram-style message header with Persona Avatar, Name, and subtle accent-color left border/tint for readability.
- **`@` Mentioning:** Typing `@` in the chat input opens an instant popup menu to tag a specific persona for a direct prompt response.
- **Request Persona Reply:** Dropdown button to force a specific persona to generate the next response without a new prompt.
- **Manual Stepping Controls:**
  - **Continue:** Triggers the next persona in the Speaking Order Queue.
  - **Synthesize:** Triggers the Synthesizer persona to evaluate context and conclude the debate.
  - **User Interjection:** Text input remains active during pause so the user can send moderating comments.
- **Stop Button & Thinking Token Filter:**
  - Replaces strip controls with a **Stop** button during active streaming.
  - Automatically strips raw internal `<think>` reasoning tokens from user-facing streaming displays.
- **New Council Session Button:** Archives the current session and clears the board to Roster Setup.

## 5. Execution State Machine

1. **Setup:** Select roster, model choices, round limit, and optional synthesizer.
2. **Ready:** Central prompt entered; generation has not begun.
3. **Generating:** Exactly one persona stream active. Sequential execution: Persona A completes before Persona B starts.
4. **Paused:** User may click Continue, Request Reply, send interjection, Synthesize, or End Session.
5. **Completed:** Synthesis finished or user ended the session.
6. **Failed or Cancelled:** Partial state preserved with safe recovery options.

## 6. Synthesis Phase

Clicking **Synthesize** sends the full approved conversation context to the designated Synthesizer persona (e.g., "Judge"). The synthesizer generates a final balanced summary, marks the debate complete, and updates the panel status.

## 7. Context, Memory & Rolling Summarization

- **Two-Axis Memory:** Raw message retention window combined with background summarization.
- **Rolling Context Summarization:** As debates exceed context thresholds, a background model (e.g., `gpt-4o-mini`, `Gemini Flash`) summarizes older turns. System prompts receive: Original Dilemma + Memory Block + 3-4 Recent Raw Messages.
- Summaries are isolated as untrusted conversation context. Summarization failures fall back gracefully to raw message history.

## 8. Incognito, Attachments & Accessibility

- **Incognito Mode:** Toggleable before the first prompt. Displays a persistent ghost watermark/tint on chat input. Incognito sessions are memory-only: no messages, summaries, token usage, search index entries, or session metadata are persisted to `IndexedDB`.
- **Attachment Evaluation Matrix:** File attachments are evaluated against every active persona/provider. If any recipient lacks vision/multimodal support, the UI blocks submission and presents explicit options.
- **Accessibility Guarantee:** Roster, speaking queue, turn controls, and moderator strip are fully keyboard accessible with visible focus rings.
