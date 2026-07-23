'use client';

/* Hallmark · genre: editorial · theme: studio · spec: spec_loading_states.md */

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-busy="true"
      className={`bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] animate-pulse rounded-[var(--radius-sm)] ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      aria-busy="true"
      className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4 animate-pulse"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-border)] shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-[var(--color-border)] rounded w-1/3" />
          <div className="h-3 bg-[var(--color-border)] rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-[var(--color-border)] rounded w-full" />
        <div className="h-3 bg-[var(--color-border)] rounded w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div
      aria-busy="true"
      className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between gap-4 animate-pulse"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-full bg-[var(--color-border)] shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-[var(--color-border)] rounded w-1/4" />
          <div className="h-3 bg-[var(--color-border)] rounded w-1/2" />
        </div>
      </div>
      <div className="w-16 h-6 bg-[var(--color-border)] rounded" />
    </div>
  );
}
