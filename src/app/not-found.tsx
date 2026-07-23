'use client';

import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { useUIStore } from '@/lib/stores/useUIStore';
import { Home, Users, Search, ArrowLeft } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 09-specimen-error · theme: monochroma · nav: N1a · footer: Ft6 */

export default function NotFound() {
  const { setSearchPaletteOpen } = useUIStore();

  return (
    <Shell>
      <div className="p-8 md:p-16 max-w-3xl mx-auto min-h-[70vh] flex flex-col justify-between text-center space-y-10">
        {/* Header */}
        <header className="border-b border-[var(--color-border-hairline)] pb-4 flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
          <div>Council of Minds • 404 Exception</div>
          <div className="uppercase tracking-widest text-[var(--color-accent)] font-semibold">Page Not Found</div>
        </header>

        {/* 09 · Minimalist Error Specimen Card */}
        <main className="space-y-6 my-auto py-8">
          <div className="font-display text-7xl md:text-9xl font-normal text-[var(--color-ink)] tracking-tighter">
            404
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="font-display text-2xl text-[var(--color-ink)]">Route or Record Not Found</h1>
            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              The persona, chat session, or route you requested does not exist in your local IndexedDB database or has been deleted.
            </p>
          </div>

          {/* Recovery Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href="/" className="btn-hallmark btn-hallmark-primary text-xs gap-1.5">
              <Home className="w-4 h-4" /> Return to Dashboard
            </Link>
            <Link href="/personas" className="btn-hallmark text-xs gap-1.5">
              <Users className="w-4 h-4" /> Persona Library
            </Link>
            <button
              onClick={() => setSearchPaletteOpen(true)}
              className="btn-hallmark text-xs gap-1.5"
            >
              <Search className="w-4 h-4" /> Search (⌘K)
            </button>
          </div>
        </main>

        {/* Ft6 Letter Close Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-4 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>404 State Handler • Hallmark Monochroma Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
