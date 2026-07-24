'use client';

import { useState, useEffect } from 'react';
import { Cpu, RefreshCw, Layers } from 'lucide-react';

/* Hallmark · component: DynamicModelSelector · genre: editorial · theme: studio */

export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface ModelOption {
  id: string;
  name: string;
  provider: ModelProvider;
  description?: string;
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
      if (modelId.startsWith('gemini')) return 'gemini';
      if (modelId.startsWith('claude')) return 'anthropic';
      if (modelId.startsWith('ollama') || modelId.includes(':') || modelId.includes('llama')) return 'ollama';
      if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) return 'openai';
    }
    if (typeof window !== 'undefined') {
      const savedProvider = localStorage.getItem('framework-engine:default-provider') as ModelProvider;
      if (savedProvider) return savedProvider;
    }
    return 'openai';
  };

  const [provider, setProvider] = useState<ModelProvider>(() => inferProvider(value));
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!res.ok) throw new Error('Failed to load models');

      const data = await res.json();
      const fetchedModels: ModelOption[] = data.models || [];

      setModels(fetchedModels);

      // If current value is not in fetched models, select the first available model
      if (fetchedModels.length > 0) {
        const hasCurrentValue = fetchedModels.some((m) => m.id === value);
        if (!hasCurrentValue) {
          onChange(fetchedModels[0].id, targetProvider);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching models');
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
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
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
