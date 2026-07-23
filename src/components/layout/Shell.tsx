'use client';

import { Sidebar } from './Sidebar';
import { SearchPalette } from '@/components/search/SearchPalette';
import { useUIStore } from '@/lib/stores/useUIStore';
import { Menu } from 'lucide-react';

export function Shell({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <Sidebar />
      <SearchPalette />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Trigger if sidebar is closed */}
        {!isSidebarOpen && (
          <header className="p-3 border-b border-[var(--color-border-hairline)] flex items-center justify-between sticky top-0 bg-[var(--color-paper)]/90 backdrop-blur-xs z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] hover:bg-[var(--color-paper-2)] text-[var(--color-ink-muted)]"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display text-sm tracking-tight text-[var(--color-ink)]">
              Council of Minds
            </span>
            <div className="w-8" />
          </header>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
