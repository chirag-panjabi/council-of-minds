'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, Power, Layers } from 'lucide-react';
import { ModelProvider } from '@/components/ui/DynamicModelSelector';

/* Hallmark · component: ModelFallbackManager · genre: studio · theme: studio · spec: spec_settings.md (§7.4) */

export interface FallbackConfig {
  isEnabled: boolean;
  chains: Record<string, string[]>;
}

export const DEFAULT_FALLBACK_CHAINS: Record<string, string[]> = {
  // OpenAI
  'gpt-4o': ['gpt-4o-mini', 'gpt-3.5-turbo'],
  'o3-mini': ['gpt-4o-mini'],
  'o1': ['gpt-4o', 'gpt-4o-mini'],

  // Anthropic
  'claude-3-7-sonnet-20250219': ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  'claude-3-5-sonnet-20241022': ['claude-3-5-haiku-20241022'],
  'claude-3-opus-20240229': ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],

  // Gemini
  'gemini-2.5-flash': ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  'gemini-1.5-pro': ['gemini-2.5-flash', 'gemini-2.0-flash'],
};

export function ModelFallbackManager() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [chains, setChains] = useState<Record<string, string[]>>(DEFAULT_FALLBACK_CHAINS);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('framework-engine:fallback-chains');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.isEnabled === 'boolean') setIsEnabled(parsed.isEnabled);
          if (parsed.chains) setChains(parsed.chains);
        } catch {
          // Fallback to default
        }
      }
    }
  }, []);

  const saveConfig = (newEnabled: boolean, newChains: Record<string, string[]>) => {
    setIsEnabled(newEnabled);
    setChains(newChains);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'framework-engine:fallback-chains',
        JSON.stringify({ isEnabled: newEnabled, chains: newChains })
      );
    }
  };

  const handleToggleEnabled = () => {
    saveConfig(!isEnabled, chains);
  };

  const handleResetDefaults = () => {
    saveConfig(true, DEFAULT_FALLBACK_CHAINS);
  };

  const currentChain = chains[selectedModel] || [];

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Automated Model Fallback & Failover Priority
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Configure automatic backup model chains when primary model APIs return rate limit (429) or server errors (500, 503).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleEnabled}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              isEnabled
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isEnabled ? 'Failover Active' : 'Failover Disabled'}
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            title="Reset Default Chains"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Selector & Priority Chain Display */}
      <div className="space-y-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[var(--color-ink-muted)] uppercase">Select Primary Model:</span>
          {Object.keys(DEFAULT_FALLBACK_CHAINS).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedModel(m)}
              className={`px-2.5 py-1 rounded text-xs border transition-all ${
                selectedModel === m
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] font-semibold'
                  : 'bg-[var(--color-paper)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Fallback Priority Chain Viz */}
        <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
          <div className="text-[10px] uppercase text-[var(--color-ink-muted)] tracking-wider">
            Execution Failover Sequence for <span className="text-[var(--color-ink)] font-bold">{selectedModel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] text-[var(--color-accent)] font-bold rounded">
              Primary: {selectedModel}
            </span>

            {currentChain.length > 0 ? (
              currentChain.map((fallback, idx) => (
                <React.Fragment key={fallback}>
                  <ArrowRight className="w-4 h-4 text-[var(--color-ink-muted)]" />
                  <span className="px-3 py-1.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] rounded flex items-center gap-1.5">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      Backup #{idx + 1}
                    </span>
                    {fallback}
                  </span>
                </React.Fragment>
              ))
            ) : (
              <span className="text-zinc-500 italic text-xs">No fallbacks configured</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
