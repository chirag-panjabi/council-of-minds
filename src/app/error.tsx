'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 09-specimen-error · theme: monochroma · nav: N1a · footer: Ft6 */

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Runtime Error:', error);
  }, [error]);

  return (
    <Shell>
      <div className="p-8 md:p-16 max-w-3xl mx-auto min-h-[70vh] flex flex-col justify-between text-center space-y-10">
        {/* Header */}
        <header className="border-b border-[var(--color-border-hairline)] pb-4 flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
          <div>Council of Minds • Exception Boundary</div>
          <div className="uppercase tracking-widest text-[var(--color-error)] font-semibold flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" /> Runtime Exception
          </div>
        </header>

        {/* 09 · Minimalist Error Specimen Card */}
        <main className="space-y-6 my-auto py-8">
          <div className="font-display text-6xl md:text-8xl font-normal text-[var(--color-error)] tracking-tighter">
            System Error
          </div>

          <div className="space-y-3 max-w-lg mx-auto">
            <h1 className="font-display text-2xl text-[var(--color-ink)]">An Unexpected Error Occurred</h1>
            <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-error)]/30 rounded text-xs font-mono text-[var(--color-ink-muted)] text-left leading-relaxed break-words">
              {error.message || 'Unknown application runtime exception.'}
            </div>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => reset()}
              aria-label="Try Execution Again"
              className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <RotateCcw className="w-4 h-4" /> Try Execution Again
            </button>
            <Link
              href="/"
              aria-label="Return to Dashboard"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Home className="w-4 h-4" /> Return to Dashboard
            </Link>
          </div>
        </main>

        {/* Ft6 Letter Close Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-4 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Runtime Exception Handler • Hallmark Monochroma Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
