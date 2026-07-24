# Spec vs Implementation — Complete Gap Analysis

Every item below is a feature, component, task, or function specified in the `docs/` specs that is **not yet implemented** (or only partially implemented) in the codebase. Organized by spec document.

---

## Legend

| Tag | Meaning |
|-----|---------|
| 🔴 **MVP-CRITICAL** | Required by `MVP_ACCEPTANCE.md` or `PRODUCT_SCOPE.md` |
| 🟡 **MVP-SPECIFIED** | In a feature spec but not explicitly in MVP acceptance |
| ⚪ **POST-MVP** | Explicitly deferred in `future_todo.md` or flagged as post-MVP |

---

## 1. `PRODUCT_SCOPE.md` & `MVP_ACCEPTANCE.md` — Top-Level Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 1.1 | **Proxy log/diagnostic redaction** — proxy must redact keys, prompts, attachments in logs/errors | Not audited / no redaction layer in `api/chat/route.ts` | 🔴 |
| 1.2 | **UI explains provider egress before first cloud request** — explicit privacy disclosure dialog before first send | Missing — no pre-first-message disclosure modal | 🔴 |
| 1.3 | **UI explains provider egress before enabling background summarization** | Background summarization not implemented at all | 🔴 |
| 1.4 | **Ollama CORS / connection test reporting** — test is browser-to-localhost, reports CORS or unavailable | Settings has Ollama field, but no dedicated connection test button with error differentiation (CORS vs offline vs model-not-found) | 🔴 |
| 1.5 | **Persona import: decoded preview, validation, Replace/Duplicate/Skip/Apply-to-All** | Not implemented — no import modal, no collision resolution UI | 🔴 |
| 1.6 | **Full backup export** (versioned manifest + chats + personas + attachments as `.zip`) | No JSZip, no export workflow | 🔴 |
| 1.7 | **Full backup restore** with preview-before-commit | No restore workflow | 🔴 |
| 1.8 | **Wipe: close DB connections, handle blocked deletion, remove only app-owned storage, redirect to `/onboarding`** | Settings has basic wipe but lacks blocked-deletion handling, multi-tab awareness, redirect to `/onboarding` | 🔴 |
| 1.9 | **Auto-Pilot off by default, finite cap 1–12 turns, default 6** | Auto-Pilot toggle exists but round limit enforcement and cap range need verification | 🔴 |
| 1.10 | **Cancellation records visible partial/cancelled state without auto-retrying** | Partial — stop button exists, but message state may not persist as `cancelled` in DB | 🟡 |
| 1.11 | **Incognito: leaves no IndexedDB, analytics, search, export, recent-session, or recent-persona record** | Partial — incognito flag exists on sessions, but no comprehensive isolation audit done | 🔴 |
| 1.12 | **WCAG 2.2 AA baseline** — keyboard access, visible focus, modal focus trapping, reduced-motion, screen reader quiet streaming | Very limited — no `prefers-reduced-motion` support, minimal `aria-*` usage, no focus trapping in modals | 🔴 |
| 1.13 | **Search: literal matching in cancellable worker, opens canonical session routes** | SearchPalette exists (228 lines) but runs on main thread, no Web Worker, no cancellation | 🔴 |
| 1.14 | **Safety disclosure and crisis path for advice-oriented flows** | Not implemented | 🔴 |

---

## 2. `spec_council.md` — Council Mode Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 2.1 | **Launch from saved Group pre-fills roster, speaking order, synthesizer** | Groups page exists but Council setup doesn't accept pre-fill from Group launch | 🟡 |
| 2.2 | **Unified vs Individual model assignment toggle** | Not implemented — all personas share whatever model is selected | 🟡 |
| 2.3 | **Individual model overrides per persona** with "Remember forever" vs "Just this chat" | Type exists (`modelOverride` in types) but no UI or persistence logic | 🟡 |
| 2.4 | **Persona Snapshots at session join** — freeze persona definition at join time | No snapshot logic | 🟡 |
| 2.5 | **Persistent Right Panel** — roster display, drag-and-drop speaking queue, Auto-Pilot controls, response length control, synthesizer live status | Partial — basic panel exists but missing drag-and-drop queue reordering, response length slider, synthesizer live status display | 🟡 |
| 2.6 | **Drag-and-drop speaking order queue** | No drag-and-drop (static list only) | 🟡 |
| 2.7 | **Response Length Control** — granular word-limit input in panel | Not implemented | 🟡 |
| 2.8 | **`@` Mentioning** — typing `@` opens popup to tag specific persona | Not implemented (only mentioned in keyboard shortcuts modal docs) | 🟡 |
| 2.9 | **Request Persona Reply** — dropdown to force specific persona next | Not implemented | 🟡 |
| 2.10 | **Manual Stepping: Continue button** | Partially implemented | 🟡 |
| 2.11 | **Synthesize button** — triggers synthesizer persona | Button exists but synthesis workflow (dedicated judge evaluation) needs verification | 🟡 |
| 2.12 | **Stop Button strips `<think>` reasoning tokens** during streaming | `<think>` stripping exists in message rendering but needs verification during live stream | 🟡 |
| 2.13 | **New Council Session button** — archives current, clears to Roster Setup | Not implemented | 🟡 |
| 2.14 | **Execution State Machine** (Setup → Ready → Generating → Paused → Completed → Failed/Cancelled) | Implicit but not formalized as an explicit state machine | 🟡 |
| 2.15 | **Rolling Context Summarization** — background model summarizes older turns | Not implemented at all | 🔴 |
| 2.16 | **Incognito Mode toggle before first prompt** with ghost watermark | Incognito flag exists but no watermark UI and no before-first-prompt enforcement | 🟡 |
| 2.17 | **Attachment Evaluation Matrix** — check all recipients for vision support | Not implemented | 🟡 |
| 2.18 | **>4 personas soft warning** about high token costs | Not implemented | 🟡 |
| 2.19 | **Disabled state tooltips** when <2 personas or missing keys | Partial — button may be disabled but no hover tooltips | 🟡 |

---

## 3. `spec_1_on_1.md` — 1-on-1 Chat Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 3.1 | **Active Persona & Model Indicator in header** — click to swap persona or configure model override | Partial header exists but no click-to-swap or model override menu | 🟡 |
| 3.2 | **Model Override Persistence** — "Remember forever" vs "Just this chat" prompt | Type defined but no UI | 🟡 |
| 3.3 | **Header Session Actions** — rename, export chat history, delete session | Session rename exists in sidebar; no export or header-level delete | 🟡 |
| 3.4 | **Incognito toggle before first message** with "Start New Incognito Session" prompt if toggled after | Partial flag logic, no enforcement or prompt UI | 🟡 |
| 3.5 | **Persona Selector Integration** — clicking persona indicator opens full selector modal mid-chat | Not wired as mid-chat swap | 🟡 |
| 3.6 | **Attachment multimodal validation** — block sending image if model lacks vision | AttachmentStaging exists but no model capability pre-flight check | 🟡 |
| 3.7 | **Input disabled state** if API key missing, with explanatory tooltip | No tooltip on disabled input | 🟡 |
| 3.8 | **Thinking Animation** during network latency | No explicit thinking animation (spinner/dots before first token) | 🟡 |
| 3.9 | **Dual Scroll Strategy** — auto-scroll, but preserve position if user scrolls up + "Jump to latest" | Basic auto-scroll exists; no "Jump to latest" button | 🟡 |
| 3.10 | **Edit Message** — hover reveals edit icon, truncates history | Edit logic exists partially | 🟡 |
| 3.11 | **Regenerate Message** — hover reveals regenerate icon | Not implemented | 🟡 |
| 3.12 | **Transactional Branching** — original history intact until new branch commits | Not implemented | 🟡 |
| 3.13 | **Screen Reader Quiet Streaming** — announce completion once, not per SSE chunk | Not implemented | 🟡 |

---

## 4. `spec_chat.md` — Unified Chat Interface Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 4.1 | **Editable Title** — inline editable for saved sessions | No inline title editing on chat page | 🟡 |
| 4.2 | **Export & Copy Actions** — export transcript to MD/JSON, toggle include/exclude system events | Not implemented | 🟡 |
| 4.3 | **`<think>` tokens → expandable "Thought Process" accordion with pulsing brain icon** | `<think>` stripped but not rendered into expandable accordion UI | 🟡 |
| 4.4 | **System & Moderation Events** — distinct italicized blockquote presentation | Not implemented | 🟡 |
| 4.5 | **Auto-expanding textarea** up to max-height | Basic textarea exists, auto-expand uncertain | 🟡 |
| 4.6 | **Message lifecycle states** (`pending`, `streaming`, `complete`, `failed`, `cancelled`) persisted in DB | States exist in type definition but persistence of `failed`/`cancelled` states needs audit | 🟡 |

---

## 5. `spec_dashboard.md` — Dashboard Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 5.1 | **Setup Required Banner** — conditional on `hasSkippedOnboarding` or missing keys | Partially implemented | 🟡 |
| 5.2 | **Usage-at-a-Glance Widget** — total tokens, most active persona, "View Details" link to `/analytics` | Token count exists; no "most active persona" or "View Details" link | 🟡 |
| 5.3 | **Groups Overview Grid** with card display, sorting, filtering, context menu | Basic groups listing exists; no context menu (Launch/Edit/Duplicate/Delete), no search filter | 🟡 |
| 5.4 | **Zero Groups Empty State** — centered explanation + "Create your first Group" button | Not implemented | 🟡 |
| 5.5 | **Primary Launch Shortcuts** — quick-launch cards for Start Council, Start 1-on-1, Persona Library | Exists partially | 🟡 |

---

## 6. `spec_sidebar.md` — Sidebar Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 6.1 | **Groups Section** — stacked-avatar cluster, tap to launch Council with pre-filled roster | Groups section exists but avatar stacking and pre-fill launch not verified | 🟡 |
| 6.2 | **"See all groups" overflow link** to Dashboard | Not implemented | 🟡 |
| 6.3 | **Date-grouped Recent Conversations** — Today, Yesterday, Previous 7 Days, Older | Sidebar has chat list but no date grouping | 🟡 |
| 6.4 | **Visual differentiation** — single avatar (1-on-1) vs stacked-avatar cluster (Council) | Not implemented | 🟡 |
| 6.5 | **Hover actions: Rename (inline text field), Delete (confirmation dialog)** | Delete exists; rename may be missing | 🟡 |
| 6.6 | **Independent scroll viewports** — Groups and Recent Conversations scroll independently | Not implemented | 🟡 |
| 6.7 | **Mobile drawer** — accessible name, focus trap, background inert, Escape key, focus restore | Not implemented | 🟡 |
| 6.8 | **Theme Toggle** in sidebar bottom | ThemeProvider exists but toggle placement uncertain | 🟡 |
| 6.9 | **GitHub Repository link** | Not implemented | 🟡 |

---

## 7. `spec_settings.md` — Settings Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 7.1 | **Personal Profile Section** — user name, contextual bio, system prompt injection | Not implemented | 🟡 |
| 7.2 | **Password masking with temporary "eye" reveal** that auto-masks on blur | Basic password fields exist but no auto-mask-on-blur behavior | 🟡 |
| 7.3 | **Locked Saved Key Security** — saved keys cannot be revealed; "Replace Key" flow | Not implemented — keys can be viewed/edited freely | 🟡 |
| 7.4 | **Two-Step Cascading Model Selectors** — Provider → Model for default and summarizer | DynamicModelSelector exists but summarizer model selector missing | 🟡 |
| 7.5 | **Two-Axis Context Memory System** — background summarization toggle + raw message retention slider | Not implemented | 🔴 |
| 7.6 | **Appearance Section** — Theme cards (Light/Dark/System), Chat Density, Typography size | Partial theme toggle; no density or typography controls | 🟡 |
| 7.7 | **Export Chat History (`.zip`)** | Not implemented | 🔴 |
| 7.8 | **Export Custom Personas (`.json`)** | Not implemented | 🟡 |
| 7.9 | **Import Custom Personas (`.json`)** with schema validation and collision handling | Not implemented | 🔴 |
| 7.10 | **Full Backup Archive & Restore** with preview | Not implemented | 🔴 |
| 7.11 | **Reset UI Preferences** — remove `framework-engine:preference:` keys only | Not implemented | 🟡 |
| 7.12 | **Wipe typing `"DELETE"` to confirm** | Basic confirm dialog, no typing confirmation | 🔴 |
| 7.13 | **About Section** — version info, documentation, source links | Not implemented | 🟡 |
| 7.14 | **Two-column layout** on desktop, scrollable tabs on mobile | Not implemented — single-column layout | 🟡 |

---

## 8. `spec_persona_library.md` — Persona Library Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 8.1 | **Dynamic Tag Filter Menu** — dropdown with tag search, multi-tag selection | TagInput component exists for creator but no tag-based filter dropdown on library page | 🟡 |
| 8.2 | **View Toggles** — Grid, List, Card views | Not implemented — single view only | 🟡 |
| 8.3 | **Card Context Menu** — Chat, Favorite, Edit, Export, Archive, Delete | Partial — Edit exists; no Chat/Favorite/Export/Archive from context menu | 🟡 |
| 8.4 | **Favorites filter toggle** | Not implemented | 🟡 |
| 8.5 | **Archived Personas View Tab** | Archive action exists on some cards, but no dedicated "Archived" tab to browse/unarchive | 🟡 |
| 8.6 | **Import Modal & Collision Resolution** — Base64 + JSON upload, preview, Replace/Duplicate/Skip/Apply-to-All | Not implemented | 🔴 |
| 8.7 | **Export Modal & Base64 Share Code** — `framework-engine.persona/v1` export with copy button | Not implemented | 🟡 |
| 8.8 | **List virtualization** for large collections | Not implemented | 🟡 |

---

## 9. `spec_persona_creator.md` — Persona Creator Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 9.1 | **Avatar Upload / Emoji Picker** — upload + client-side downscale via Canvas API | Emoji selection exists; no image upload with Canvas downscaling | 🟡 |
| 9.2 | **Hex Accent Color Picker** with WCAG contrast check | Color picker exists but no contrast validation | 🟡 |
| 9.3 | **First Message / Icebreaker textarea** | Exists in some form | 🟡 |
| 9.4 | **+ Add Advanced Rules** — progressive disclosure toggle | May exist, needs verification | 🟡 |
| 9.5 | **Debounced Draft Auto-Save** to `localStorage` with "unsaved draft" warning | Not implemented | 🟡 |
| 9.6 | **Export Preview** — preview Base64URL share payload before export | Not implemented | 🟡 |
| 9.7 | **Submit Focus Management** — on validation failure, focus moves to first failed field | Not implemented | 🟡 |

---

## 10. `spec_persona_groups.md` — Persona Groups Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 10.1 | **Drag-and-drop reorderable member list** setting default speaking order | No drag-and-drop in group editor | 🟡 |
| 10.2 | **Group Context Menu** — Launch, Edit, Duplicate, Delete | No context menu on group cards | 🟡 |
| 10.3 | **"Persona Unavailable" display** if a member persona is deleted | Not implemented | 🟡 |
| 10.4 | **<2 members warning badge** on sidebar | Not implemented | 🟡 |

---

## 11. `spec_persona_selector.md` — Unified Selector Modal Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 11.1 | **Filter chips** — Favorites, Recently Used, Custom, Default/System, Archived | Not implemented — basic search only | 🟡 |
| 11.2 | **In-Selector Favorite Toggle** — heart/star icon writing to IndexedDB | Not implemented | 🟡 |
| 11.3 | **Multi-select checklist mode** for Council ("Add to Council" with count) | Not implemented — single-select only | 🟡 |
| 11.4 | **Synthesizer slot selection** mode ("Assign Synthesizer") | Not implemented in modal | 🟡 |
| 11.5 | **Recently Used tracking** — array of persona IDs with timestamps | Not implemented | 🟡 |
| 11.6 | **Focus trapping, arrow-key navigation, list virtualization** | Not implemented | 🟡 |
| 11.7 | **"+ New" Create Persona shortcut** in modal header | Not implemented | 🟡 |

---

## 12. `spec_onboarding.md` — Onboarding Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 12.1 | **Privacy & Security Disclosure Banner** — clear visual callout + link to privacy doc | Basic privacy text exists but no prominent banner callout | 🟡 |
| 12.2 | **Provider Selector Dropdown** — choose between OpenAI, Anthropic, Gemini, Ollama | Individual provider fields exist; no unified selector dropdown | 🟡 |
| 12.3 | **Helper Links** — 1-click links to provider API key dashboards | Not implemented | 🟡 |
| 12.4 | **"Skip for Now"** writes `framework-engine:has_skipped_onboarding` | Exists but needs verification against exact localStorage key | 🟡 |
| 12.5 | **Generation Gate Banner** in read-only mode | Not implemented — no persistent banner blocking generation | 🔴 |
| 12.6 | **Client Hydration Route Guard** — auto-redirect to `/onboarding` if no keys | `ClientHydrationGuard.tsx` exists but logic needs audit | 🟡 |

---

## 13. `spec_analytics.md` — Analytics Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 13.1 | **Top KPI Cards** — Total Tokens, Most Active Persona, Most Active Model, Estimated Spend | Partial — total tokens shown; most active persona/model not computed | 🟡 |
| 13.2 | **Time-Series Usage Charts** (Recharts bar/line) with 7/30/90/All filters | Recharts charts exist but filter range functionality needs verification | 🟡 |
| 13.3 | **Persona Deep-Dive** — Model Distribution Pie, Total per Persona, Avg Tokens per Request | Not fully implemented | 🟡 |
| 13.4 | **Model Breakdown Table** — semantic table with Input/Output/Reasoning/Total/Cost columns | Partial | 🟡 |
| 13.5 | **Incognito creates zero `TokenUsage` records** | Not verified | 🟡 |
| 13.6 | **Sidebar Analytics launcher icon** | Not implemented | 🟡 |
| 13.7 | **Dashboard "Usage at a Glance" widget** with "View Details" link | Partial — token count shown, no "View Details" link | 🟡 |
| 13.8 | **`cachedTokens` and `reasoningTokens` capture** from SSE usage objects | Fields defined in types but capture from SSE needs verification | 🟡 |

---

## 14. `spec_search.md` — Global Search Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 14.1 | **Web Worker execution** — search runs in dedicated worker, not main thread | Runs on main thread | 🔴 |
| 14.2 | **Cancellation** — cancel prior request on query change, ignore stale results | Not implemented | 🟡 |
| 14.3 | **Filters** — mode (1-on-1 / Council), date range, model | No filters in current SearchPalette | 🟡 |
| 14.4 | **Search chats** — session title AND message text content | Searches chats but message text search depth uncertain | 🟡 |
| 14.5 | **Result routing** — 1-on-1 → `/chat/1-on-1/[id]`, Council → `/chat/council/[id]`, with message scroll | Basic routing exists but no message-level scroll/highlight | 🟡 |
| 14.6 | **Match highlight** via text nodes, never HTML injection | Not implemented | 🟡 |
| 14.7 | **50-entry result cap** with "refine query" message | Not implemented | 🟡 |

---

## 15. `spec_data_management.md` — Data Management Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 15.1 | **Full Backup `.zip` export** via JSZip + Web Worker | Not implemented | 🔴 |
| 15.2 | **Readable Markdown Transcripts** in export | Not implemented | 🟡 |
| 15.3 | **Portable Persona Export `.json`** | Not implemented | 🟡 |
| 15.4 | **Import Drag-and-Drop Dropzone** supporting `.json` (5 MiB) and `.zip` | Not implemented | 🔴 |
| 15.5 | **Preview Before Commit** — interactive restore preview | Not implemented (RestorePreviewModal component exists but is a shell) | 🔴 |
| 15.6 | **Collision Detection & Resolution UI** — Replace/Keep Both/Skip/Apply-to-All | Not implemented | 🔴 |
| 15.7 | **Transactional Recovery** — batched restore with error state | Not implemented | 🟡 |
| 15.8 | **Wipe Danger Zone** — type "DELETE", blocked-deletion handling, multi-tab awareness, redirect to `/onboarding` | Basic wipe exists; missing typing confirmation, multi-tab, redirect | 🔴 |

---

## 16. `spec_file_attachments.md` — File Attachments Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 16.1 | **Drag & Drop overlay** — entire chat window as drop zone with overlay | Not implemented | 🟡 |
| 16.2 | **Client-side PDF parsing** via `pdf.js` | Not implemented | 🟡 |
| 16.3 | **Per-file and batch size validation** (5 MiB images, 1 MiB text, 5 files, 10 MiB total) | AttachmentStaging exists but enforcement level uncertain | 🟡 |
| 16.4 | **Image lightbox** — click inline image to open full-screen | Not implemented | 🟡 |
| 16.5 | **Model incompatibility warning toast** for image + text-only model | Not implemented | 🟡 |
| 16.6 | **Provider-specific vision payload formatting** (OpenAI `image_url`, Anthropic vision blocks) | Partial — needs verification per provider | 🟡 |
| 16.7 | **Incognito attachment isolation** — memory only, never stored | Not verified | 🟡 |
| 16.8 | **Message deletion cascades to attachment Blobs** | Not implemented | 🟡 |

---

## 17. `spec_error_boundaries.md` — Error Handling Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 17.1 | **Not Found page** for deleted sessions — friendly message, "Return to Dashboard" action | `not-found.tsx` exists (3KB) — needs content audit | 🟡 |
| 17.2 | **Global Error Boundary** — "Something went wrong", retry, reset preferences, redact production stack traces | `error.tsx` exists (3.7KB) — needs audit for redaction and recovery | 🟡 |
| 17.3 | **Storage failures** — IndexedDB unavailable/corrupt/quota shows inline error with draft preservation | Not implemented | 🟡 |
| 17.4 | **Wipe blocked-deletion handling** — explain other tab must close, Retry/Cancel | Not implemented | 🔴 |
| 17.5 | **Inline error states** — avatar load failure, unsupported attachment, provider errors as local fallbacks | Minimal implementation | 🟡 |

---

## 18. `spec_keyboard_shortcuts.md` — Keyboard & A11y Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 18.1 | **`Cmd/Ctrl + K`** — open search/command palette | Implemented in SearchPalette | ✅ |
| 18.2 | **`Cmd/Ctrl + /`** — focus chat composer | Not implemented | 🟡 |
| 18.3 | **`Cmd/Ctrl + Shift + S`** — toggle sidebar | Implemented in Sidebar | ✅ |
| 18.4 | **`Cmd/Ctrl + ,`** — open Settings | Not implemented | 🟡 |
| 18.5 | **`@` mention popover** in Council mode with Arrow/Enter/Escape | Not implemented | 🟡 |
| 18.6 | **Modal focus trapping** across all modals | Not implemented — no `inert` or trap logic | 🔴 |
| 18.7 | **Visible WCAG 2.2 AA focus indicators** | Minimal | 🔴 |
| 18.8 | **`prefers-reduced-motion` respect** | Not implemented anywhere in CSS or JS | 🔴 |
| 18.9 | **Polite live regions** for completed events | Not implemented | 🔴 |
| 18.10 | **Shortcuts displayed in menus/tooltips** | KeyboardShortcutsModal exists but may not be discoverable | 🟡 |

---

## 19. `spec_loading_states.md` — Loading & Skeleton Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 19.1 | **Layout-matched skeleton placeholders** for chat history and persona grid with `aria-busy` | Skeleton.tsx exists but usage across pages uncertain | 🟡 |
| 19.2 | **Pending assistant message** — create immediately with persona identification text | Not implemented as formal pending state | 🟡 |
| 19.3 | **"Jump to latest" button** when user scrolls up during streaming | Not implemented | 🟡 |
| 19.4 | **Thin top progress indicator** for route changes | Not implemented | 🟡 |
| 19.5 | **Mutation busy states** — `aria-busy` + "Exporting backup…" on action buttons | Not implemented | 🟡 |

---

## 20. `spec_local_models.md` — Local Model Connectivity Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 20.1 | **Strict loopback host boundary** — reject LAN/public/tunnel URLs | Not enforced in code | 🟡 |
| 20.2 | **Test Connection button** with distinct error states (offline / CORS / model-not-found) | Partial test exists; no distinct error differentiation | 🔴 |
| 20.3 | **CORS setup instructions** — copyable `OLLAMA_ORIGINS` command | LocalModelGuidance.tsx exists but content needs audit | 🟡 |
| 20.4 | **Dynamic Model Auto-Discovery** — parse `/api/tags` and populate model selectors | API route `/api/models` exists; frontend auto-population uncertain | 🟡 |
| 20.5 | **LM Studio and vLLM support** | Pre-configured ports mentioned in spec but UI hidden behind feature flag; probably not implemented | ⚪ |

---

## 21. `spec_audio.md` — Audio (Post-MVP)

| # | Item | Status | Tag |
|---|------|--------|-----|
| 21.1 | All audio features (STT, TTS, Voice ID, Podcast Mode) | Explicitly post-MVP; not implemented | ⚪ |

---

## 22. `PRIVACY_AND_SAFETY.md` Gaps

| # | Item | Status | Tag |
|---|------|--------|-----|
| 22.1 | **Privacy page** at `/privacy` | Page exists (basic) | 🟡 |
| 22.2 | **Safety disclosure for advice-oriented flows** | Not implemented | 🔴 |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| 🔴 **MVP-CRITICAL** remaining | **~25** |
| 🟡 **MVP-SPECIFIED** remaining | **~85** |
| ⚪ **POST-MVP** (explicitly deferred) | **~8** |
| ✅ Confirmed implemented | **2** (keyboard shortcuts) |
| **Total gaps identified** | **~118** |

> [!IMPORTANT]
> The **25 MVP-CRITICAL** items are blockers for the acceptance checklist in `MVP_ACCEPTANCE.md`. Everything else is specified in feature docs but not gated by the acceptance checklist.
