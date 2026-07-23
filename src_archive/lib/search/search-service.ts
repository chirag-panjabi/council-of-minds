/**
 * Search service — main-thread orchestrator.
 *
 * Reads data from Dexie, sends it to the Web Worker, and manages
 * request IDs, debouncing, and cancellation.
 */

import { db } from '../db';
import type {
  SearchFilters,
  SearchResults,
  SearchRequestMessage,
  CancelRequestMessage,
  SearchResponseMessage,
  SearchablePersona,
  SearchableSession,
  SearchableMessage,
} from './types';

export class SearchService {
  private worker: Worker | null = null;
  private currentRequestId: string | null = null;
  private pendingResolve: ((results: SearchResults) => void) | null = null;

  /**
   * Initialize the worker. Call once when the search palette opens.
   */
  init(): void {
    if (this.worker) return;

    this.worker = new Worker(
      new URL('./search.worker.ts', import.meta.url),
      { type: 'module' },
    );

    this.worker.onmessage = (event: MessageEvent<SearchResponseMessage>) => {
      const msg = event.data;
      if (msg.type === 'result' && msg.requestId === this.currentRequestId) {
        this.pendingResolve?.(msg.results);
        this.pendingResolve = null;
        this.currentRequestId = null;
      }
    };
  }

  /**
   * Execute a search. Cancels any in-flight request first.
   */
  async search(query: string, filters: SearchFilters = {}): Promise<SearchResults> {
    if (!this.worker) {
      this.init();
    }

    // Cancel previous request
    this.cancelCurrent();

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return { personas: [], chats: [], personasTruncated: false, chatsTruncated: false };
    }

    // Read data from Dexie
    const [allPersonas, allSessions, allMessages] = await Promise.all([
      db.personas.toArray(),
      db.sessions.toArray(),
      db.messages.toArray(),
    ]);

    // Map to searchable shapes (strip unnecessary fields)
    const personas: SearchablePersona[] = allPersonas.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
    }));

    const sessions: SearchableSession[] = allSessions.map((s) => ({
      id: s.id,
      title: s.title,
      mode: s.mode,
      isIncognito: s.isIncognito,
    }));

    const messages: SearchableMessage[] = allMessages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      content: m.content,
    }));

    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    return new Promise<SearchResults>((resolve) => {
      this.pendingResolve = resolve;

      const request: SearchRequestMessage = {
        type: 'search',
        requestId,
        query: trimmed,
        filters,
        personas,
        sessions,
        messages,
      };

      this.worker!.postMessage(request);
    });
  }

  /**
   * Cancel the current in-flight search request.
   */
  cancelCurrent(): void {
    if (this.currentRequestId && this.worker) {
      const cancel: CancelRequestMessage = {
        type: 'cancel',
        requestId: this.currentRequestId,
      };
      this.worker.postMessage(cancel);

      // Resolve pending promise with empty results so callers don't hang
      this.pendingResolve?.({
        personas: [],
        chats: [],
        personasTruncated: false,
        chatsTruncated: false,
      });
      this.pendingResolve = null;
      this.currentRequestId = null;
    }
  }

  /**
   * Tear down the worker. Call when the search palette closes.
   */
  destroy(): void {
    this.cancelCurrent();
    this.worker?.terminate();
    this.worker = null;
  }
}
