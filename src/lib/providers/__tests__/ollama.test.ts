import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_OLLAMA_BASE_URL,
  OllamaAdapterError,
  listOllamaModels,
  normalizeOllamaBaseUrl,
  startOllamaChat,
  testOllamaConnection,
} from '../ollama';

describe('Ollama direct adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['http://localhost:11434', DEFAULT_OLLAMA_BASE_URL],
    ['http://127.0.0.1:11434/api/', 'http://127.0.0.1:11434/api'],
    ['https://[::1]:11434/api', 'https://[::1]:11434/api'],
  ])('normalizes allowed loopback URL %s', (input, expected) => {
    expect(normalizeOllamaBaseUrl(input)).toBe(expected);
  });

  it.each([
    'http://192.168.1.2:11434/api',
    'https://ollama.com/api',
    'http://localhost:11434/custom-path',
    'ftp://localhost:11434/api',
    'http://user:password@localhost:11434/api',
  ])('rejects non-canonical local endpoint %s', (input) => {
    expect(() => normalizeOllamaBaseUrl(input)).toThrow(OllamaAdapterError);
    expect(() => normalizeOllamaBaseUrl(input)).toThrow(/localhost, 127\.0\.0\.1, or \[::1\]/);
  });

  it('discovers models directly from loopback without calling the cloud proxy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      models: [{ name: 'qwen3:latest', model: 'qwen3:latest', size: 42 }],
    })));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listOllamaModels('http://localhost:11434')).resolves.toEqual({
      baseUrl: DEFAULT_OLLAMA_BASE_URL,
      models: [{ name: 'qwen3:latest', model: 'qwen3:latest', size: 42, modifiedAt: undefined }],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/tags',
      { method: 'GET', signal: undefined },
    );
    expect(fetchMock.mock.calls[0][0]).not.toContain('/api/proxy/');
  });

  it('returns a distinct empty-model state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ models: [] }))));

    await expect(testOllamaConnection(DEFAULT_OLLAMA_BASE_URL)).resolves.toEqual({
      status: 'no_models',
      message: 'Ollama is running, but no installed models were found.',
      retryable: true,
    });
  });

  it('returns distinct unavailable and CORS failure states', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(testOllamaConnection(DEFAULT_OLLAMA_BASE_URL)).resolves.toMatchObject({
      status: 'unavailable',
      retryable: true,
    });

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('CORS request blocked by policy')));
    await expect(testOllamaConnection(DEFAULT_OLLAMA_BASE_URL)).resolves.toMatchObject({
      status: 'cors_blocked',
      retryable: true,
    });
  });

  it('keeps an ambiguous browser fetch failure actionable without treating it as cloud fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(testOllamaConnection(DEFAULT_OLLAMA_BASE_URL)).resolves.toMatchObject({
      status: 'connection_blocked',
      retryable: true,
    });
  });

  it('sends chat directly to the Ollama chat endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(startOllamaChat({
      baseUrl: DEFAULT_OLLAMA_BASE_URL,
      model: 'qwen3:latest',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    })).resolves.toBeInstanceOf(Response);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      model: 'qwen3:latest',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
    });
  });

  it('rejects attachments before making a local request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(startOllamaChat({
      baseUrl: DEFAULT_OLLAMA_BASE_URL,
      model: 'qwen3:latest',
      messages: [{ role: 'user', content: 'Inspect this' }],
      attachments: [{ mimeType: 'image/png' }],
    })).rejects.toMatchObject({ code: 'unsupported_attachment' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
