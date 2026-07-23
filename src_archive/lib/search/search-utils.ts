/**
 * Pure search utility functions.
 *
 * These are extracted from the worker so they can be unit-tested directly
 * in a jsdom/Node environment (Web Workers aren't available in Vitest).
 *
 * All matching is case-insensitive, Unicode-normalized (NFC), literal
 * substring. Characters like *, (, [, \ are never placed into a RegExp.
 */

import {
  type SearchablePersona,
  type SearchableSession,
  type SearchableMessage,
  type SearchFilters,
  type PersonaSearchResult,
  type ChatSearchResult,
  type SearchResults,
  MAX_RESULTS_PER_CATEGORY,
} from './types';

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a string for search: NFC Unicode normalization + lowercase.
 */
export function normalize(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

/**
 * Check if `haystack` contains `needle` as a literal substring
 * after normalization. Both inputs are normalized internally.
 */
export function literalMatch(haystack: string, needle: string): boolean {
  if (needle.length === 0) return false;
  return normalize(haystack).includes(normalize(needle));
}

/**
 * Extract a snippet around the first match position.
 * Returns up to `contextChars` characters on each side of the match.
 */
export function extractSnippet(
  text: string,
  query: string,
  contextChars = 40,
): string {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);
  const idx = normalizedText.indexOf(normalizedQuery);

  if (idx === -1) return text.slice(0, contextChars * 2);

  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + query.length + contextChars);

  let snippet = text.slice(start, end);
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';

  return snippet;
}

// ---------------------------------------------------------------------------
// Search execution (pure, no worker dependency)
// ---------------------------------------------------------------------------

export function executeSearch(
  query: string,
  filters: SearchFilters,
  personas: SearchablePersona[],
  sessions: SearchableSession[],
  messages: SearchableMessage[],
): SearchResults {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return {
      personas: [],
      chats: [],
      personasTruncated: false,
      chatsTruncated: false,
    };
  }

  // --- Persona search ---
  const personaResults: PersonaSearchResult[] = [];
  let personasTruncated = false;

  for (const persona of personas) {
    if (personaResults.length >= MAX_RESULTS_PER_CATEGORY) {
      personasTruncated = true;
      break;
    }

    if (literalMatch(persona.name, trimmedQuery)) {
      personaResults.push({
        id: persona.id,
        name: persona.name,
        description: persona.description,
        matchField: 'name',
        snippet: extractSnippet(persona.name, trimmedQuery),
      });
    } else if (persona.description && literalMatch(persona.description, trimmedQuery)) {
      personaResults.push({
        id: persona.id,
        name: persona.name,
        description: persona.description,
        matchField: 'description',
        snippet: extractSnippet(persona.description, trimmedQuery),
      });
    }
  }

  // --- Chat search ---
  // Build a session lookup, excluding Incognito and applying mode filter
  const sessionMap = new Map<string, SearchableSession>();
  for (const session of sessions) {
    if (session.isIncognito) continue;
    if (filters.mode && session.mode !== filters.mode) continue;
    sessionMap.set(session.id, session);
  }

  const chatResults: ChatSearchResult[] = [];
  let chatsTruncated = false;

  // Track sessions already matched by title to avoid duplicate title+message entries
  const sessionTitleMatched = new Set<string>();

  // First pass: match session titles
  for (const session of Array.from(sessionMap.values())) {
    if (chatResults.length >= MAX_RESULTS_PER_CATEGORY) {
      chatsTruncated = true;
      break;
    }

    if (literalMatch(session.title, trimmedQuery)) {
      chatResults.push({
        sessionId: session.id,
        sessionTitle: session.title,
        mode: session.mode,
        matchField: 'title',
        snippet: extractSnippet(session.title, trimmedQuery),
      });
      sessionTitleMatched.add(session.id);
    }
  }

  // Second pass: match message content
  if (!chatsTruncated) {
    for (const message of messages) {
      if (chatResults.length >= MAX_RESULTS_PER_CATEGORY) {
        chatsTruncated = true;
        break;
      }

      const session = sessionMap.get(message.sessionId);
      if (!session) continue; // Incognito or filtered out

      if (literalMatch(message.content, trimmedQuery)) {
        chatResults.push({
          sessionId: session.id,
          sessionTitle: session.title,
          mode: session.mode,
          messageId: message.id,
          matchField: 'content',
          snippet: extractSnippet(message.content, trimmedQuery),
        });
      }
    }
  }

  return {
    personas: personaResults,
    chats: chatResults,
    personasTruncated: personasTruncated,
    chatsTruncated: chatsTruncated,
  };
}
