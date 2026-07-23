import type { ModelBreakdown } from '@/lib/analytics/analytics-service';

interface UsageTableProps {
  data: ModelBreakdown[];
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(cost: number | null): string {
  if (cost === null) return 'N/A';
  return `$${cost.toFixed(4)}`;
}

/**
 * Semantic, keyboard-accessible table showing per-model token breakdown.
 * Renders "N/A" for unknown costs — never "$0.00" for unknown models.
 */
export function UsageTable({ data }: UsageTableProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No usage data for this period.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b bg-muted/30 text-left">
            <th scope="col" className="px-4 py-3 font-medium">Provider</th>
            <th scope="col" className="px-4 py-3 font-medium">Model</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Input</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Output</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Cached</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Reasoning</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Requests</th>
            <th scope="col" className="px-4 py-3 font-medium text-right">Est. Cost</th>
            <th scope="col" className="px-4 py-3 font-medium">Catalog</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={`${row.providerId}:${row.modelId}`}
              className="border-b last:border-b-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3 capitalize">{row.providerId}</td>
              <td className="px-4 py-3 font-mono text-xs">{row.modelId}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatTokens(row.inputTokens)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatTokens(row.outputTokens)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {row.cachedInputTokens > 0
                  ? formatTokens(row.cachedInputTokens)
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {row.reasoningTokens > 0
                  ? formatTokens(row.reasoningTokens)
                  : '—'}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                {formatTokens(row.totalTokens)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {row.requestCount}
              </td>
              <td
                className={`px-4 py-3 text-right tabular-nums ${row.estimatedCostUsd === null ? 'text-muted-foreground/60 italic' : ''}`}
              >
                {formatCost(row.estimatedCostUsd)}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.catalogVersion ?? 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
