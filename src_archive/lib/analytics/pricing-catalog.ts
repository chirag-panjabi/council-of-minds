/**
 * Versioned pricing catalog for token cost estimation.
 *
 * This is a static, application-embedded catalog. Updates happen only via
 * code changes/releases — there is no live price lookup.
 *
 * Cost estimates are informational. Provider invoices, regional pricing,
 * caching discounts, tool calls, taxes, minimums, and billing changes may differ.
 */

export const CATALOG_VERSION = '2026-07-17';
export const CATALOG_PUBLISHED_AT = '2026-07-17';

export interface PricingEntry {
  providerId: string;
  modelId: string;
  currency: 'USD';
  /** Price per 1 million input tokens */
  inputPer1M: number;
  /** Price per 1 million output tokens */
  outputPer1M: number;
  /** Price per 1 million cached input tokens (optional) */
  cachedInputPer1M?: number;
  /** Price per 1 million reasoning tokens (optional) */
  reasoningPer1M?: number;
  catalogVersion: string;
  publishedAt: string;
}

// ---------------------------------------------------------------------------
// Catalog entries
// ---------------------------------------------------------------------------

const catalog: PricingEntry[] = [
  // OpenAI
  {
    providerId: 'openai',
    modelId: 'gpt-4o',
    currency: 'USD',
    inputPer1M: 2.50,
    outputPer1M: 10.00,
    cachedInputPer1M: 1.25,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'openai',
    modelId: 'gpt-4o-mini',
    currency: 'USD',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    cachedInputPer1M: 0.075,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'openai',
    modelId: 'gpt-4-turbo',
    currency: 'USD',
    inputPer1M: 10.00,
    outputPer1M: 30.00,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'openai',
    modelId: 'o1',
    currency: 'USD',
    inputPer1M: 15.00,
    outputPer1M: 60.00,
    cachedInputPer1M: 7.50,
    reasoningPer1M: 60.00,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'openai',
    modelId: 'o1-mini',
    currency: 'USD',
    inputPer1M: 3.00,
    outputPer1M: 12.00,
    cachedInputPer1M: 1.50,
    reasoningPer1M: 12.00,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },

  // Anthropic
  {
    providerId: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    currency: 'USD',
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    cachedInputPer1M: 0.30,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    currency: 'USD',
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    cachedInputPer1M: 0.30,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'anthropic',
    modelId: 'claude-3-5-haiku-20241022',
    currency: 'USD',
    inputPer1M: 0.80,
    outputPer1M: 4.00,
    cachedInputPer1M: 0.08,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'anthropic',
    modelId: 'claude-opus-4-20250514',
    currency: 'USD',
    inputPer1M: 15.00,
    outputPer1M: 75.00,
    cachedInputPer1M: 1.50,
    reasoningPer1M: 75.00,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },

  // Google Gemini
  {
    providerId: 'gemini',
    modelId: 'gemini-2.5-pro',
    currency: 'USD',
    inputPer1M: 1.25,
    outputPer1M: 10.00,
    reasoningPer1M: 10.00,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-2.5-flash',
    currency: 'USD',
    inputPer1M: 0.15,
    outputPer1M: 0.60,
    reasoningPer1M: 3.50,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
  {
    providerId: 'gemini',
    modelId: 'gemini-2.0-flash',
    currency: 'USD',
    inputPer1M: 0.10,
    outputPer1M: 0.40,
    catalogVersion: CATALOG_VERSION,
    publishedAt: CATALOG_PUBLISHED_AT,
  },
];

// Build a lookup map for O(1) access
const catalogMap = new Map<string, PricingEntry>();
for (const entry of catalog) {
  catalogMap.set(`${entry.providerId}:${entry.modelId}`, entry);
}

/**
 * Look up pricing for a specific provider/model combination.
 * Returns `null` for unknown, custom, or local models — the UI should
 * display `N/A` for cost, never `$0.00`.
 */
export function lookupPrice(
  providerId: string,
  modelId: string,
): PricingEntry | null {
  return catalogMap.get(`${providerId}:${modelId}`) ?? null;
}

/**
 * Return all entries in the catalog (for display/debug purposes).
 */
export function getAllPricingEntries(): readonly PricingEntry[] {
  return catalog;
}
