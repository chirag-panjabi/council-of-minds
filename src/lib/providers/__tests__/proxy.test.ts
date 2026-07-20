import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/proxy/[provider]/route';
import { isSameOrigin, isRequestTooLarge, normalizeAndRedactError } from '@/lib/security/proxy';

// Mock NextRequest and its methods
function createMockRequest({
  origin,
  host,
  contentLength,
  body,
  apiKey,
  url = 'http://localhost:3000/api/proxy/openai',
}: {
  origin?: string;
  host?: string;
  contentLength?: string;
  body?: string;
  apiKey?: string;
  url?: string;
}) {
  const headers = new Map<string, string>();
  if (origin) headers.set('origin', origin);
  if (host) headers.set('host', host);
  if (contentLength) headers.set('content-length', contentLength);
  if (apiKey) headers.set('Authorization', apiKey);

  return {
    url,
    headers: {
      get: (key: string) => headers.get(key) || null,
    },
    text: async () => body || '',
    clone: () => ({
      json: async () => body ? JSON.parse(body) : {},
    }),
    signal: new AbortController().signal,
  } as unknown as NextRequest;
}

// Global fetch mock
const originalFetch = global.fetch;

describe('Cloud Proxy Security Helpers', () => {
  it('should allow valid same-origin requests', () => {
    const req = createMockRequest({ origin: 'http://localhost:3000', host: 'localhost:3000' });
    expect(isSameOrigin(req)).toBe(true);
  });

  it('should reject missing origin or host', () => {
    const req1 = createMockRequest({ host: 'localhost:3000' }); // missing origin
    expect(isSameOrigin(req1)).toBe(false);

    const req2 = createMockRequest({ origin: 'http://localhost:3000' }); // missing host
    expect(isSameOrigin(req2)).toBe(false);
  });

  it('should reject mismatched origins (CORS check)', () => {
    const req = createMockRequest({ origin: 'http://evil.com', host: 'localhost:3000' });
    expect(isSameOrigin(req)).toBe(false);
  });

  it('should reject oversized requests', () => {
    const req = createMockRequest({ contentLength: '6000000' }); // 6MB
    expect(isRequestTooLarge(req)).toBe(true);
  });

  it('should allow normal sized requests', () => {
    const req = createMockRequest({ contentLength: '1000' }); // 1KB
    expect(isRequestTooLarge(req)).toBe(false);
  });

  it('should normalize and redact errors', () => {
    const redacted = normalizeAndRedactError('Error with key sk-1234567890abcdef1234567890abcdef');
    expect(redacted.error).toBe('Error with key [REDACTED]');
    
    const redactedBearer = normalizeAndRedactError(new Error('Invalid token Bearer a.b.c'));
    expect(redactedBearer.error).toBe('Invalid token Bearer [REDACTED]');
  });
});

describe('Cloud Proxy API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('should reject requests that fail the origin check', async () => {
    const req = createMockRequest({ origin: 'http://evil.com', host: 'localhost:3000' });
    const res = await POST(req, { params: { provider: 'openai' } });
    
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Origin not allowed');
  });

  it('should reject requests that are too large', async () => {
    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      contentLength: '6000000' // 6MB
    });
    const res = await POST(req, { params: { provider: 'openai' } });
    
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toBe('Request body too large');
  });

  it('should reject unsupported providers', async () => {
    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000'
    });
    const res = await POST(req, { params: { provider: 'unknown' } });
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Unsupported provider');
  });

  it('should reject providers that do not use cloud proxy (like ollama)', async () => {
    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000'
    });
    const res = await POST(req, { params: { provider: 'ollama' } });
    
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Provider must be accessed directly, not via proxy');
  });

  it('should proxy a valid request to the upstream provider', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'text/event-stream' }),
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('stream_data_mock'));
          controller.close();
        }
      }) as unknown
    } as unknown as Response);

    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      apiKey: 'Bearer sk-fake123',
      body: JSON.stringify({ model: 'gpt-4o' })
    });
    
    const res = await POST(req, { params: { provider: 'openai' } });
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-fake123'
        },
        body: JSON.stringify({ model: 'gpt-4o' })
      })
    );
    
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });

  it('should reject requests with invalid JSON body', async () => {
    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      apiKey: 'Bearer sk-fake123',
      body: 'invalid-json'
    });
    
    const res = await POST(req, { params: { provider: 'openai' } });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON payload');
  });

  it('should handle aborted requests (AbortError)', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new DOMException('The user aborted a request.', 'AbortError'));

    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      apiKey: 'Bearer sk-fake123',
      body: JSON.stringify({ model: 'gpt-4' })
    });
    
    const res = await POST(req, { params: { provider: 'openai' } });
    expect(res.status).toBe(499);
    const body = await res.json();
    expect(body.code).toBe('request_cancelled');
  });

  it('should handle request timeout', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new DOMException('The operation timed out.', 'TimeoutError'));

    const req = createMockRequest({
      origin: 'http://localhost:3000',
      host: 'localhost:3000',
      apiKey: 'Bearer sk-fake123',
      body: JSON.stringify({ model: 'gpt-4' })
    });
    
    const res = await POST(req, { params: { provider: 'openai' } });
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.code).toBe('gateway_timeout');
    expect(body.error).toContain('timed out');
  });
});
