'use client';

import { useState } from 'react';
import { Key, CheckCircle2, Sparkles } from 'lucide-react';

/* Hallmark · component: UnifiedKeyManager · genre: studio · theme: studio · spec: spec_onboarding.md (§10.2) */

interface UnifiedKeyManagerProps {
  onAppliedKeys?: (keys: { openai: string; anthropic: string; gemini: string; openrouter: string }) => void;
  className?: string;
}

export function UnifiedKeyManager({ onAppliedKeys, className = '' }: UnifiedKeyManagerProps) {
  const [unifiedKey, setUnifiedKey] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleApplyUnifiedKey = () => {
    const key = unifiedKey.trim();
    if (!key) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('framework-engine:api-key:openrouter', key);
      localStorage.setItem('framework-engine:api-key:openai', key);
      localStorage.setItem('framework-engine:api-key:anthropic', key);
      localStorage.setItem('framework-engine:api-key:gemini', key);
      localStorage.setItem('framework-engine:default-provider', 'openrouter');
      localStorage.setItem('framework-engine:default-model', 'openrouter/auto');
    }

    if (onAppliedKeys) {
      onAppliedKeys({
        openai: key,
        anthropic: key,
        gemini: key,
        openrouter: key,
      });
    }

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <div className={`p-4 bg-[var(--color-accent-subtle)]/40 border border-[var(--color-accent)]/30 rounded-[var(--radius-md)] space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--color-accent)]">
          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
          Unified Gateway Key (OpenRouter / Universal Router)
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
          1-Click Global Config
        </span>
      </div>

      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
        Using a multi-provider router like OpenRouter? Enter your single key below to instantly populate key slots across OpenAI, Anthropic, Gemini, and OpenRouter models.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="password"
            value={unifiedKey}
            onChange={(e) => setUnifiedKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full px-3 py-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
          />
        </div>

        <button
          type="button"
          onClick={handleApplyUnifiedKey}
          disabled={!unifiedKey.trim()}
          className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none disabled:opacity-40 whitespace-nowrap"
        >
          {isSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Key Applied to All!
            </>
          ) : (
            <>
              <Key className="w-3.5 h-3.5" /> Apply Key to All Providers
            </>
          )}
        </button>
      </div>
    </div>
  );
}
