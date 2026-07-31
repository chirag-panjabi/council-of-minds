'use client';

import React from 'react';
import { Clock, Zap, BarChart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

/* Hallmark · component: PeakUsageHeatmap · genre: studio · theme: studio · spec: spec_analytics.md (§8.4) */

export function PeakUsageHeatmap() {
  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];

  // 24-hour buckets (0 to 23)
  const hourlyTokens = new Array(24).fill(0);
  const hourlyRequests = new Array(24).fill(0);

  usageRecords.forEach((r) => {
    const hour = new Date(r.timestamp).getHours();
    const tokens = (r.promptTokens || 0) + (r.completionTokens || 0);
    hourlyTokens[hour] += tokens;
    hourlyRequests[hour] += 1;
  });

  const maxHourlyTokens = Math.max(...hourlyTokens, 1);
  const peakHourIndex = hourlyTokens.indexOf(maxHourlyTokens);
  const peakHourFormatted = `${String(peakHourIndex).padStart(2, '0')}:00 - ${String((peakHourIndex + 1) % 24).padStart(2, '0')}:00`;

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              24-Hour Peak Token Usage Heatmap
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Hourly activity distribution showing peak conversation & token consumption periods.
          </p>
        </div>

        <div className="text-right font-mono text-xs">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase">Peak Activity Window</div>
          <div className="text-sm font-bold text-[var(--color-accent)]">
            {usageRecords.length > 0 ? peakHourFormatted : 'No execution data'}
          </div>
        </div>
      </div>

      {/* 24-Hour Bar Heatmap Grid */}
      <div className="space-y-2 font-mono text-xs">
        <div className="h-32 flex items-end justify-between gap-1.5 pt-4 px-1">
          {hourlyTokens.map((tokens, hour) => {
            const heightPercent = Math.max(4, Math.round((tokens / maxHourlyTokens) * 100));
            const isPeak = hour === peakHourIndex && usageRecords.length > 0;
            const hourLabel = `${String(hour).padStart(2, '0')}:00`;

            return (
              <div
                key={hour}
                className="flex-1 flex flex-col items-center gap-1 group relative"
                title={`${hourLabel}: ${tokens.toLocaleString()} tokens (${hourlyRequests[hour]} requests)`}
              >
                {/* Hourly Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isPeak
                      ? 'bg-[var(--color-accent)] shadow-md shadow-[var(--color-accent)]/20'
                      : tokens > 0
                      ? 'bg-indigo-500/70 hover:bg-indigo-500'
                      : 'bg-[var(--color-paper)] border border-[var(--color-border-hairline)]'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Hour Marker (Every 3 hours) */}
                {hour % 3 === 0 && (
                  <span className="text-[9px] text-[var(--color-ink-muted)] shrink-0">
                    {hour === 0 ? '12a' : hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] pt-2 border-t border-[var(--color-border-hairline)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--color-accent)]" /> Peak Hour Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500/70" /> Active Usage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--color-paper)] border border-[var(--color-border-hairline)]" /> Idle Hour
          </span>
        </div>
      </div>
    </div>
  );
}
