import { NextRequest, NextResponse } from 'next/server';
import { redactSensitiveData } from '@/lib/utils/redact';

export const runtime = 'edge';

export interface ModelOption {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter';
  description?: string;
}

const FALLBACK_ANTHROPIC_MODELS: ModelOption[] = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = (searchParams.get('provider') || req.headers.get('x-provider') || 'openai') as
      | 'openai'
      | 'anthropic'
      | 'gemini'
      | 'ollama'
      | 'openrouter';
    const apiKey = searchParams.get('key') || req.headers.get('x-api-key') || '';

    if (provider === 'openrouter') {
      const headers: Record<string, string> = {};
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      try {
        const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
        if (res.ok) {
          const data = await res.json();
          const rawModels = data.data || [];
          const models: ModelOption[] = rawModels.map((m: any) => ({
            id: m.id,
            name: m.name || m.id,
            provider: 'openrouter',
            description: m.description,
          }));

          if (!models.some((m) => m.id === 'openrouter/auto')) {
            models.unshift({
              id: 'openrouter/auto',
              name: 'OpenRouter Auto (Dynamic Router)',
              provider: 'openrouter',
            });
          }

          return NextResponse.json({ provider: 'openrouter', models });
        }
      } catch {
        // Fallback below
      }

      return NextResponse.json({
        provider: 'openrouter',
        models: [
          { id: 'openrouter/auto', name: 'OpenRouter Auto (Dynamic Router)', provider: 'openrouter' },
          { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', provider: 'openrouter' },
          { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', provider: 'openrouter' },
          { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OpenRouter)', provider: 'openrouter' },
          { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (OpenRouter)', provider: 'openrouter' },
          { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', provider: 'openrouter' },
        ],
      });
    }

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
      if (!apiKey) {
        return NextResponse.json({
          provider: 'anthropic',
          models: FALLBACK_ANTHROPIC_MODELS,
        });
      }

      try {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        });

        if (res.ok) {
          const data = await res.json();
          const models: ModelOption[] = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.display_name || m.id,
            provider: 'anthropic',
          }));
          return NextResponse.json({ provider: 'anthropic', models });
        }
      } catch {
        // Fallback on network/CORS error
      }

      return NextResponse.json({
        provider: 'anthropic',
        models: FALLBACK_ANTHROPIC_MODELS,
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
    const sanitizedError = redactSensitiveData(err.message || 'Failed to fetch models');
    return NextResponse.json({ error: sanitizedError }, { status: 500 });
  }
}
