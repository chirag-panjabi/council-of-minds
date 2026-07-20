import { afterEach, describe, expect, it, vi } from 'vitest';

import { validateCloudProvider } from '../cloud-validation';

describe('validateCloudProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the same-origin proxy and returns the safe success state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ status: 'valid', retryable: false }),
      { status: 200 },
    ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateCloudProvider('openai', 'key-for-test-only')).resolves.toEqual({
      status: 'valid',
      retryable: false,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/proxy/openai/validate', {
      method: 'POST',
      headers: { Authorization: 'Bearer key-for-test-only' },
      signal: undefined,
    });
  });

  it('does not make a request for an empty key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateCloudProvider('gemini', '  ')).resolves.toEqual({
      status: 'invalid_key',
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns provider-provided safe failures without persisting a key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ status: 'quota_exceeded', retryable: true }),
      { status: 429 },
    ));
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateCloudProvider('gemini', 'key-for-test-only')).resolves.toEqual({
      status: 'quota_exceeded',
      retryable: true,
    });
  });

  it('normalizes browser connectivity failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network failed')));

    await expect(validateCloudProvider('anthropic', 'key-for-test-only')).resolves.toEqual({
      status: 'connectivity_error',
      retryable: true,
    });
  });

  it('does not route Ollama validation through the cloud proxy', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(validateCloudProvider('ollama', 'not-used')).resolves.toEqual({
      status: 'provider_error',
      retryable: false,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
