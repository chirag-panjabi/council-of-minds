'use client';

import React, { useState } from 'react';
import { Users, Search, ArrowUpDown } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isOfficialPersona } from '@/lib/db';
import { getModelPricing } from '@/app/analytics/page';

/* Hallmark · component: PersonaAnalyticsBreakdown · genre: studio · theme: studio · spec: spec_analytics.md (§8.2) */

export function PersonaAnalyticsBreakdown() {
  const personas = useLiveQuery(() => db.personas.toArray()) || [];
  const messages = useLiveQuery(() => db.messages.toArray()) || [];
  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'tokens' | 'turns' | 'cost'>('tokens');

  // Map per persona: turn count & token breakdown
  const statsMap: Record<
    string,
    { turns: number; promptTokens: number; completionTokens: number; totalTokens: number; cost: number; models: Record<string, number> }
  > = {};

  // Initialize all active personas
  personas.forEach((p) => {
    statsMap[p.id] = { turns: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, models: {} };
  });

  // Calculate turns from messages
  messages.forEach((m) => {
    if (m.personaId && statsMap[m.personaId]) {
      statsMap[m.personaId].turns += 1;
    }
  });

  // Calculate tokens & cost from usage records
  usageRecords.forEach((r) => {
    if (r.personaId && statsMap[r.personaId]) {
      const prompt = r.promptTokens || 0;
      const completion = r.completionTokens || 0;
      const total = prompt + completion;
      const pricing = getModelPricing(r.model || 'gpt-4o');
      const cost = (prompt / 1000) * pricing.input + (completion / 1000) * pricing.output;

      statsMap[r.personaId].promptTokens += prompt;
      statsMap[r.personaId].completionTokens += completion;
      statsMap[r.personaId].totalTokens += total;
      statsMap[r.personaId].cost += cost;

      if (r.model) {
        statsMap[r.personaId].models[r.model] = (statsMap[r.personaId].models[r.model] || 0) + total;
      }
    }
  });

  // Convert to array and filter/sort
  const personaStats = personas
    .map((p) => {
      const stat = statsMap[p.id] || { turns: 0, promptTokens: 0, completionTokens: 0, totalTokens: 0, cost: 0, models: {} };
      const avgTokens = stat.turns > 0 ? Math.round(stat.totalTokens / stat.turns) : 0;
      return {
        persona: p,
        avgTokens,
        ...stat,
      };
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.persona.name.toLowerCase().includes(q) ||
        item.persona.role.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'turns') return b.turns - a.turns;
      if (sortBy === 'cost') return b.cost - a.cost;
      return b.totalTokens - a.totalTokens;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-accent)]" /> Per-Persona Usage & Model Distribution
          </h2>
          <p className="text-xs font-mono text-[var(--color-ink-muted)]">
            Breakdown of turns executed, token volume, model distribution, and average tokens per request per persona.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search persona..."
              className="pl-8 pr-3 py-1.5 text-xs font-mono bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded p-1 text-xs font-mono">
            <span className="text-[10px] text-[var(--color-ink-muted)] px-1">Sort:</span>
            <button
              onClick={() => setSortBy('tokens')}
              className={`px-2 py-0.5 rounded ${sortBy === 'tokens' ? 'bg-[var(--color-accent)] text-white font-semibold' : 'text-[var(--color-ink-muted)]'}`}
            >
              Tokens
            </button>
            <button
              onClick={() => setSortBy('turns')}
              className={`px-2 py-0.5 rounded ${sortBy === 'turns' ? 'bg-[var(--color-accent)] text-white font-semibold' : 'text-[var(--color-ink-muted)]'}`}
            >
              Turns
            </button>
            <button
              onClick={() => setSortBy('cost')}
              className={`px-2 py-0.5 rounded ${sortBy === 'cost' ? 'bg-[var(--color-accent)] text-white font-semibold' : 'text-[var(--color-ink-muted)]'}`}
            >
              Cost
            </button>
          </div>
        </div>
      </div>

      {/* Persona Stats Table */}
      <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-paper)]">
        {personaStats.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[var(--color-ink-muted)]">
            No active personas match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
                  <th className="p-3">Persona</th>
                  <th className="p-3">Role / Category</th>
                  <th className="p-3">Turns</th>
                  <th className="p-3">Total Tokens</th>
                  <th className="p-3">Avg / Request</th>
                  <th className="p-3">Model Distribution</th>
                  <th className="p-3">Est. BYOK Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-hairline)] text-xs font-mono text-[var(--color-ink)]">
                {personaStats.map(({ persona: p, turns, totalTokens, avgTokens, models, cost }) => {
                  const modelEntries = Object.entries(models).sort((a, b) => b[1] - a[1]);
                  const modelTotal = modelEntries.reduce((acc, [, val]) => acc + val, 0) || 1;

                  return (
                    <tr key={p.id} className="hover:bg-[var(--color-paper-2)] transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--color-accent)] shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-[var(--color-ink)]">{p.name}</span>
                          {isOfficialPersona(p) ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">Official</span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Custom</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-[var(--color-ink-muted)]">{p.role}</td>
                      <td className="p-3 font-semibold">{turns.toLocaleString()}</td>
                      <td className="p-3 font-semibold text-[var(--color-accent)]">{totalTokens.toLocaleString()}</td>
                      <td className="p-3 font-mono text-[var(--color-ink-muted)]">{avgTokens.toLocaleString()} t/req</td>
                      <td className="p-3">
                        {modelEntries.length === 0 ? (
                          <span className="text-[10px] text-[var(--color-ink-muted)] font-mono">No usage recorded</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {modelEntries.map(([modelName, tokens]) => {
                              const pct = Math.round((tokens / modelTotal) * 100);
                              return (
                                <span
                                  key={modelName}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)]"
                                  title={`${modelName}: ${tokens.toLocaleString()} tokens (${pct}%)`}
                                >
                                  {modelName}: <strong className="text-[var(--color-accent)]">{pct}%</strong>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-emerald-600 font-semibold">${cost.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
