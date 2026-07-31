'use client';

import { Cpu, Gauge } from 'lucide-react';
import { getModelCapability } from '@/lib/utils/providerCapabilities';

/* Hallmark · component: SystemPromptTokenMeter · genre: studio · theme: studio · spec: spec_settings.md (§7.3) */

interface SystemPromptTokenMeterProps {
  systemPrompt: string;
  modelId?: string;
  maxContextTokens?: number;
  className?: string;
}

export function SystemPromptTokenMeter({
  systemPrompt,
  modelId = 'gpt-4o',
  maxContextTokens,
  className = '',
}: SystemPromptTokenMeterProps) {
  const cap = maxContextTokens || getModelCapability(modelId).maxContextTokens || 128000;
  
  // Approximate tokens count (~4 chars per token for English text)
  const charCount = systemPrompt.length;
  const estimatedTokens = Math.ceil(charCount / 4);
  const percentage = Math.min(100, Math.max(0.1, (estimatedTokens / cap) * 100));

  // Determine meter status color
  let barColorClass = 'bg-emerald-500';
  let badgeColorClass = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
  if (percentage > 50) {
    barColorClass = 'bg-amber-500';
    badgeColorClass = 'text-amber-600 bg-amber-500/10 border-amber-500/30';
  }
  if (percentage > 85) {
    barColorClass = 'bg-red-500';
    badgeColorClass = 'text-red-600 bg-red-500/10 border-red-500/30';
  }

  return (
    <div className={`p-3 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] space-y-2 font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[var(--color-ink)]">
          <Gauge className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            System Prompt Token Meter
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-ink-muted)]">
            {charCount.toLocaleString()} chars
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${badgeColorClass}`}>
            ~{estimatedTokens.toLocaleString()} / {(cap / 1000).toFixed(0)}k Tokens ({percentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Meter Bar Track */}
      <div className="h-1.5 w-full bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
