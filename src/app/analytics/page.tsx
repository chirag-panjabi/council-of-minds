'use client';

import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { BarChart2, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 04-stat-led · theme: almanac · nav: N1a · footer: Ft7 */

export default function AnalyticsPage() {
  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];
  const personas = useLiveQuery(() => db.personas.toArray()) || [];
  const chats = useLiveQuery(() => db.chats.toArray()) || [];

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Tabular Usage Breakdown */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
          <h2 className="font-display text-2xl text-[var(--color-ink)]">Execution Log & Token Breakdown</h2>

          {usageRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--color-ink-muted)] italic">
              No usage recorded yet. Start a persona chat session to populate token metrics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border-hairline)] text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Model</th>
                    <th className="py-2 px-3">Prompt Tokens</th>
                    <th className="py-2 px-3">Completion Tokens</th>
                    <th className="py-2 px-3">Total Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-hairline)] text-xs">
                  {usageRecords.slice(0, 15).map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--color-paper)] transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[var(--color-ink-faint)]">
                        {new Date(u.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[var(--color-ink)]">{u.model}</td>
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
      </div>
    </Shell>
  );
}
