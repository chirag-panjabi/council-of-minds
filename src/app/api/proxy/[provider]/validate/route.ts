import { NextRequest, NextResponse } from 'next/server';

import {
  normalizeAndRedactError,
  validateCloudProxyAccess,
} from '@/lib/security/proxy';
import type { ProviderId } from '@/lib/schemas/provider';

export const dynamic = 'force-dynamic';

type ValidationStatus =
  | 'valid'
  | 'invalid_key'
  | 'quota_exceeded'
  | 'connectivity_error'
  | 'provider_error';

interface ValidationResponse {
  status: ValidationStatus;
  retryable: boolean;
}

function validationRequest(
  providerId: ProviderId,
  authorization: string,
): RequestInit & { url: string } {
  const apiKey = authorization.replace(/^Bearer\s+/i, '');

  switch (providerId) {
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/models',
        method: 'GET',
        headers: { Authorization: authorization },
      };
    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/models?limit=1',
        method: 'GET',
        headers: {
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
        },
      };
    case 'gemini':
      return {
        url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey },
      };
    case 'ollama':
      throw new Error('Ollama must be validated through its direct local adapter.');
  }
}

function statusForProviderResponse(status: number): ValidationResponse {
  if (status === 401 || status === 403) {
    return { status: 'invalid_key', retryable: false };
  }

  if (status === 429) {
    return { status: 'quota_exceeded', retryable: true };
  }

  return { status: 'provider_error', retryable: status >= 500 };
}

function statusForTransportError(error: unknown): ValidationResponse {
  const normalized = normalizeAndRedactError(error);
  if (normalized.code === 'request_cancelled' || normalized.code === 'gateway_timeout') {
    return { status: 'connectivity_error', retryable: true };
  }

  return { status: 'connectivity_error', retryable: true };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } },
) {
  const access = validateCloudProxyAccess(req, params.provider);
  if (!access.success) {
    return NextResponse.json(
      { status: 'provider_error', retryable: false, code: access.error.code },
      { status: access.error.status },
    );
  }

  try {
    const { url, ...init } = validationRequest(access.data.providerId, access.data.authorization);
    const timeoutSignal = AbortSignal.timeout(15_000);
    const signal = typeof AbortSignal.any === 'function'
      ? AbortSignal.any([req.signal, timeoutSignal])
      : req.signal;
    const upstreamResponse = await fetch(url, { ...init, signal });

    if (upstreamResponse.ok) {
      return NextResponse.json({ status: 'valid', retryable: false } satisfies ValidationResponse);
    }

    const result = statusForProviderResponse(upstreamResponse.status);
    return NextResponse.json(result, { status: upstreamResponse.status });
  } catch (error) {
    const result = statusForTransportError(error);
    return NextResponse.json(result, { status: 503 });
  }
}
