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

    const fullMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

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
          stream_options: { include_usage: true },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new NextResponse(errorText, { status: response.status });
      }

      let buffer = '';
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(dataStr);
                const text = parsed.choices?.[0]?.delta?.content;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
                if (parsed.usage) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    usage: {
                      promptTokens: parsed.usage.prompt_tokens || 0,
                      completionTokens: parsed.usage.completion_tokens || 0,
                    }
                  })}\n\n`));
                }
              } catch {}
            }
          }
        },
        flush(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        },
      });

      return new NextResponse(response.body!.pipeThrough(transformStream), {
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

      let buffer = '';
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
                if (parsed.type === 'message_delta' && parsed.usage) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    usage: {
                      promptTokens: 0,
                      completionTokens: parsed.usage.output_tokens || 0,
                    }
                  })}\n\n`));
                }
              } catch {}
            }
          }
        },
        flush(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        },
      });

      return new NextResponse(response.body!.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (provider === 'gemini') {
      const geminiModel = model || 'gemini-2.5-flash';
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

      let buffer = '';
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const parsed = JSON.parse(dataStr);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                }
                if (parsed.usageMetadata) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    usage: {
                      promptTokens: parsed.usageMetadata.promptTokenCount || 0,
                      completionTokens: parsed.usageMetadata.candidatesTokenCount || 0,
                    }
                  })}\n\n`));
                }
              } catch {}
            }
          }
        },
        flush(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        },
      });

      return new NextResponse(response.body!.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    if (provider === 'ollama') {
      const ollamaUrl = req.headers.get('x-ollama-url') || 'http://localhost:11434';
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'llama3',
          prompt: messages[messages.length - 1]?.content || '',
          system: systemPrompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new NextResponse(errorText, { status: response.status });
      }

      let buffer = '';
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const text = parsed.response;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
              if (parsed.prompt_eval_count || parsed.eval_count) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  usage: {
                    promptTokens: parsed.prompt_eval_count || 0,
                    completionTokens: parsed.eval_count || 0,
                  }
                })}\n\n`));
              }
            } catch {}
          }
        },
        flush(controller) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        },
      });

      return new NextResponse(response.body!.pipeThrough(transformStream), {
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
