'use client';

import { useState, useMemo } from 'react';
import { UsageRecord } from '@/types';
import { Calendar, TrendingUp } from 'lucide-react';

/* Hallmark · component: TimeSeriesUsageChart · genre: editorial · theme: studio · spec: spec_analytics.md (§13.2) */

interface TimeSeriesUsageChartProps {
  usageRecords: UsageRecord[];
}

type DateRangeFilter = '7d' | '30d' | '90d' | 'all';

interface DailyUsageSummary {
  dateStr: string;
  displayDate: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  count: number;
}

export function TimeSeriesUsageChart({ usageRecords }: TimeSeriesUsageChartProps) {
  const [range, setRange] = useState<DateRangeFilter>('30d');

  const filteredAndGroupedData = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;

    if (range === '7d') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (range === '30d') cutoff = now - 30 * 24 * 60 * 60 * 1000;
    else if (range === '90d') cutoff = now - 90 * 24 * 60 * 60 * 1000;

    const filtered = usageRecords.filter((r) => r.timestamp >= cutoff);

    // Group by YYYY-MM-DD
    const map: Record<string, DailyUsageSummary> = {};

    filtered.forEach((r) => {
      const d = new Date(r.timestamp);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      if (!map[dateStr]) {
        map[dateStr] = {
          dateStr,
          displayDate,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          count: 0,
        };
      }

      map[dateStr].promptTokens += r.promptTokens || 0;
      map[dateStr].completionTokens += r.completionTokens || 0;
      map[dateStr].totalTokens += (r.promptTokens || 0) + (r.completionTokens || 0);
      map[dateStr].count += 1;
    });

    const sortedSummaries = Object.values(map).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    return sortedSummaries;
  }, [usageRecords, range]);

  const maxDailyTokens = useMemo(() => {
    return Math.max(...filteredAndGroupedData.map((d) => d.totalTokens), 1);
  }, [filteredAndGroupedData]);

  const periodTotalTokens = useMemo(() => {
    return filteredAndGroupedData.reduce((acc, d) => acc + d.totalTokens, 0);
  }, [filteredAndGroupedData]);

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-hairline)] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              Time-Series Token Volume
            </h2>
          </div>
          <p className="text-xs font-mono text-[var(--color-ink-muted)]">
            Daily prompt and completion token distribution over time ({periodTotalTokens.toLocaleString()} tokens in range)
          </p>
        </div>

        {/* Range Filter Buttons */}
        <div className="flex items-center gap-1 bg-[var(--color-paper)] p-1 rounded-md border border-[var(--color-border)]">
          {(['7d', '30d', '90d', 'all'] as DateRangeFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                range === r
                  ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-semibold'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {r === 'all' ? 'All Time' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {filteredAndGroupedData.length === 0 ? (
        <div className="p-12 text-center text-xs font-mono text-[var(--color-ink-muted)] space-y-2">
          <Calendar className="w-6 h-6 mx-auto text-[var(--color-ink-muted)] opacity-50" />
          <p>No token execution history recorded for the selected time range ({range.toUpperCase()}).</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-xs font-mono text-[var(--color-ink-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-[var(--color-accent)]/80" />
              <span>Prompt Tokens</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-xs bg-emerald-500/80" />
              <span>Completion Tokens</span>
            </div>
          </div>

          {/* Bar Visualizer Grid */}
          <div className="h-56 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto border-b border-[var(--color-border-hairline)]">
            {filteredAndGroupedData.map((d) => {
              const heightPct = Math.max((d.totalTokens / maxDailyTokens) * 100, 4);
              const promptPct = (d.promptTokens / (d.totalTokens || 1)) * 100;
              const completionPct = (d.completionTokens / (d.totalTokens || 1)) * 100;

              return (
                <div
                  key={d.dateStr}
                  className="flex-1 min-w-[28px] max-w-[48px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip Popover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-[var(--color-paper)] border border-[var(--color-border)] p-2.5 rounded shadow-lg text-[10px] font-mono z-30 whitespace-nowrap space-y-1">
                    <div className="font-semibold text-[var(--color-ink)] border-b border-[var(--color-border-hairline)] pb-1">
                      {d.dateStr} ({d.count} requests)
                    </div>
                    <div className="text-[var(--color-accent)]">Prompt: {d.promptTokens.toLocaleString()}</div>
                    <div className="text-emerald-600">Completion: {d.completionTokens.toLocaleString()}</div>
                    <div className="font-bold text-[var(--color-ink)] pt-0.5 border-t border-[var(--color-border-hairline)]">
                      Total: {d.totalTokens.toLocaleString()}
                    </div>
                  </div>

                  {/* Stacked Bar */}
                  <div
                    className="w-full rounded-t flex flex-col overflow-hidden transition-all duration-200 group-hover:brightness-110"
                    style={{ height: `${heightPct}%` }}
                  >
                    <div
                      className="bg-emerald-500/80 w-full transition-all"
                      style={{ height: `${completionPct}%` }}
                    />
                    <div
                      className="bg-[var(--color-accent)]/80 w-full transition-all"
                      style={{ height: `${promptPct}%` }}
                    />
                  </div>

                  {/* Date Axis Label */}
                  <span className="text-[9px] font-mono text-[var(--color-ink-muted)] mt-2 group-hover:text-[var(--color-ink)] truncate w-full text-center">
                    {d.displayDate}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
