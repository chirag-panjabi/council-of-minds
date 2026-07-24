'use client';

import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { BarChart2, Cpu, HardDrive, Trash2, Search, Download, DollarSign, Zap } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 04-stat-led · theme: studio · nav: N3 */

// Estimated BYOK Pricing per 1k tokens (input/output)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'gemini-2.5-flash': { input: 0.0001, output: 0.0004 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'ollama-local': { input: 0, output: 0 },
};

export function getModelPricing(model: string): { input: number; output: number } {
  if (model.includes('ollama') || model.includes('local')) return { input: 0, output: 0 };
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  if (model.includes('mini') || model.includes('flash') || model.includes('haiku')) {
    return { input: 0.00015, output: 0.0006 };
  }
  return { input: 0.002, output: 0.008 };
}

export default function AnalyticsPage() {
  const usageRecords = useLiveQuery(() => db.usage.orderBy('timestamp').reverse().toArray()) || [];
  const chats = useLiveQuery(() => db.chats.toArray()) || [];
  const messages = useLiveQuery(() => db.messages.toArray()) || [];
  const personas = useLiveQuery(() => db.personas.toArray()) || [];

  const [selectedModelFilter, setSelectedModelFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalTokens = usageRecords.reduce(
    (acc, r) => acc + (r.promptTokens || 0) + (r.completionTokens || 0),
    0
  );

  const avgTokensPerRequest = usageRecords.length > 0 ? Math.round(totalTokens / usageRecords.length) : 0;

  // Calculate estimated BYOK spend
  const estimatedSpend = usageRecords.reduce((acc, r) => {
    const pricing = getModelPricing(r.model);
    const promptCost = ((r.promptTokens || 0) / 1000) * pricing.input;
    const completionCost = ((r.completionTokens || 0) / 1000) * pricing.output;
    return acc + promptCost + completionCost;
  }, 0);

  // Model breakdown
  const modelBreakdown: Record<string, number> = {};
  usageRecords.forEach((r) => {
    modelBreakdown[r.model] = (modelBreakdown[r.model] || 0) + (r.promptTokens || 0) + (r.completionTokens || 0);
  });

  const topModel = Object.entries(modelBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const filteredRecords = usageRecords.filter((r) => {
    if (selectedModelFilter && r.model !== selectedModelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.model.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all telemetry usage logs? This action cannot be undone.')) {
      await db.usage.clear();
    }
  };

  const handleExportCSV = () => {
    if (usageRecords.length === 0) return;
    let csv = 'ID,Model,PromptTokens,CompletionTokens,TotalTokens,Timestamp\n';
    usageRecords.forEach((r) => {
      csv += `"${r.id}","${r.model}",${r.promptTokens},${r.completionTokens},${r.promptTokens + r.completionTokens},"${new Date(r.timestamp).toISOString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-usage-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (usageRecords.length === 0) return;
    const blob = new Blob([JSON.stringify(usageRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-usage-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10">
        {/* Header Bar (N3) */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border-hairline)] pb-6">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-normal text-[var(--color-ink)]">
              Token Telemetry & Analytics
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Local Usage Audit • {usageRecords.length} Execution Records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={usageRecords.length === 0}
              aria-label="Export Telemetry Data as CSV"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>

            <button
              onClick={handleExportJSON}
              disabled={usageRecords.length === 0}
              aria-label="Export Telemetry Data as JSON"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>

            <button
              onClick={handleClearLogs}
              disabled={usageRecords.length === 0}
              aria-label="Clear Telemetry Logs"
              className="btn-hallmark text-xs text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/10 gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-error)] disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Logs
            </button>
          </div>
        </header>

        {/* Hero Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Tokens */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Total Tokens</span>
              <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">
              {totalTokens.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">Across all sessions</div>
          </div>

          {/* Card 2: Avg Per Request */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Avg Per Request</span>
              <Zap className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">
              {avgTokensPerRequest.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">Tokens per completion</div>
          </div>

          {/* Card 3: Estimated BYOK Spend */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Estimated BYOK Spend</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">
              ${estimatedSpend.toFixed(3)}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">Local Ollama is $0.00 / Free</div>
          </div>

          {/* Card 4: Database Footprint */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>IndexedDB Storage</span>
              <HardDrive className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="font-display text-3xl text-[var(--color-ink)]">
              {chats.length + messages.length + personas.length}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
              {chats.length} Chats • {messages.length} Msgs
            </div>
          </div>
        </div>

        {/* Model Breakdown & Filter Pills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-[var(--color-ink)]">Execution Logs by Model</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter logs by model name..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedModelFilter(null)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                    selectedModelFilter === null
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-semibold'
                      : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  All Models
                </button>
                {Object.keys(modelBreakdown).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedModelFilter(m === selectedModelFilter ? null : m)}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                      selectedModelFilter === m
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]'
                        : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border border-[var(--color-border)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Telemetry Log Table */}
          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-paper)]">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[var(--color-ink-muted)]">
                No usage logs match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
                      <th className="p-3">Model Target</th>
                      <th className="p-3">Prompt Tokens</th>
                      <th className="p-3">Completion Tokens</th>
                      <th className="p-3">Total Tokens</th>
                      <th className="p-3">Est. Spend</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-hairline)] text-xs font-mono text-[var(--color-ink)]">
                    {filteredRecords.map((r) => {
                      const total = (r.promptTokens || 0) + (r.completionTokens || 0);
                      const pricing = MODEL_PRICING[r.model] || { input: 0.002, output: 0.006 };
                      const cost = ((r.promptTokens || 0) / 1000) * pricing.input + ((r.completionTokens || 0) / 1000) * pricing.output;
                      return (
                        <tr key={r.id} className="hover:bg-[var(--color-paper-2)] transition-colors">
                          <td className="p-3 font-semibold text-[var(--color-accent)]">{r.model}</td>
                          <td className="p-3">{(r.promptTokens || 0).toLocaleString()}</td>
                          <td className="p-3">{(r.completionTokens || 0).toLocaleString()}</td>
                          <td className="p-3 font-semibold">{total.toLocaleString()}</td>
                          <td className="p-3 text-emerald-600">${cost.toFixed(4)}</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">
                            {new Date(r.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
