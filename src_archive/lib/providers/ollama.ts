import type { Attachment } from '../schemas/attachment';

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/api';

export type OllamaFailureCode =
  | 'invalid_url'
  | 'cors_blocked'
  | 'connection_blocked'
  | 'unavailable'
  | 'no_models'
  | 'unsupported_attachment'
  | 'invalid_response'
  | 'request_cancelled'
  | 'request_failed';

export class OllamaAdapterError extends Error {
  constructor(
    readonly code: OllamaFailureCode,
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'OllamaAdapterError';
  }
}

export interface OllamaModel {
  name: string;
  model: string;
  size?: number;
  modifiedAt?: string;
}

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatRequest {
  baseUrl: string;
  model: string;
  messages: readonly OllamaChatMessage[];
  attachments?: readonly Pick<Attachment, 'mimeType'>[];
  stream?: boolean;
  signal?: AbortSignal;
}

export type OllamaConnectionResult =
  | { status: 'connected'; baseUrl: string; models: OllamaModel[] }
  | {
      status:
        | 'invalid_url'
        | 'cors_blocked'
        | 'connection_blocked'
        | 'unavailable'
        | 'no_models'
        | 'invalid_response';
      message: string;
      retryable: boolean;
    };

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function joinOllamaPath(baseUrl: string, path: 'tags' | 'chat'): string {
  return new URL(path, `${baseUrl}/`).toString();
}

/**
 * Canonicalizes an Ollama API base URL while preventing LAN, tunnel, cloud, and
 * credential-bearing endpoints from being treated as local connections.
 */
export function normalizeOllamaBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new OllamaAdapterError(
      'invalid_url',
      'Enter a valid Ollama loopback URL.',
      false,
    );
  }

  const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !LOOPBACK_HOSTS.has(url.hostname.toLowerCase()) ||
    Boolean(url.username || url.password || url.search || url.hash) ||
    !['/', '/api'].includes(normalizedPath)
  ) {
    throw new OllamaAdapterError(
      'invalid_url',
      'Use localhost, 127.0.0.1, or [::1] with the Ollama /api path.',
      false,
    );
  }

  return `${url.origin}/api`;
}

function toOllamaError(error: unknown): OllamaAdapterError {
  if (error instanceof OllamaAdapterError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new OllamaAdapterError('request_cancelled', 'The local request was cancelled.', true);
  }

  const message = error instanceof Error ? error.message : '';
  if (/cors|cross-origin|blocked by policy/i.test(message)) {
    return new OllamaAdapterError(
      'cors_blocked',
      'The browser blocked the Ollama connection. Allow this app origin in Ollama CORS settings and retry.',
      true,
    );
  }

  return new OllamaAdapterError(
    'connection_blocked',
    'The browser could not reach Ollama. Confirm it is running and allows this app origin.',
    true,
  );
}

function parseModels(payload: unknown): OllamaModel[] {
  if (!isRecord(payload) || !Array.isArray(payload.models)) {
    throw new OllamaAdapterError(
      'invalid_response',
      'Ollama returned an unexpected model list.',
      true,
    );
  }

  const seen = new Set<string>();
  return payload.models.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.name !== 'string' || !candidate.name.trim()) {
      return [];
    }

    const name = candidate.name.trim();
    if (seen.has(name)) {
      return [];
    }
    seen.add(name);

    return [{
      name,
      model: typeof candidate.model === 'string' ? candidate.model : name,
      size: typeof candidate.size === 'number' ? candidate.size : undefined,
      modifiedAt: typeof candidate.modified_at === 'string' ? candidate.modified_at : undefined,
    }];
  });
}

function assertAttachmentSupport(attachments: OllamaChatRequest['attachments']): void {
  if (attachments && attachments.length > 0) {
    throw new OllamaAdapterError(
      'unsupported_attachment',
      'The selected Ollama configuration does not support attachments in this MVP.',
      false,
    );
  }
}

export async function listOllamaModels(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<{ baseUrl: string; models: OllamaModel[] }> {
  const normalizedBaseUrl = normalizeOllamaBaseUrl(baseUrl);

  let response: Response;
  try {
    response = await fetch(joinOllamaPath(normalizedBaseUrl, 'tags'), {
      method: 'GET',
      signal,
    });
  } catch (error) {
    throw toOllamaError(error);
  }

  if (!response.ok) {
    throw new OllamaAdapterError(
      'unavailable',
      'Ollama is unavailable. Start the local server and try again.',
      true,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OllamaAdapterError(
      'invalid_response',
      'Ollama returned an unreadable model list.',
      true,
    );
  }

  return { baseUrl: normalizedBaseUrl, models: parseModels(payload) };
}

export async function testOllamaConnection(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<OllamaConnectionResult> {
  try {
    const result = await listOllamaModels(baseUrl, signal);
    if (result.models.length === 0) {
      return {
        status: 'no_models',
        message: 'Ollama is running, but no installed models were found.',
        retryable: true,
      };
    }

    return { status: 'connected', ...result };
  } catch (error) {
    const normalized = toOllamaError(error);
    const status = (() => {
      switch (normalized.code) {
        case 'invalid_url':
        case 'cors_blocked':
        case 'connection_blocked':
        case 'unavailable':
        case 'no_models':
        case 'invalid_response':
          return normalized.code;
        default:
          return 'connection_blocked';
      }
    })();
    return {
      status,
      message: normalized.message,
      retryable: normalized.retryable,
    };
  }
}

/**
 * Starts a direct browser-to-loopback chat request. Streaming consumers retain
 * the response body; the later conversation task owns incremental rendering.
 */
export async function startOllamaChat(request: OllamaChatRequest): Promise<Response> {
  assertAttachmentSupport(request.attachments);
  const baseUrl = normalizeOllamaBaseUrl(request.baseUrl);

  if (!request.model.trim()) {
    throw new OllamaAdapterError('request_failed', 'Choose an Ollama model before sending.', false);
  }

  try {
    const response = await fetch(joinOllamaPath(baseUrl, 'chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: request.stream ?? true,
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      throw new OllamaAdapterError(
        'unavailable',
        'Ollama could not complete this request. Confirm the selected model is available and retry.',
        true,
      );
    }

    return response;
  } catch (error) {
    throw toOllamaError(error);
  }
}
