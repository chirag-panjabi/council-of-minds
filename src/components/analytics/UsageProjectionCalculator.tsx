'use client';

import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Calendar, Cpu } from 'lucide-react';
import { getModelPricing } from '@/app/analytics/page';

/* Hallmark · component: UsageProjectionCalculator · genre: studio · theme: studio · spec: spec_analytics.md (§8.3) */

export function UsageProjectionCalculator() {
  const [turnsPerDay, setTurnsPerDay] = useState<number>(10);
  const [avgPromptTokens, setAvgPromptTokens] = useState<number>(1200);
  const [avgCompletionTokens, setAvgCompletionTokens] = useState<number>(500);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [retentionMode, setRetentionMode] = useState<'stateless' | 'summary' | 'infinite'>('summary');

  // Multiplier factor for context window accumulation
  const retentionMultiplier = retentionMode === 'stateless' ? 1.0 : retentionMode === 'summary' ? 1.4 : 2.5;

  const dailyPromptTokens = turnsPerDay * avgPromptTokens * retentionMultiplier;
  const dailyCompletionTokens = turnsPerDay * avgCompletionTokens;
  const dailyTotalTokens = dailyPromptTokens + dailyCompletionTokens;

  const pricing = getModelPricing(selectedModel);

  const dailyCost = (dailyPromptTokens / 1000) * pricing.input + (dailyCompletionTokens / 1000) * pricing.output;
  const monthlyCost = dailyCost * 30;
  const yearlyCost = dailyCost * 365;

  const monthlyTotalTokens = dailyTotalTokens * 30;
  const yearlyTotalTokens = dailyTotalTokens * 365;

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Cost & Usage Projection Calculator
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Forecast future token consumption and BYOK API spend based on conversation rate and model targets.
          </p>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        {/* Input 1: Turns Per Day */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center justify-between">
            <span>Turns Per Day</span>
            <span className="text-[var(--color-accent)] font-semibold">{turnsPerDay} Turns</span>
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={turnsPerDay}
            onChange={(e) => setTurnsPerDay(Number(e.target.value))}
            className="w-full text-[var(--color-accent)] accent-[var(--color-accent)]"
          />
          <div className="flex items-center justify-between text-[9px] text-[var(--color-ink-muted)]">
            <span>1 turn/day</span>
            <span>100 turns/day</span>
          </div>
        </div>

        {/* Input 2: Target Model */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider block">
            Target Model Engine
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)]"
          >
            <option value="gpt-4o">OpenAI GPT-4o ($0.005 / $0.015)</option>
            <option value="gpt-4o-mini">OpenAI GPT-4o Mini ($0.00015 / $0.0006)</option>
            <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet ($0.003 / $0.015)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash ($0.0001 / $0.0004)</option>
            <option value="ollama-local">Local Ollama ($0.00 / Free)</option>
          </select>
        </div>

        {/* Input 3: Retention Strategy */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider block">
            Context Retention Mode
          </label>
          <select
            value={retentionMode}
            onChange={(e) => setRetentionMode(e.target.value as any)}
            className="w-full px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)]"
          >
            <option value="stateless">Stateless (Single Turn Only)</option>
            <option value="summary">Summary-Buffered (Default 1.4x)</option>
            <option value="infinite">Infinite Window (Cumulative 2.5x)</option>
          </select>
        </div>
      </div>

      {/* Projection Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        {/* Daily Projection */}
        <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase">1-Day Forecast</div>
          <div className="text-xl font-bold text-[var(--color-ink)]">
            {selectedModel === 'ollama-local' ? '$0.00' : `$${dailyCost.toFixed(4)}`}
          </div>
          <div className="text-[10px] text-[var(--color-ink-muted)]">
            ~{Math.round(dailyTotalTokens).toLocaleString()} Tokens
          </div>
        </div>

        {/* Monthly Projection */}
        <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase">30-Day Monthly Forecast</div>
          <div className="text-xl font-bold text-[var(--color-accent)]">
            {selectedModel === 'ollama-local' ? '$0.00' : `$${monthlyCost.toFixed(2)}`}
          </div>
          <div className="text-[10px] text-[var(--color-ink-muted)]">
            ~{Math.round(monthlyTotalTokens).toLocaleString()} Tokens
          </div>
        </div>

        {/* Yearly Projection */}
        <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase">365-Day Annual Forecast</div>
          <div className="text-xl font-bold text-emerald-600">
            {selectedModel === 'ollama-local' ? '$0.00' : `$${yearlyCost.toFixed(2)}`}
          </div>
          <div className="text-[10px] text-[var(--color-ink-muted)]">
            ~{Math.round(yearlyTotalTokens).toLocaleString()} Tokens
          </div>
        </div>
      </div>
    </div>
  );
}
