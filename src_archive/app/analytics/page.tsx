"use client";

import * as React from 'react';
import { KpiCard } from '@/components/analytics/KpiCard';
import { UsageTable } from '@/components/analytics/UsageTable';
import {
  getUsageSummary,
  getUsageByModel,
  type AnalyticsPeriod,
  type UsageSummary,
  type ModelBreakdown,
} from '@/lib/analytics/analytics-service';

const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  return `$${value.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function AnalyticsPage() {
  const [period, setPeriod] = React.useState<AnalyticsPeriod>('90d');
  const [summary, setSummary] = React.useState<UsageSummary | null>(null);
  const [modelBreakdown, setModelBreakdown] = React.useState<ModelBreakdown[]>(
    [],
  );
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [s, m] = await Promise.all([
        getUsageSummary(period),
        getUsageByModel(period),
      ]);
      if (!cancelled) {
        setSummary(s);
        setModelBreakdown(m);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <section className="mx-auto max-w-5xl space-y-6 py-6 px-4">
      {/* Header */}
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Analytics</p>
        <h1 className="text-3xl font-bold tracking-tight">
          Token Usage &amp; Cost Estimates
        </h1>
        <p className="text-muted-foreground">
          Locally observed usage and estimated cost based on the embedded pricing
          catalog. This is not provider billing.
        </p>
      </header>

      {/* Period selector */}
      <div
        role="group"
        aria-label="Time period"
        className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit"
      >
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            id={`period-${opt.value}`}
            type="button"
            onClick={() => setPeriod(opt.value)}
            aria-pressed={period === opt.value}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              period === opt.value
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-muted-foreground">
          Loading analytics…
        </div>
      )}

      {/* KPI Cards */}
      {!loading && summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              id="kpi-estimated-spend"
              label="Estimated Spend"
              value={formatCurrency(summary.estimatedSpendUsd)}
              isNA={summary.estimatedSpendUsd === null}
              subLabel={
                summary.unavailableCount > 0
                  ? `${summary.unavailableCount} request(s) with unavailable usage`
                  : undefined
              }
            />
            <KpiCard
              id="kpi-total-tokens"
              label="Total Known Tokens"
              value={formatTokens(summary.totalKnownTokens)}
            />
            <KpiCard
              id="kpi-most-active-persona"
              label="Most Active Persona"
              value={
                summary.mostActivePersonaId
                  ? summary.mostActivePersonaId.slice(0, 8) + '…'
                  : null
              }
              isNA={!summary.mostActivePersonaId}
              subLabel={
                summary.mostActivePersonaId ? 'By request count' : undefined
              }
            />
          </div>

          {/* Model breakdown table */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Usage by Model</h2>
            <UsageTable data={modelBreakdown} />
          </div>

          {/* Catalog disclaimer */}
          <p className="text-xs text-muted-foreground border-t pt-4">
            Estimate using catalog{' '}
            <span className="font-mono">{summary.catalogVersion}</span>{' '}
            (published {summary.catalogPublishedAt}); provider billing may
            differ.
          </p>
        </>
      )}
    </section>
  );
}
