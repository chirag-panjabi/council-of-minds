'use client';

import React, { useState } from 'react';
import { Cpu, Zap, DollarSign, ArrowUpDown, Award, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { getModelPricing } from '@/app/analytics/page';

/* Hallmark · component: ModelEfficiencyMatrix · genre: studio · theme: studio · spec: spec_analytics.md (§8.5) */

interface ModelStats {
  model: string;
  turns: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  cost: number;
}

export function ModelEfficiencyMatrix() {
  const [sortBy, setSortBy] = useState<'turns' | 'tokens' | 'latency' | 'cost'>('turns');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];

  const statsMap: Record<string, ModelStats> = {};

  usageRecords.forEach((r) => {
    const model = r.model || 'unknown';
    if (!statsMap[model]) {
      statsMap[model] = {
        model,
        turns: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalLatencyMs: 0,
        avgLatencyMs: 0,
        cost: 0,
      };
    }

    const prompt = r.promptTokens || 0;
    const completion = r.completionTokens || 0;
    const latency = (r as any).latencyMs || 0;
    const pricing = getModelPricing(model);
    const cost = (prompt / 1000) * pricing.input + (completion / 1000) * pricing.output;

    statsMap[model].turns += 1;
    statsMap[model].promptTokens += prompt;
    statsMap[model].completionTokens += completion;
    statsMap[model].totalTokens += prompt + completion;
    statsMap[model].totalLatencyMs += latency;
    statsMap[model].cost += cost;
  });

  const modelList = Object.values(statsMap).map((m) => ({
    ...m,
    avgLatencyMs: m.turns > 0 ? Math.round(m.totalLatencyMs / m.turns) : 0,
  }));

  // Standard fallback models if no live telemetry exists yet
  if (modelList.length === 0) {
    const defaultModels = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-2.5-flash', 'ollama-local'];
    defaultModels.forEach((model) => {
      const pricing = getModelPricing(model);
      modelList.push({
        model,
        turns: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalLatencyMs: 0,
        avgLatencyMs: 0,
        cost: 0,
      });
    });
  }

  modelList.sort((a, b) => {
    let valA = a.turns;
    let valB = b.turns;
    if (sortBy === 'tokens') {
      valA = a.totalTokens;
      valB = b.totalTokens;
    } else if (sortBy === 'latency') {
      valA = a.avgLatencyMs;
      valB = b.avgLatencyMs;
    } else if (sortBy === 'cost') {
      valA = a.cost;
      valB = b.cost;
    }
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSort = (field: 'turns' | 'tokens' | 'latency' | 'cost') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Model-by-Model Efficiency Comparison Matrix
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Side-by-side performance audit comparing model latency, token efficiency, unit rate pricing, and spend.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-hairline)] text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
              <th className="pb-3 font-semibold">Model Target</th>
              <th
                className="pb-3 font-semibold text-right cursor-pointer hover:text-[var(--color-ink)]"
                onClick={() => toggleSort('turns')}
              >
                <span className="inline-flex items-center gap-1">
                  Turns <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th
                className="pb-3 font-semibold text-right cursor-pointer hover:text-[var(--color-ink)]"
                onClick={() => toggleSort('tokens')}
              >
                <span className="inline-flex items-center gap-1">
                  Total Tokens <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th
                className="pb-3 font-semibold text-right cursor-pointer hover:text-[var(--color-ink)]"
                onClick={() => toggleSort('latency')}
              >
                <span className="inline-flex items-center gap-1">
                  Avg Latency <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="pb-3 font-semibold text-right">Unit Rate (In / Out)</th>
              <th
                className="pb-3 font-semibold text-right cursor-pointer hover:text-[var(--color-ink)]"
                onClick={() => toggleSort('cost')}
              >
                <span className="inline-flex items-center gap-1">
                  BYOK Spend <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="pb-3 font-semibold text-center">Efficiency Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-hairline)]">
            {modelList.map((m) => {
              const pricing = getModelPricing(m.model);
              const isLocal = m.model.includes('ollama') || m.model.includes('local');

              return (
                <tr key={m.model} className="hover:bg-[var(--color-paper)]/50 transition-colors">
                  <td className="py-3 font-medium text-[var(--color-ink)] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                    {m.model}
                  </td>
                  <td className="py-3 text-right text-[var(--color-ink)] font-semibold">{m.turns}</td>
                  <td className="py-3 text-right text-[var(--color-ink-muted)]">
                    {m.totalTokens.toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-[var(--color-ink-muted)]">
                    {m.avgLatencyMs > 0 ? `${m.avgLatencyMs} ms` : '—'}
                  </td>
                  <td className="py-3 text-right text-[var(--color-ink-muted)] text-[11px]">
                    {isLocal ? 'Free / Local' : `$${pricing.input} / $${pricing.output}`}
                  </td>
                  <td className="py-3 text-right font-bold text-[var(--color-ink)]">
                    {isLocal ? '$0.00' : `$${m.cost.toFixed(4)}`}
                  </td>
                  <td className="py-3 text-center">
                    {isLocal ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Free Local
                      </span>
                    ) : m.model.includes('flash') || m.model.includes('mini') ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Zap className="w-3 h-3" /> High Speed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                        <Award className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
