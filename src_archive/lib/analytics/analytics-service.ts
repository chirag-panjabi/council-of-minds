import { db } from '../db';
import type { TokenUsage } from '../schemas';
import {
  lookupPrice,
  CATALOG_VERSION,
  CATALOG_PUBLISHED_AT,
  type PricingEntry,
} from './pricing-catalog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface UsageSummary {
  /** Estimated total spend in USD, or null if no records have known pricing */
  estimatedSpendUsd: number | null;
  /** Total known tokens across all records */
  totalKnownTokens: number;
  /** Most active persona name/id, or null if no usage */
  mostActivePersonaId: string | null;
  /** Number of records with unavailable usage */
  unavailableCount: number;
  /** Catalog metadata */
  catalogVersion: string;
  catalogPublishedAt: string;
}

export interface TimeSeriesBucket {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  totalTokens: number;
  estimatedCostUsd: number | null;
}

export interface ModelBreakdown {
  providerId: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  requestCount: number;
  catalogVersion: string | null;
  estimatedCostUsd: number | null;
}

export interface PersonaBreakdown {
  personaId: string;
  totalTokens: number;
  requestCount: number;
  estimatedCostUsd: number | null;
  models: { modelId: string; providerId: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPeriodStart(period: AnalyticsPeriod): number {
  if (period === 'all') return 0;

  const now = Date.now();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return now - days * 24 * 60 * 60 * 1000;
}

async function getRecordsForPeriod(
  period: AnalyticsPeriod,
): Promise<TokenUsage[]> {
  const allRecords = await db.tokenUsage.toArray();
  const start = getPeriodStart(period);
  return allRecords.filter((r) => r.createdAt >= start);
}

/**
 * Estimate cost for a single TokenUsage record using the pricing catalog.
 * Returns `null` for unknown models — the UI should display `N/A`.
 */
export function estimateCost(record: TokenUsage): number | null {
  const entry = lookupPrice(record.providerId, record.modelId);
  if (!entry) return null;
  if (record.usageAvailable === false) return null;

  let cost = 0;
  cost += (record.promptTokens / 1_000_000) * entry.inputPer1M;
  cost += (record.completionTokens / 1_000_000) * entry.outputPer1M;

  if (record.cachedInputTokens && entry.cachedInputPer1M) {
    cost += (record.cachedInputTokens / 1_000_000) * entry.cachedInputPer1M;
  }

  if (record.reasoningTokens && entry.reasoningPer1M) {
    cost += (record.reasoningTokens / 1_000_000) * entry.reasoningPer1M;
  }

  return cost;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get aggregate KPI summary for the given period.
 */
export async function getUsageSummary(
  period: AnalyticsPeriod,
): Promise<UsageSummary> {
  const records = await getRecordsForPeriod(period);

  let totalKnownTokens = 0;
  let estimatedSpendUsd: number | null = 0;
  let unavailableCount = 0;
  let hasAnyKnownCost = false;

  // Count per persona
  const personaCounts = new Map<string, number>();

  for (const record of records) {
    if (record.usageAvailable === false) {
      unavailableCount++;
      continue;
    }

    totalKnownTokens += record.totalTokens;

    const cost = estimateCost(record);
    if (cost !== null) {
      estimatedSpendUsd = (estimatedSpendUsd ?? 0) + cost;
      hasAnyKnownCost = true;
    }

    if (record.personaId) {
      personaCounts.set(
        record.personaId,
        (personaCounts.get(record.personaId) ?? 0) + 1,
      );
    }
  }

  if (!hasAnyKnownCost && records.length > 0) {
    estimatedSpendUsd = null;
  }

  // Find most active persona
  let mostActivePersonaId: string | null = null;
  let maxCount = 0;
  Array.from(personaCounts.entries()).forEach(([id, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostActivePersonaId = id;
    }
  });

  return {
    estimatedSpendUsd,
    totalKnownTokens,
    mostActivePersonaId,
    unavailableCount,
    catalogVersion: CATALOG_VERSION,
    catalogPublishedAt: CATALOG_PUBLISHED_AT,
  };
}

/**
 * Get daily-bucketed time series for charts.
 */
export async function getUsageTimeSeries(
  period: AnalyticsPeriod,
): Promise<TimeSeriesBucket[]> {
  const records = await getRecordsForPeriod(period);
  const buckets = new Map<string, TimeSeriesBucket>();

  for (const record of records) {
    if (record.usageAvailable === false) continue;

    const date = new Date(record.createdAt).toISOString().slice(0, 10);
    const existing = buckets.get(date) ?? {
      date,
      totalTokens: 0,
      estimatedCostUsd: 0,
    };

    existing.totalTokens += record.totalTokens;

    const cost = estimateCost(record);
    if (cost !== null) {
      existing.estimatedCostUsd = (existing.estimatedCostUsd ?? 0) + cost;
    }

    buckets.set(date, existing);
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/**
 * Get per-model breakdown for the breakdown table.
 */
export async function getUsageByModel(
  period: AnalyticsPeriod,
): Promise<ModelBreakdown[]> {
  const records = await getRecordsForPeriod(period);
  const groups = new Map<string, ModelBreakdown>();

  for (const record of records) {
    if (record.usageAvailable === false) continue;

    const key = `${record.providerId}:${record.modelId}`;
    const existing = groups.get(key) ?? {
      providerId: record.providerId,
      modelId: record.modelId,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      catalogVersion: null,
      estimatedCostUsd: null,
    };

    existing.inputTokens += record.promptTokens;
    existing.outputTokens += record.completionTokens;
    existing.cachedInputTokens += record.cachedInputTokens ?? 0;
    existing.reasoningTokens += record.reasoningTokens ?? 0;
    existing.totalTokens += record.totalTokens;
    existing.requestCount += 1;

    const cost = estimateCost(record);
    if (cost !== null) {
      existing.estimatedCostUsd = (existing.estimatedCostUsd ?? 0) + cost;
      const pricing = lookupPrice(record.providerId, record.modelId);
      if (pricing) {
        existing.catalogVersion = pricing.catalogVersion;
      }
    }

    groups.set(key, existing);
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.totalTokens - a.totalTokens,
  );
}

/**
 * Get per-persona breakdown with model distribution.
 */
export async function getUsageByPersona(
  period: AnalyticsPeriod,
): Promise<PersonaBreakdown[]> {
  const records = await getRecordsForPeriod(period);
  const groups = new Map<string, PersonaBreakdown>();

  for (const record of records) {
    if (record.usageAvailable === false) continue;
    if (!record.personaId) continue;

    const existing = groups.get(record.personaId) ?? {
      personaId: record.personaId,
      totalTokens: 0,
      requestCount: 0,
      estimatedCostUsd: null,
      models: [],
    };

    existing.totalTokens += record.totalTokens;
    existing.requestCount += 1;

    const cost = estimateCost(record);
    if (cost !== null) {
      existing.estimatedCostUsd = (existing.estimatedCostUsd ?? 0) + cost;
    }

    // Track model distribution
    const modelEntry = existing.models.find(
      (m) =>
        m.modelId === record.modelId && m.providerId === record.providerId,
    );
    if (modelEntry) {
      modelEntry.count += 1;
    } else {
      existing.models.push({
        modelId: record.modelId,
        providerId: record.providerId,
        count: 1,
      });
    }

    groups.set(record.personaId, existing);
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.totalTokens - a.totalTokens,
  );
}
