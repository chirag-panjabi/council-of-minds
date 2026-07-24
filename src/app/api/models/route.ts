import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama';
  description?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = (searchParams.get('provider') || req.headers.get('x-provider') || 'openai') as 'openai' | 'anthropic' | 'gemini' | 'ollama';
    const apiKey = searchParams.get('key') || req.headers.get('x-api-key') || '';

    if (provider === 'gemini') {
      if (!apiKey) {
        return NextResponse.json({
          provider: 'gemini',
          models: [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini' },
          ],
        });
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.statusText}`);
      }

      const data = await res.json();
      const rawModels = data.models || [];
      const models: ModelOption[] = rawModels
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => {
          const id = m.name.replace('models/', '');
          return {
            id,
            name: m.displayName || id,
            provider: 'gemini',
            description: m.description,
          };
        });

      return NextResponse.json({ provider: 'gemini', models });
    }

    if (provider === 'openai') {
      if (!apiKey) {
        return NextResponse.json({
          provider: 'openai',
          models: [
            { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
            { id: 'o3-mini', name: 'o3-mini', provider: 'openai' },
          ],
        });
      }

      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.statusText}`);
      }

      const data = await res.json();
      const models: ModelOption[] = (data.data || [])
        .filter((m: any) => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
        .map((m: any) => ({
          id: m.id,
          name: m.id,
          provider: 'openai',
        }))
        .sort((a: ModelOption, b: ModelOption) => a.id.localeCompare(b.id));

      return NextResponse.json({ provider: 'openai', models });
    }

    if (provider === 'anthropic') {
      return NextResponse.json({
        provider: 'anthropic',
        models: [
          { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
          { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
          { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic' },
          { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
        ],
      });
    }

    if (provider === 'ollama') {
      const ollamaUrl = searchParams.get('ollamaUrl') || 'http://localhost:11434';
      const res = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);

      if (!res || !res.ok) {
        return NextResponse.json({
          provider: 'ollama',
          models: [{ id: 'ollama-local', name: 'Ollama Local (Offline)', provider: 'ollama' }],
        });
      }

      const data = await res.json();
      const models: ModelOption[] = (data.models || []).map((m: any) => ({
        id: m.name,
        name: `${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(1)} GB)`,
        provider: 'ollama',
      }));

      return NextResponse.json({ provider: 'ollama', models });
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch models' }, { status: 500 });
  }
}
