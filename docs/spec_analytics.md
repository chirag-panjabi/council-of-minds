# Token Usage and Analytics Specification

## 1. Overview & Token-First Scope Rationale

- **Primary Purpose:** Analytics helps BYOK users understand locally observed LLM usage across models and personas. All records remain in `IndexedDB` and contain **zero prompt text, attachment content, API keys, or response text**.
- **Token-First Scope Rationale:** In a local-first, zero-backend BYOK app, exact token counts (`prompt_tokens`, `completion_tokens`, `reasoning_tokens`) are extracted directly from provider response SSE payloads without relying on fragile remote pricing tables. Optional spend estimation is supported when a versioned local pricing catalog entry is available.

## 2. Placement, Routing & Dashboard Widget

- **Route:** `/analytics`.
- **Sidebar Launcher:** Prominent bar/pie chart icon in the primary sidebar.
- **Dashboard Widget:** A "Usage at a Glance" card on the main Dashboard displaying total tokens used and the most active persona/group, with a *"View Details"* link to `/analytics` (`spec_dashboard.md` §3.2).
- **Incognito Privacy Rule:** Incognito requests create **zero `TokenUsage` records**, dashboard contributions, search entries, or export items. Existing analytics remain viewable without leaks.

## 3. Data Capture & Quantitative Storage Strategy

- **Interception:** Captures token counts from provider SSE `usage` objects (OpenAI, Anthropic, Gemini, Ollama). Displays `Usage unavailable` if a provider omits token data.
- **Record Schema in `IndexedDB` (`tokenUsage`):**
  - `id` (auto-increment)
  - `timestamp` (Date)
  - `sessionId` (Reference to chat session)
  - `personaId` (Reference to persona used)
  - `provider` & `model` (e.g., `openai:gpt-4o`, `anthropic:claude-3-5-sonnet`)
  - `inputTokens`, `outputTokens`, `cachedTokens`, `reasoningTokens` (Numbers)
  - `catalogVersion` (Optional version identifier if spend estimation is applied)
- **Quantitative Storage Overhead:** Each record consumes ~150 bytes in `IndexedDB`. 10,000 chat messages consume only ~1.5 MB of local storage, ensuring negligible browser storage impact. Default queries load the last 90 days of activity.

## 4. Analytics Interface & Recharts Visualizations

### 4.1. Top KPI Cards
- **Total Tokens:** Cumulative sum of prompt, completion, and reasoning tokens.
- **Most Active Persona:** Persona responsible for the highest token volume.
- **Most Active Model:** Model that has processed the most tokens, helping BYOK users evaluate provider key usage.
- **Estimated Spend (Optional):** Displays estimated cost when matching catalog entries exist; clearly labels `N/A` for custom or local models.

### 4.2. Time-Series Usage Charts
- Interactive Recharts bar/line chart displaying token consumption over time.
- Time range filters: **Last 7 Days**, **Last 30 Days**, **Last 90 Days** (default), and **All Time**.

### 4.3. Persona Deep-Dive & Prompt Bloat Detection
- **Model Distribution Pie Chart:** Shows model usage breakdown per persona.
- **Total Tokens per Persona:** Total volume consumed by selected persona.
- **Average Tokens per Request:** Calculates prompt token density per request, helping users identify if a persona's instructions or system prompt are bloated.

### 4.4. Model Breakdown Table
- Semantic table segmenting usage by **Model** or **Persona**.
- Columns: Name/Model, Input Tokens, Output Tokens, Reasoning/Cached Tokens, Total Tokens, Estimated Cost / Catalog Date.
- Equivalent keyboard-accessible tabular view provided for every chart.

## 5. Local Models & Privacy Boundaries

- **Ollama / Local Engines:** Tracked identically to cloud providers if the local server reports a `usage` object. If omitted, displays `N/A` for token counts rather than guessing.
- **Zero Remote Telemetry:** Analytics records are processed entirely in browser Web Workers. Zero telemetry bytes, model IDs, or usage metrics are transmitted to any server.

## 6. Accessibility Guidelines

- WCAG 2.2 AA compliance: visible focus rings, non-color visual distinction, screen reader announcements for filter updates, and `prefers-reduced-motion` support.
