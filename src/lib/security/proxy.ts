import { NextRequest } from 'next/server';
import { getProviderCapabilities } from '../providers/registry';
import { ProviderIdSchema, type ProviderId } from '../schemas/provider';

const MAX_REQUEST_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function isSameOrigin(req: NextRequest): boolean {
  let origin = req.headers.get('origin');
  const host = req.headers.get('host');
  
  if (!origin) {
    // GET requests often don't include an Origin header on same-origin requests.
    // Try to extract the origin from the Referer header as a fallback.
    const referer = req.headers.get('referer');
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        origin = refererUrl.origin;
      } catch {
        // invalid referer
      }
    }
  }

  if (!origin || !host) {
    // Strictly require origin (or referer) headers to ensure this is browser-driven.
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const expectedHost = host.split(':')[0];
    return originUrl.hostname === expectedHost;
  } catch {
    return false;
  }
}

export function isRequestTooLarge(req: NextRequest): boolean {
  const contentLength = req.headers.get('content-length');
  if (!contentLength) return false;
  
  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return false;
  
  return size > MAX_REQUEST_SIZE_BYTES;
}

export interface NormalizedError {
  error: string;
  code: string;
  status: number;
}

export interface CloudProxyAccess {
  providerId: ProviderId;
  authorization: string;
}

export interface CloudProxyAccessFailure {
  error: string;
  code: string;
  status: number;
}

export type CloudProxyAccessResult =
  | { success: true; data: CloudProxyAccess }
  | { success: false; error: CloudProxyAccessFailure };

function isErrorLike(value: unknown): value is { name: unknown; message: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'message' in value
  );
}

/**
 * Applies the shared boundary checks used by cloud generation and key
 * validation. Returned diagnostics are safe to show to a user.
 */
export function validateCloudProxyAccess(
  req: NextRequest,
  rawProviderId: string,
): CloudProxyAccessResult {
  if (!isSameOrigin(req)) {
    return {
      success: false,
      error: { error: 'Origin not allowed', code: 'origin_not_allowed', status: 403 },
    };
  }

  if (isRequestTooLarge(req)) {
    return {
      success: false,
      error: { error: 'Request body too large', code: 'request_too_large', status: 413 },
    };
  }

  const providerResult = ProviderIdSchema.safeParse(rawProviderId);
  if (!providerResult.success) {
    return {
      success: false,
      error: { error: 'Unsupported provider', code: 'unsupported_provider', status: 400 },
    };
  }

  const providerId = providerResult.data;
  if (getProviderCapabilities(providerId).capabilities.transport !== 'cloud-proxy') {
    return {
      success: false,
      error: {
        error: 'Provider must be accessed directly, not via proxy',
        code: 'direct_provider_required',
        status: 400,
      },
    };
  }

  const authorization = req.headers.get('Authorization');
  if (!authorization) {
    return {
      success: false,
      error: { error: 'Missing API key', code: 'missing_api_key', status: 401 },
    };
  }

  return { success: true, data: { providerId, authorization } };
}

/**
 * Normalizes an error and strips out sensitive details like API keys
 * that might accidentally be included in error messages.
 */
export function normalizeAndRedactError(err: unknown): NormalizedError {
  let message = 'An unknown error occurred';
  let status = 500;
  let code = 'internal_error';

  if (err instanceof Error || isErrorLike(err)) {
    message = String(err.message);
    const errName = String(err.name);
    // Check if it's a known error from fetch or stream
    if (errName === 'AbortError' || message.includes('abort')) {
      status = 499;
      code = 'request_cancelled';
      message = 'The request was cancelled.';
    } else if (errName === 'TimeoutError' || message.includes('timeout') || message.includes('timed out')) {
      status = 504;
      code = 'gateway_timeout';
      message = 'The upstream request timed out.';
    }
  } else if (typeof err === 'string') {
    message = err;
  } else if (typeof err === 'object' && err !== null) {
    // Handle Response objects
    if ('status' in err && 'statusText' in err) {
      status = Number((err as Record<string, unknown>).status) || 500;
      message = String((err as Record<string, unknown>).statusText) || 'Unknown response error';
      code = 'provider_error';
      if (status === 401) {
        message = 'Invalid API key or authentication failed.';
        code = 'invalid_api_key';
      } else if (status === 429) {
        message = 'Rate limit exceeded.';
        code = 'rate_limit_exceeded';
      }
    }
  }

  // Redact potential API keys (simple heuristic: look for "sk-..." or "Bearer ...")
  const redactedMessage = message
    .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9\-\._~+/]+=*/gi, 'Bearer [REDACTED]');

  return {
    error: redactedMessage,
    code,
    status
  };
}
