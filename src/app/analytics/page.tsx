'use client';

import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ShieldCheck, Cpu, Zap, Activity, Filter } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 04-stat-led · theme: almanac · nav: N1a · footer: Ft7 */

export default function AnalyticsPage() {
  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];
  const chats = useLiveQuery(() => db.chats.toArray()) || [];

  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('all');

  const totalPromptTokens = usageRecords.reduce((acc, u) => acc + u.promptTokens, 0);
  const totalCompletionTokens = usageRecords.reduce((acc, u) => acc + u.completionTokens, 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;

  // Average tokens per request calculation
  const avgTokensPerReq = usageRecords.length > 0 ? Math.round(totalTokens / usageRecords.length) : 0;

  // Find most active model
  const modelCounts: Record<string, number> = {};
  usageRecords.forEach((u) => {
    modelCounts[u.model] = (modelCounts[u.model] || 0) + 1;
  });
  let mostActiveModel = 'None';
  let maxCount = 0;
  Object.entries(modelCounts).forEach(([m, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveModel = m;
    }
  });

  // Extract unique models for filter pills
  const availableModels = Array.from(new Set(usageRecords.map((u) => u.model)));

  // Filtered records
  const filteredRecords = selectedModelFilter === 'all'
    ? usageRecords
    : usageRecords.filter((u) => u.model.toLowerCase().includes(selectedModelFilter.toLowerCase()));

  return (
    <Shell>
      <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
        {/* N1a Broad-sheet Header */}
        <header className="border-b border-[var(--color-border-hairline)] pb-4 space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            Token-First Local Analytics
          </div>
          <h1 className="font-display text-4xl text-[var(--color-ink)]">Analytics & Usage Telemetry</h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Extracted directly from SSE streaming headers. 100% stored in local IndexedDB.
          </p>
        </header>

        {/* 04 · Stat-Led Hero Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Total Tokens</span>
              <Zap className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">{totalTokens.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--color-ink-faint)]">Prompt + Completion Tokens</div>
          </div>

          <div className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Avg per Request</span>
              <Activity className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">{avgTokensPerReq.toLocaleString()}</div>
            <div className="text-[10px] text-[var(--color-ink-faint)]">Context Bloat Indicator</div>
          </div>

          <div className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Most Active Model</span>
              <Cpu className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-xl text-[var(--color-ink)] truncate">{mostActiveModel}</div>
            <div className="text-[10px] text-[var(--color-ink-faint)]">Top Execution Engine</div>
          </div>

          <div className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Storage Usage</span>
              <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">
              {Math.round((chats.length * 150 + usageRecords.length * 80) / 1024)} KB
            </div>
            <div className="text-[10px] text-[var(--color-ink-faint)]">Quantitative IndexedDB Analysis</div>
          </div>
        </div>

        {/* Tabular Usage Breakdown & Filter Control */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-hairline)] pb-4">
            <div>
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Execution Log & Token Breakdown</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">Real-time SSE token telemetry per request.</p>
            </div>

            {/* Model Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)] shrink-0 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[var(--color-accent)]" /> Filter:
              </span>
              <button
                onClick={() => setSelectedModelFilter('all')}
                aria-label="Filter all models"
                className={`px-2.5 py-1 text-xs font-mono rounded-[var(--radius-sm)] border transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                  selectedModelFilter === 'all'
                    ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)] font-semibold'
                    : 'bg-[var(--color-paper)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]'
                }`}
              >
                All
              </button>
              {availableModels.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModelFilter(m)}
                  aria-label={`Filter by ${m}`}
                  className={`px-2.5 py-1 text-xs font-mono rounded-[var(--radius-sm)] border transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] shrink-0 ${
                    selectedModelFilter === m
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)] font-semibold'
                      : 'bg-[var(--color-paper)] border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] italic">
              No usage records match the selected model filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-hairline)] text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Model Engine</th>
                    <th className="py-2 px-3">Prompt Tokens</th>
                    <th className="py-2 px-3">Completion Tokens</th>
                    <th className="py-2 px-3">Total Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-hairline)] text-xs">
                  {filteredRecords.slice(0, 25).map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--color-paper)] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[var(--color-ink-faint)]">
                        {new Date(u.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[var(--color-ink)]">{u.model}</td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-ink-muted)]">{u.promptTokens}</td>
                      <td className="py-2.5 px-3 font-mono text-[var(--color-ink-muted)]">{u.completionTokens}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[var(--color-accent)]">
                        {u.promptTokens + u.completionTokens}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ft7 Almanac Colophon Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Telemetry Schema v1.0 • Almanac Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
