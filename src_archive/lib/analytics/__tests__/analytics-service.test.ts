import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  estimateCost,
  getUsageSummary,
  getUsageTimeSeries,
  getUsageByModel,
  getUsageByPersona,
} from '../analytics-service';
import type { TokenUsage } from '../../schemas';

// ---------------------------------------------------------------------------
// Mock DB
// ---------------------------------------------------------------------------

vi.mock('../../db', () => ({
  db: {
    tokenUsage: {
      toArray: vi.fn().mockResolvedValue([]),
    },
  },
}));

import { db } from '../../db';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = Date.now();
const ONE_DAY = 24 * 60 * 60 * 1000;

function makeUsage(overrides: Partial<TokenUsage> = {}): TokenUsage {
  return {
    id: crypto.randomUUID(),
    sessionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    createdAt: now - 2 * ONE_DAY,
    providerId: 'openai',
    modelId: 'gpt-4o',
    promptTokens: 1000,
    completionTokens: 500,
    totalTokens: 1500,
    usageAvailable: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('estimateCost', () => {
  it('calculates cost for a known model', () => {
    const record = makeUsage({
      promptTokens: 1_000_000,
      completionTokens: 1_000_000,
      totalTokens: 2_000_000,
    });

    const cost = estimateCost(record);
    expect(cost).not.toBeNull();
    // gpt-4o: $2.50/1M input + $10.00/1M output = $12.50
    expect(cost).toBeCloseTo(12.50, 2);
  });

  it('returns null for an unknown model', () => {
    const record = makeUsage({ modelId: 'custom-finetune-v9' });
    expect(estimateCost(record)).toBeNull();
  });

  it('returns null for Ollama models', () => {
    const record = makeUsage({ providerId: 'ollama', modelId: 'llama3' });
    expect(estimateCost(record)).toBeNull();
  });

  it('returns null when usageAvailable is false', () => {
    const record = makeUsage({ usageAvailable: false });
    expect(estimateCost(record)).toBeNull();
  });

  it('includes cached input cost when present', () => {
    const record = makeUsage({
      promptTokens: 500_000,
      completionTokens: 0,
      totalTokens: 500_000,
      cachedInputTokens: 500_000,
    });

    const cost = estimateCost(record);
    expect(cost).not.toBeNull();
    // gpt-4o: 0.5M input * $2.50 + 0.5M cached * $1.25 = $1.25 + $0.625 = $1.875
    expect(cost).toBeCloseTo(1.875, 3);
  });

  it('includes reasoning cost when present', () => {
    const record = makeUsage({
      providerId: 'openai',
      modelId: 'o1',
      promptTokens: 1_000_000,
      completionTokens: 0,
      totalTokens: 1_000_000,
      reasoningTokens: 1_000_000,
    });

    const cost = estimateCost(record);
    // o1: 1M input * $15 + 1M reasoning * $60 = $75
    expect(cost).toBeCloseTo(75.00, 2);
  });
});

describe('getUsageSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns zero totals when no records exist', async () => {
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue([]);

    const summary = await getUsageSummary('all');
    expect(summary.estimatedSpendUsd).toBe(0);
    expect(summary.totalKnownTokens).toBe(0);
    expect(summary.mostActivePersonaId).toBeNull();
    expect(summary.unavailableCount).toBe(0);
  });

  it('aggregates correctly across multiple records', async () => {
    const records = [
      makeUsage({
        personaId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      }),
      makeUsage({
        personaId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
        promptTokens: 2000,
        completionTokens: 1000,
        totalTokens: 3000,
      }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const summary = await getUsageSummary('all');
    expect(summary.totalKnownTokens).toBe(4500);
    expect(summary.mostActivePersonaId).toBe(
      'pppppppp-pppp-pppp-pppp-pppppppppppp',
    );
    expect(summary.estimatedSpendUsd).toBeGreaterThan(0);
  });

  it('counts unavailable usage records', async () => {
    const records = [
      makeUsage({ usageAvailable: false }),
      makeUsage({ usageAvailable: true }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const summary = await getUsageSummary('all');
    expect(summary.unavailableCount).toBe(1);
    expect(summary.totalKnownTokens).toBe(1500); // only the available record
  });

  it('filters by period', async () => {
    const records = [
      makeUsage({ createdAt: now - 5 * ONE_DAY }), // within 7d
      makeUsage({ createdAt: now - 20 * ONE_DAY }), // outside 7d
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const summary7d = await getUsageSummary('7d');
    expect(summary7d.totalKnownTokens).toBe(1500); // only the recent one

    const summaryAll = await getUsageSummary('all');
    expect(summaryAll.totalKnownTokens).toBe(3000); // both
  });

  it('returns null estimatedSpend when all records have unknown pricing', async () => {
    const records = [
      makeUsage({ providerId: 'ollama', modelId: 'llama3' }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const summary = await getUsageSummary('all');
    expect(summary.estimatedSpendUsd).toBeNull();
  });
});

describe('getUsageTimeSeries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no records exist', async () => {
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue([]);
    const series = await getUsageTimeSeries('all');
    expect(series).toHaveLength(0);
  });

  it('groups records by day', async () => {
    const day1 = new Date('2026-07-15T12:00:00Z').getTime();
    const day2 = new Date('2026-07-16T12:00:00Z').getTime();

    const records = [
      makeUsage({ createdAt: day1, totalTokens: 100 }),
      makeUsage({ createdAt: day1, totalTokens: 200 }),
      makeUsage({ createdAt: day2, totalTokens: 300 }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const series = await getUsageTimeSeries('all');
    expect(series).toHaveLength(2);
    expect(series[0].date).toBe('2026-07-15');
    expect(series[0].totalTokens).toBe(300);
    expect(series[1].date).toBe('2026-07-16');
    expect(series[1].totalTokens).toBe(300);
  });
});

describe('getUsageByModel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups by provider:model', async () => {
    const records = [
      makeUsage({ providerId: 'openai', modelId: 'gpt-4o', totalTokens: 100 }),
      makeUsage({ providerId: 'openai', modelId: 'gpt-4o', totalTokens: 200 }),
      makeUsage({
        providerId: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
        totalTokens: 400,
      }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const breakdown = await getUsageByModel('all');
    expect(breakdown).toHaveLength(2);

    // Sorted by totalTokens desc
    expect(breakdown[0].modelId).toBe('claude-sonnet-4-20250514');
    expect(breakdown[0].totalTokens).toBe(400);
    expect(breakdown[0].requestCount).toBe(1);

    expect(breakdown[1].modelId).toBe('gpt-4o');
    expect(breakdown[1].totalTokens).toBe(300);
    expect(breakdown[1].requestCount).toBe(2);
  });

  it('sets estimatedCostUsd to null for unknown models', async () => {
    const records = [
      makeUsage({ providerId: 'ollama', modelId: 'llama3', totalTokens: 500 }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const breakdown = await getUsageByModel('all');
    expect(breakdown).toHaveLength(1);
    expect(breakdown[0].estimatedCostUsd).toBeNull();
    expect(breakdown[0].catalogVersion).toBeNull();
  });
});

describe('getUsageByPersona', () => {
  beforeEach(() => vi.clearAllMocks());

  it('groups by persona and tracks model distribution', async () => {
    const persona1 = 'pppppppp-pppp-pppp-pppp-pppppppppppp';
    const persona2 = 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq';

    const records = [
      makeUsage({ personaId: persona1, modelId: 'gpt-4o', totalTokens: 100 }),
      makeUsage({ personaId: persona1, modelId: 'gpt-4o', totalTokens: 200 }),
      makeUsage({
        personaId: persona1,
        modelId: 'gpt-4o-mini',
        totalTokens: 50,
      }),
      makeUsage({ personaId: persona2, modelId: 'gpt-4o', totalTokens: 400 }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const breakdown = await getUsageByPersona('all');
    expect(breakdown).toHaveLength(2);

    // Sorted by totalTokens desc — persona2 has 400
    expect(breakdown[0].personaId).toBe(persona2);
    expect(breakdown[0].totalTokens).toBe(400);
    expect(breakdown[0].requestCount).toBe(1);

    expect(breakdown[1].personaId).toBe(persona1);
    expect(breakdown[1].totalTokens).toBe(350);
    expect(breakdown[1].requestCount).toBe(3);
    expect(breakdown[1].models).toHaveLength(2);
  });

  it('excludes records without personaId', async () => {
    const records = [
      makeUsage({ personaId: undefined, totalTokens: 100 }),
    ];
    vi.mocked(db.tokenUsage.toArray).mockResolvedValue(records);

    const breakdown = await getUsageByPersona('all');
    expect(breakdown).toHaveLength(0);
  });
});
