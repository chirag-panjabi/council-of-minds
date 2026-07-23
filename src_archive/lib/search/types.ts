/**
 * Shared types for the search system (main thread ↔ worker).
 */

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export interface SearchFilters {
  /** Restrict to a session mode, or undefined for all */
  mode?: '1-on-1' | 'council';
}

// ---------------------------------------------------------------------------
// Data passed to the worker
// ---------------------------------------------------------------------------

export interface SearchablePersona {
  id: string;
  name: string;
  description?: string;
}

export interface SearchableSession {
  id: string;
  title: string;
  mode: '1-on-1' | 'council';
  isIncognito: boolean;
}

export interface SearchableMessage {
  id: string;
  sessionId: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Worker messages
// ---------------------------------------------------------------------------

export interface SearchRequestMessage {
  type: 'search';
  requestId: string;
  query: string;
  filters: SearchFilters;
  personas: SearchablePersona[];
  sessions: SearchableSession[];
  messages: SearchableMessage[];
}

export interface CancelRequestMessage {
  type: 'cancel';
  requestId: string;
}

export type WorkerInboundMessage = SearchRequestMessage | CancelRequestMessage;

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface PersonaSearchResult {
  id: string;
  name: string;
  description?: string;
  matchField: 'name' | 'description';
  snippet: string;
}

export interface ChatSearchResult {
  sessionId: string;
  sessionTitle: string;
  mode: '1-on-1' | 'council';
  messageId?: string;
  matchField: 'title' | 'content';
  snippet: string;
}

export interface SearchResults {
  personas: PersonaSearchResult[];
  chats: ChatSearchResult[];
  personasTruncated: boolean;
  chatsTruncated: boolean;
}

export interface SearchResponseMessage {
  type: 'result';
  requestId: string;
  results: SearchResults;
}

export type WorkerOutboundMessage = SearchResponseMessage;

export const MAX_RESULTS_PER_CATEGORY = 50;
