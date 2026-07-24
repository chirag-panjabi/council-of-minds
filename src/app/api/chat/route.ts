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

    const body = await req.json();
    const { model, messages, systemPrompt, temperature = 0.7 } = body;

    // Build payload messages including system prompt
    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          messages: fullMessages,
          stream: true,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new NextResponse(errorText, { status: response.status });
      }

      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (provider === 'anthropic') {
      const anthropicMessages = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-5-sonnet-20241022',
          system: systemPrompt || undefined,
          messages: anthropicMessages,
          max_tokens: 4096,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new NextResponse(errorText, { status: response.status });
      }

      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (provider === 'gemini') {
      let geminiModel = model || 'gemini-1.5-pro';
      if (geminiModel === 'gemini-1.5-flash') {
        geminiModel = 'gemini-1.5-flash-latest';
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          contents,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new NextResponse(errorText, { status: response.status });
      }

      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported provider: ' + provider }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal proxy error' }, { status: 500 });
  }
}
