import { describe, it, expect } from 'vitest';
import {
  lookupPrice,
  getAllPricingEntries,
  CATALOG_VERSION,
  CATALOG_PUBLISHED_AT,
} from '../pricing-catalog';

describe('pricing-catalog', () => {
  it('returns pricing for a known OpenAI model', () => {
    const entry = lookupPrice('openai', 'gpt-4o');
    expect(entry).not.toBeNull();
    expect(entry!.providerId).toBe('openai');
    expect(entry!.modelId).toBe('gpt-4o');
    expect(entry!.currency).toBe('USD');
    expect(entry!.inputPer1M).toBe(2.50);
    expect(entry!.outputPer1M).toBe(10.00);
    expect(entry!.cachedInputPer1M).toBe(1.25);
    expect(entry!.catalogVersion).toBe(CATALOG_VERSION);
  });

  it('returns pricing for a known Anthropic model', () => {
    const entry = lookupPrice('anthropic', 'claude-sonnet-4-20250514');
    expect(entry).not.toBeNull();
    expect(entry!.inputPer1M).toBe(3.00);
    expect(entry!.outputPer1M).toBe(15.00);
  });

  it('returns pricing for a known Gemini model', () => {
    const entry = lookupPrice('gemini', 'gemini-2.5-flash');
    expect(entry).not.toBeNull();
    expect(entry!.inputPer1M).toBe(0.15);
    expect(entry!.reasoningPer1M).toBe(3.50);
  });

  it('returns null for an unknown model', () => {
    expect(lookupPrice('openai', 'gpt-99-turbo')).toBeNull();
  });

  it('returns null for Ollama (local) models', () => {
    expect(lookupPrice('ollama', 'llama3')).toBeNull();
  });

  it('returns null for an unknown provider', () => {
    expect(lookupPrice('deepseek', 'deepseek-v3')).toBeNull();
  });

  it('includes catalogVersion and publishedAt on all entries', () => {
    const entries = getAllPricingEntries();
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.catalogVersion).toBe(CATALOG_VERSION);
      expect(entry.publishedAt).toBe(CATALOG_PUBLISHED_AT);
      expect(entry.currency).toBe('USD');
      expect(entry.inputPer1M).toBeGreaterThan(0);
      expect(entry.outputPer1M).toBeGreaterThan(0);
    }
  });

  it('supports reasoning tokens on models that have them', () => {
    const o1 = lookupPrice('openai', 'o1');
    expect(o1).not.toBeNull();
    expect(o1!.reasoningPer1M).toBe(60.00);

    const opus = lookupPrice('anthropic', 'claude-opus-4-20250514');
    expect(opus).not.toBeNull();
    expect(opus!.reasoningPer1M).toBe(75.00);

    // gpt-4o has no reasoning tokens
    const gpt4o = lookupPrice('openai', 'gpt-4o');
    expect(gpt4o!.reasoningPer1M).toBeUndefined();
  });
});
