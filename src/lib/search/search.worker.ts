/**
 * Search Web Worker.
 *
 * Runs literal substring matching off the main thread.
 * Receives data snapshots via postMessage — no direct DB access.
 */

import { executeSearch } from './search-utils';
import type {
  WorkerInboundMessage,
  SearchResponseMessage,
} from './types';

let currentRequestId: string | null = null;

self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;

  if (msg.type === 'cancel') {
    if (currentRequestId === msg.requestId) {
      currentRequestId = null;
    }
    return;
  }

  if (msg.type === 'search') {
    currentRequestId = msg.requestId;

    const results = executeSearch(
      msg.query,
      msg.filters,
      msg.personas,
      msg.sessions,
      msg.messages,
    );

    // Only send result if this request hasn't been cancelled
    if (currentRequestId === msg.requestId) {
      const response: SearchResponseMessage = {
        type: 'result',
        requestId: msg.requestId,
        results,
      };
      self.postMessage(response);
      currentRequestId = null;
    }
  }
};
