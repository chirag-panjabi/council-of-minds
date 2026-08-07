'use client';

import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Layers } from 'lucide-react';
import { getModelCapability } from '@/lib/utils/providerCapabilities';

/* Hallmark · component: DynamicModelSelector · genre: editorial · theme: studio */

export type ModelProvider = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'mock';

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
}

export const DEFAULT_FALLBACK_MODELS: Record<ModelProvider, ModelOption[]> = {
  openrouter: [
    { id: 'openrouter/auto', name: 'OpenRouter Auto (Router)', provider: 'openrouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenRouter)', provider: 'openrouter' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', provider: 'openrouter' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (OpenRouter)', provider: 'openrouter' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (OpenRouter)', provider: 'openrouter' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', provider: 'openrouter' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
    { id: 'o3-mini', name: 'o3-mini', provider: 'openai' },
    { id: 'o1', name: 'o1', provider: 'openai' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'gemini' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini' },
  ],
  ollama: [
    { id: 'llama3:latest', name: 'Llama 3 (Ollama)', provider: 'ollama' },
    { id: 'mistral:latest', name: 'Mistral (Ollama)', provider: 'ollama' },
  ],
  mock: [
    { id: 'mock-dialectic', name: 'Mock Dialectic Engine (Zero API Key)', provider: 'mock', description: 'Simulated response stream for offline dry-run testing' },
  ],
};

export function resolveModelOptions(
  provider: ModelProvider,
  fetchedModels: ModelOption[],
  currentValue?: string
): ModelOption[] {
  const defaults = DEFAULT_FALLBACK_MODELS[provider] || [];
  const map = new Map<string, ModelOption>();

  // Add default fallback models
  defaults.forEach((m) => map.set(m.id, m));

  // Add fetched live models (overriding defaults if matching ID)
  fetchedModels.forEach((m) => map.set(m.id, m));

  // Preserve custom current value if set
  if (currentValue && !map.has(currentValue)) {
    map.set(currentValue, {
      id: currentValue,
      name: `${currentValue} (Custom)`,
      provider,
    });
  }

  return Array.from(map.values());
}

interface DynamicModelSelectorProps {
  value: string;
  onChange: (modelId: string, provider: ModelProvider) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function DynamicModelSelector({
  value,
  onChange,
  size = 'sm',
  className = '',
}: DynamicModelSelectorProps) {
  // Infer initial provider from model ID or localStorage default
  const inferProvider = (modelId: string): ModelProvider => {
    if (modelId) {
      if (modelId.startsWith('openrouter') || modelId.includes('/') || modelId.includes('deepseek') || modelId.includes('meta-llama')) return 'openrouter';
      if (modelId.startsWith('gemini')) return 'gemini';
      if (modelId.startsWith('claude')) return 'anthropic';
      if (modelId.startsWith('ollama') || modelId.includes(':') || modelId.includes('llama')) return 'ollama';
      if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) return 'openai';
    }
    if (typeof window !== 'undefined') {
      const savedProvider = localStorage.getItem('framework-engine:default-provider') as ModelProvider;
      if (savedProvider) return savedProvider;
    }
    return 'openrouter';
  };

  const [provider, setProvider] = useState<ModelProvider>(() => inferProvider(value));
  const [models, setModels] = useState<ModelOption[]>(() => resolveModelOptions(inferProvider(value), [], value));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const inferred = inferProvider(value);
      setProvider(inferred);
    }
  }, [value]);

  const fetchLiveModels = async (targetProvider: ModelProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = localStorage.getItem(`framework-engine:api-key:${targetProvider}`) || '';
      const ollamaUrl = localStorage.getItem('framework-engine:ollama-url') || 'http://localhost:11434';

      const queryParams = new URLSearchParams({
        provider: targetProvider,
        key: apiKey,
        ollamaUrl,
      });

      const res = await fetch(`/api/models?${queryParams.toString()}`);
      let fetchedModels: ModelOption[] = [];

      if (res.ok) {
        const data = await res.json();
        fetchedModels = data.models || [];
      }

      const mergedOptions = resolveModelOptions(targetProvider, fetchedModels, value);
      setModels(mergedOptions);

      // If current value is not in resolved options, select first model
      if (mergedOptions.length > 0) {
        const hasCurrentValue = mergedOptions.some((m) => m.id === value);
        if (!hasCurrentValue) {
          onChange(mergedOptions[0].id, targetProvider);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching models');
      setModels(resolveModelOptions(targetProvider, [], value));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveModels(provider);
  }, [provider]);

  const handleProviderChange = (newProvider: ModelProvider) => {
    setProvider(newProvider);
  };

  const handleModelChange = (newModelId: string) => {
    onChange(newModelId, provider);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Provider Select */}
      <div className="flex items-center gap-1 bg-[var(--color-paper)] border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-sm)] shadow-2xs">
        <Layers className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
          aria-label="Select AI Model Provider"
          className="bg-transparent text-xs font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer uppercase font-semibold"
        >
          <option value="openrouter">OpenRouter</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Google Gemini</option>
          <option value="ollama">Ollama Local</option>
        </select>
      </div>

      {/* Real-Time Live Models Select */}
      <div
        aria-busy={isLoading}
        className="flex items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-sm)] shadow-2xs relative"
      >
        <Cpu className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
        <select
          value={value}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={isLoading || models.length === 0}
          aria-label="Select dynamic live AI model"
          className="bg-transparent text-xs font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer max-w-[160px] truncate"
        >
          {isLoading ? (
            <option value="">Fetching live models...</option>
          ) : models.length === 0 ? (
            <option value={value}>{value} (Offline)</option>
          ) : (
            models.map((m) => {
              const cap = getModelCapability(m.id, m.provider);
              const ctxLabel = cap.maxContextTokens >= 1000000 ? `${(cap.maxContextTokens / 1000000).toFixed(0)}M` : `${Math.round(cap.maxContextTokens / 1000)}k`;
              const visLabel = cap.supportsVision ? ' 👁' : '';
              return (
                <option key={m.id} value={m.id}>
                  {m.name} [{ctxLabel}{visLabel}]
                </option>
              );
            })
          )}
        </select>

        {/* Live Refresh Trigger */}
        <button
          type="button"
          onClick={() => fetchLiveModels(provider)}
          disabled={isLoading}
          aria-label="Refresh live available models from provider"
          className="p-0.5 text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] transition-colors"
          title="Re-query live models from provider API"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[var(--color-accent)]' : ''}`} />
        </button>
      </div>
    </div>
  );
}
