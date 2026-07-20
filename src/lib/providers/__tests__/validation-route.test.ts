import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/proxy/[provider]/validate/route';

const originalFetch = global.fetch;

function requestFor(provider: string, authorization = 'Bearer key-for-test-only') {
  return new NextRequest(`http://localhost:3000/api/proxy/${provider}/validate`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      Host: 'localhost:3000',
      Origin: 'http://localhost:3000',
    },
  });
}

describe('cloud validation proxy route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('validates OpenAI through the proxy with a GET model request', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const response = await POST(requestFor('openai'), { params: Promise.resolve({ provider: 'openai' }) });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'valid', retryable: false });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer key-for-test-only' },
      }),
    );
  });

  it.each([
    [401, 'invalid_key', false],
    [429, 'quota_exceeded', true],
    [500, 'provider_error', true],
  ] as const)('maps upstream %s to %s without exposing the key', async (upstreamStatus, status, retryable) => {
    vi.mocked(global.fetch).mockResolvedValueOnce(new Response(
      'key-for-test-only must not reach the browser',
      { status: upstreamStatus },
    ));

    const response = await POST(requestFor('gemini'), { params: Promise.resolve({ provider: 'gemini' }) });

    expect(response.status).toBe(upstreamStatus);
    await expect(response.json()).resolves.toEqual({ status, retryable });
  });

  it('normalizes a network failure as a retryable connectivity error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError('socket failure key-for-test-only'));

    const response = await POST(requestFor('anthropic'), { params: Promise.resolve({ provider: 'anthropic' }) });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: 'connectivity_error',
      retryable: true,
    });
  });

  it('reuses proxy access controls and rejects a local provider', async () => {
    const response = await POST(requestFor('ollama'), { params: Promise.resolve({ provider: 'ollama' }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: 'provider_error',
      retryable: false,
      code: 'direct_provider_required',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
