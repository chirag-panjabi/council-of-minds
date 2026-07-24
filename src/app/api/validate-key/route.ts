import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const provider = req.headers.get('x-provider') || 'openai';
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey && provider !== 'ollama') {
      return NextResponse.json(
        { error: 'Missing API Key for provider: ' + provider },
        { status: 401 }
      );
    }

    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        const errorText = await res.text();
        return new NextResponse(errorText, { status: res.status });
      }

      const data = await res.json();
      const rawModels = data.models || [];
      const modelNames = rawModels
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));

      return NextResponse.json({
        success: true,
        provider: 'gemini',
        modelCount: modelNames.length,
        modelNames: modelNames.slice(0, 5),
      });
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!res.ok) {
        const errorText = await res.text();
        return new NextResponse(errorText, { status: res.status });
      }

      const data = await res.json();
      const modelNames = (data.data || [])
        .filter((m: any) => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
        .map((m: any) => m.id);

      return NextResponse.json({
        success: true,
        provider: 'openai',
        modelCount: modelNames.length,
        modelNames: modelNames.slice(0, 5),
      });
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      if (!res.ok && res.status !== 200) {
        const errorText = await res.text();
        return new NextResponse(errorText, { status: res.status });
      }

      return NextResponse.json({
        success: true,
        provider: 'anthropic',
        modelCount: 4,
        modelNames: ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-7-sonnet', 'claude-3-opus'],
      });
    }

    if (provider === 'ollama') {
      const ollamaUrl = req.headers.get('x-ollama-url') || 'http://localhost:11434';
      const res = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);

      if (!res || !res.ok) {
        return NextResponse.json(
          { error: 'Ollama local server not reachable at ' + ollamaUrl },
          { status: 503 }
        );
      }

      const data = await res.json();
      const modelNames = (data.models || []).map((m: any) => m.name);

      return NextResponse.json({
        success: true,
        provider: 'ollama',
        modelCount: modelNames.length,
        modelNames: modelNames.slice(0, 5),
      });
    }

    return NextResponse.json({ error: 'Unsupported provider: ' + provider }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Validation failed' }, { status: 500 });
  }
}
