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
      // Query Google AI Studio Native Model Listing Endpoint
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        const errorText = await res.text();
        return new NextResponse(errorText, { status: res.status });
      }

      const data = await res.json();
      const models = (data.models || [])
        .map((m: any) => m.name.replace('models/', ''))
        .filter((name: string) => name.includes('gemini'));

      return NextResponse.json({ success: true, provider: 'gemini', models });
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

      return NextResponse.json({ success: true, provider: 'openai' });
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

      return NextResponse.json({ success: true, provider: 'anthropic' });
    }

    return NextResponse.json({ error: 'Unsupported provider: ' + provider }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Validation failed' }, { status: 500 });
  }
}
