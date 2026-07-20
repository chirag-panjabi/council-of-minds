# Token Usage and Analytics Specification

## Overview

Analytics helps a BYOK user understand locally observed usage and estimated cost. It is not provider billing, telemetry, or a substitute for the provider invoice. All analytics records remain in `IndexedDB` and contain no prompt text, attachment contents, API keys, or response text.

## 1. Placement and Navigation

- **Route:** `/analytics`.
- **Navigation:** The sidebar includes a labelled Analytics link. The Dashboard may show a current-month estimate with a `View details` link.
- **Incognito:** Incognito requests create no `TokenUsage` record, dashboard contribution, persona statistic, search entry, or export entry. Existing non-Incognito analytics remain viewable while an Incognito chat is active.

## 2. Tracking and Storage Strategy

- **Capture:** After a successful completion, normalize the provider's returned usage object when available. Do not infer a precise token total when a provider omits usage; display that request as `Usage unavailable`.
- **Record shape:** Store a `TokenUsage` record in `IndexedDB` with `id`, timestamp, session ID, persona ID, provider, model, `inputTokens`, `outputTokens`, optional `cachedInputTokens`, optional `reasoningTokens`, a usage-availability flag, and the pricing-catalog version used for any estimate.
- **Privacy:** Session/persona IDs are local references only. No analytics record is sent to the same-origin proxy or another backend.
- **Local models:** Record observed token usage only if the local provider returns it. A local model does not automatically mean a known $0.00 cost.

## 3. Analytics Interface

- **KPI cards:** Estimated spend for the selected period, known total tokens, and most active persona. Clearly distinguish `N/A`/unknown from zero.
- **Time series:** Show usage over Last 7 Days, Last 30 Days, Last 90 Days, and All Time. Default to the last 90 days.
- **Persona drill-down:** Show model distribution, known cost estimates, and average known tokens per request. Explain when excluded requests have unavailable usage.
- **Breakdown table:** Provide a semantic table by model or persona with input, output, cached/reasoning tokens where applicable, total known tokens, pricing catalog version, and estimated cost.
- **Chart alternative:** Every chart has an equivalent keyboard-accessible table or summary. Do not use color as the only distinction between models or series.

## 4. Performance and Retention

- Query indexed records by date and provider/model fields. Aggregate large result sets in a worker or in incremental batches so charts do not block the main thread.
- Do not make unverified claims about per-record or total browser-storage size. Browser quota, model metadata, and retention vary by device.
- If local storage/quota pressure prevents writing a usage record, keep the completed chat intact and show an unobtrusive local analytics warning; do not retry the model request or send data remotely.

## 5. Cost Estimation and Pricing Catalog

- Maintain a versioned, dated pricing catalog in the application. Each entry identifies the provider/model, currency, input/output (and cached/reasoning when applicable) rates, catalog version, and `publishedAt`/effective date.
- The UI labels estimates with the catalog date and version, for example: “Estimate using catalog 2026-07-16; provider billing may differ.” Updating the catalog is an explicit application release/change, not an undocumented live price lookup.
- Preserve the catalog version on a usage record so historical figures can be explained. If an updated catalog is used to recalculate history, label the recalculation and let the user see the applied version.
- An unknown, custom, or deferred model shows `N/A` for estimated cost, not `$0.00`. A provider-returned token count may still contribute to token totals even when cost is `N/A`.
- Cost estimates are informational. Provider invoices, regional pricing, caching, tool calls, taxes, minimums, and billing changes may differ.

## 6. Accessibility

- Filters, tables, chart alternatives, and drill-down controls meet WCAG 2.2 AA for keyboard operation, visible focus, contrast, labels, and status/error feedback.
- Respect reduced-motion preferences for chart transitions and provide text feedback when filters change.
