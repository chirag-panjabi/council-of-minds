import { NextRequest, NextResponse } from 'next/server';
import { normalizeAndRedactError, validateCloudProxyAccess } from '@/lib/security/proxy';

// Prevent Next.js from aggressively caching this route
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const resolvedParams = await params;
    const access = validateCloudProxyAccess(req, resolvedParams.provider);
    if (!access.success) {
      return NextResponse.json({ error: access.error.error }, { status: access.error.status });
    }
    const { providerId, authorization: apiKey } = access.data;

    // 4b. Validate basic JSON schema
    let bodyText = await req.text();
    let jsonBody;
    try {
      jsonBody = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Determine upstream URL based on provider
    // In a real implementation, the upstream URL and exact mapping depends on the exact model/provider.
    // Here we'll do a simple switch based on the registry.
    let upstreamUrl = '';
    let upstreamHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
    };

    switch (providerId) {
      case 'openai':
        upstreamUrl = 'https://api.openai.com/v1/chat/completions';
        break;
      case 'anthropic':
        upstreamUrl = 'https://api.anthropic.com/v1/messages';
        // Anthropic uses x-api-key instead of standard Bearer
        upstreamHeaders = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.replace('Bearer ', ''),
          'anthropic-version': '2023-06-01',
        };
        break;
      case 'gemini':
        // Gemini URL depends on the model. We expect the client to pass the model in the body,
        // or a specific route. For MVP, we'll route to a generic base or require it in a query param.
        // Actually, Gemini typically uses keys in the query string `?key=...`.
        // The client will need to pass the model in the request, and we'll construct the URL.
        if (!jsonBody.model) {
          return NextResponse.json({ error: 'Model required for Gemini proxy' }, { status: 400 });
        }
        
        let model = jsonBody.model;
        const originalModel = model;
        
        // Remove 'models/' prefix if present for our checks
        if (typeof model === 'string' && model.startsWith('models/')) {
          model = model.replace('models/', '');
        }

        // Transparently upgrade deprecated models
        if (model === 'gemini-2.5-flash-lite' || model === 'gemini-1.5-flash-lite') {
          model = 'gemini-2.5-flash';
        }
        
        const key = apiKey.replace('Bearer ', '');
        // The URL needs the model without the models/ prefix since we hardcode it in the path
        upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;
        delete upstreamHeaders['Authorization'];
        
        // Re-serialize body if we modified the model (we put back the original prefix if we upgraded, or just use the new model without prefix, both work but it's safer to just set to what we resolved)
        if (model !== originalModel && originalModel !== `models/${model}`) {
          // If the model actually changed (e.g. from flash-lite to flash), 
          // we update the jsonBody. Google API actually doesn't strictly need it in the body for REST, but AI SDK might.
          // AI SDK usually sends the model in the payload for generateContent.
          jsonBody.model = model;
          bodyText = JSON.stringify(jsonBody);
        }
        break;
      default:
        return NextResponse.json({ error: 'Upstream routing not configured for provider' }, { status: 501 });
    }

    // 5. Proxy the request upstream
    // Combine client disconnect signal with a 60-second timeout
    const timeoutSignal = AbortSignal.timeout(60000);
    const abortSignal = typeof AbortSignal.any === 'function'
      ? AbortSignal.any([req.signal, timeoutSignal])
      : req.signal;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: upstreamHeaders,
      body: bodyText,
      signal: abortSignal,
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      throw new Error(`Upstream error: ${upstreamResponse.status} ${errorText}`);
    }

    // 6. Return streamed response
    // We do NOT log, cache, or persist this stream.
    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('Content-Type') || 'text/event-stream',
      },
    });
  } catch (error) {
    const normalized = normalizeAndRedactError(error);
    return NextResponse.json(
      { error: normalized.error, code: normalized.code },
      { status: normalized.status }
    );
  }
}
