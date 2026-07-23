import { describe, it, expect } from 'vitest';
import {
  normalize,
  literalMatch,
  extractSnippet,
  executeSearch,
} from '../search-utils';
import type { SearchablePersona, SearchableSession, SearchableMessage } from '../types';

// ---------------------------------------------------------------------------
// normalize
// ---------------------------------------------------------------------------

describe('normalize', () => {
  it('lowercases text', () => {
    expect(normalize('Hello World')).toBe('hello world');
  });

  it('applies NFC normalization', () => {
    // é as combining character (e + ́) vs precomposed (é)
    const decomposed = 'e\u0301'; // NFD
    const precomposed = '\u00E9'; // NFC
    expect(normalize(decomposed)).toBe(normalize(precomposed));
  });
});

// ---------------------------------------------------------------------------
// literalMatch
// ---------------------------------------------------------------------------

describe('literalMatch', () => {
  it('finds simple substring', () => {
    expect(literalMatch('Hello World', 'world')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(literalMatch('FooBar', 'foobar')).toBe(true);
  });

  it('treats * as literal character', () => {
    expect(literalMatch('foo*bar', '*b')).toBe(true);
    expect(literalMatch('foobar', '*')).toBe(false);
  });

  it('treats ( and [ as literal characters', () => {
    expect(literalMatch('array[0]', '[0]')).toBe(true);
    expect(literalMatch('func(arg)', '(arg)')).toBe(true);
  });

  it('treats \\ as literal character', () => {
    expect(literalMatch('path\\to\\file', '\\to\\')).toBe(true);
  });

  it('returns false for empty needle', () => {
    expect(literalMatch('anything', '')).toBe(false);
  });

  it('returns false when no match', () => {
    expect(literalMatch('Hello World', 'xyz')).toBe(false);
  });

  it('handles Unicode normalization across forms', () => {
    const decomposed = 'caf\u0065\u0301'; // cafe + combining accent
    expect(literalMatch(decomposed, 'café')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// extractSnippet
// ---------------------------------------------------------------------------

describe('extractSnippet', () => {
  it('returns snippet around match', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const snippet = extractSnippet(text, 'fox', 10);
    expect(snippet).toContain('fox');
    expect(snippet.length).toBeLessThan(text.length + 2); // +2 for ellipsis
  });

  it('adds ellipsis for truncated content', () => {
    const text = 'A'.repeat(100) + 'TARGET' + 'B'.repeat(100);
    const snippet = extractSnippet(text, 'TARGET', 10);
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });

  it('does not add leading ellipsis at start of text', () => {
    const text = 'TARGET rest of text';
    const snippet = extractSnippet(text, 'TARGET', 10);
    expect(snippet.startsWith('…')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// executeSearch
// ---------------------------------------------------------------------------

const personas: SearchablePersona[] = [
  { id: 'p1', name: 'Socrates', description: 'Ancient Greek philosopher' },
  { id: 'p2', name: 'Einstein', description: 'Theoretical physicist' },
  { id: 'p3', name: 'Ada Lovelace', description: 'First computer programmer' },
];

const sessions: SearchableSession[] = [
  { id: 's1', title: 'Philosophy debate', mode: '1-on-1', isIncognito: false },
  { id: 's2', title: 'Physics council', mode: 'council', isIncognito: false },
  { id: 's3', title: 'Secret thoughts', mode: '1-on-1', isIncognito: true },
];

const messages: SearchableMessage[] = [
  { id: 'm1', sessionId: 's1', content: 'What is the meaning of virtue?' },
  { id: 'm2', sessionId: 's2', content: 'Relativity explains spacetime.' },
  { id: 'm3', sessionId: 's3', content: 'Private incognito message' },
  { id: 'm4', sessionId: 's1', content: 'Socrates would disagree.' },
];

describe('executeSearch', () => {
  it('finds personas by name', () => {
    const results = executeSearch('socrates', {}, personas, sessions, messages);
    expect(results.personas).toHaveLength(1);
    expect(results.personas[0].id).toBe('p1');
    expect(results.personas[0].matchField).toBe('name');
  });

  it('finds personas by description', () => {
    const results = executeSearch('physicist', {}, personas, sessions, messages);
    expect(results.personas).toHaveLength(1);
    expect(results.personas[0].id).toBe('p2');
    expect(results.personas[0].matchField).toBe('description');
  });

  it('finds chats by session title', () => {
    const results = executeSearch('philosophy', {}, personas, sessions, messages);
    expect(results.chats.some((c) => c.sessionId === 's1' && c.matchField === 'title')).toBe(true);
  });

  it('finds chats by message content', () => {
    const results = executeSearch('virtue', {}, personas, sessions, messages);
    expect(results.chats.some((c) => c.messageId === 'm1' && c.matchField === 'content')).toBe(true);
  });

  it('excludes Incognito sessions', () => {
    const results = executeSearch('private incognito', {}, personas, sessions, messages);
    expect(results.chats).toHaveLength(0);
  });

  it('excludes messages belonging to Incognito sessions', () => {
    const results = executeSearch('incognito message', {}, personas, sessions, messages);
    expect(results.chats).toHaveLength(0);
  });

  it('applies mode filter', () => {
    const results = executeSearch('council', { mode: '1-on-1' }, personas, sessions, messages);
    // "council" in title belongs to mode=council, should be filtered out
    expect(results.chats.filter((c) => c.mode === 'council')).toHaveLength(0);
  });

  it('returns empty results for empty query', () => {
    const results = executeSearch('', {}, personas, sessions, messages);
    expect(results.personas).toHaveLength(0);
    expect(results.chats).toHaveLength(0);
  });

  it('returns empty results for whitespace-only query', () => {
    const results = executeSearch('   ', {}, personas, sessions, messages);
    expect(results.personas).toHaveLength(0);
    expect(results.chats).toHaveLength(0);
  });

  it('handles special regex characters safely', () => {
    // These should not throw a regex error
    expect(() => executeSearch('*foo[bar(', {}, personas, sessions, messages)).not.toThrow();
    expect(() => executeSearch('\\d+', {}, personas, sessions, messages)).not.toThrow();
    expect(() => executeSearch('a{2,3}', {}, personas, sessions, messages)).not.toThrow();
  });

  it('caps results at 50 per category', () => {
    // Create 60 matching personas
    const manyPersonas: SearchablePersona[] = Array.from({ length: 60 }, (_, i) => ({
      id: `p-${i}`,
      name: `Test persona ${i}`,
    }));

    const results = executeSearch('test persona', {}, manyPersonas, [], []);
    expect(results.personas).toHaveLength(50);
    expect(results.personasTruncated).toBe(true);
  });

  it('includes canonical route-relevant fields in results', () => {
    const results = executeSearch('relativity', {}, personas, sessions, messages);
    const chatResult = results.chats.find((c) => c.messageId === 'm2');
    expect(chatResult).toBeDefined();
    expect(chatResult!.sessionId).toBe('s2');
    expect(chatResult!.mode).toBe('council');
  });
});
