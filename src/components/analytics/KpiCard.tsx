import { clsx } from 'clsx';

interface KpiCardProps {
  id: string;
  label: string;
  value: string | number | null;
  subLabel?: string;
  /** When true, the value is not available and should render distinctly */
  isNA?: boolean;
}

/**
 * KPI metric card — displays a label, large value, and optional sub-label.
 * `null` values render as "N/A" in a muted style distinct from "0".
 */
export function KpiCard({ id, label, value, subLabel, isNA }: KpiCardProps) {
  const displayValue = isNA || value === null ? 'N/A' : value;

  return (
    <div
      id={id}
      className="rounded-xl border bg-card p-5 shadow-sm"
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={clsx(
          'mt-1 text-2xl font-bold tracking-tight',
          (isNA || value === null) && 'text-muted-foreground/60 italic',
        )}
      >
        {displayValue}
      </p>
      {subLabel && (
        <p className="mt-1 text-xs text-muted-foreground">{subLabel}</p>
      )}
    </div>
  );
}
