import { NextRequest, NextResponse } from 'next/server';

import {
  normalizeAndRedactError,
  validateCloudProxyAccess,
} from '@/lib/security/proxy';
import type { ProviderId } from '@/lib/schemas/provider';

export const dynamic = 'force-dynamic';

function modelsRequest(
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
    case 'gemini':
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        method: 'GET',
      };
    case 'anthropic':
      throw new Error('Anthropic does not support model discovery via API.');
    case 'ollama':
      throw new Error('Ollama models should be resolved locally.');
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const resolvedParams = await params;
  const access = validateCloudProxyAccess(req, resolvedParams.provider);
  if (!access.success) {
    return NextResponse.json(
      { error: 'unauthorized', code: access.error.code },
      { status: access.error.status },
    );
  }

  try {
    const { url, ...init } = modelsRequest(access.data.providerId, access.data.authorization);
    const timeoutSignal = AbortSignal.timeout(15_000);
    const signal = typeof AbortSignal.any === 'function'
      ? AbortSignal.any([req.signal, timeoutSignal])
      : req.signal;
    const upstreamResponse = await fetch(url, { ...init, signal });

    if (!upstreamResponse.ok) {
        return NextResponse.json({ error: 'upstream error' }, { status: upstreamResponse.status });
    }

    const data = await upstreamResponse.json();
    let models: { id: string; name: string }[] = [];

    if (access.data.providerId === 'openai') {
        models = (data.data || [])
            .map((model: any) => ({
                id: model.id,
                name: model.id,
            }))
            .sort((a: any, b: any) => a.id.localeCompare(b.id));
    } else if (access.data.providerId === 'gemini') {
        models = (data.models || [])
            .filter((model: any) => 
                model.supportedGenerationMethods?.includes('generateContent') || 
                model.supportedGenerationMethods?.includes('streamGenerateContent')
            )
            .map((model: any) => ({
                id: model.name.replace('models/', ''),
                name: model.displayName || model.name.replace('models/', ''),
            }))
            .sort((a: any, b: any) => a.id.localeCompare(b.id));
    }

    return NextResponse.json({ models });
  } catch (error) {
    const normalized = normalizeAndRedactError(error);
    return NextResponse.json(
        { error: normalized.error, code: normalized.code },
        { status: normalized.status }
    );
  }
}
