'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  BarChart2,
  Settings,
  Plus,
  Search,
  ChevronRight,
  ShieldAlert,
  Keyboard,
  Menu,
  X,
} from 'lucide-react';
import { SearchPalette } from '@/components/search/SearchPalette';
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal';

/* Hallmark · genre: editorial · macrostructure: N3 · theme: studio · nav: N3 */

export function Sidebar() {
  const pathname = usePathname();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const groups = useLiveQuery(() => db.groups.toArray()) || [];
  const recentChats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().limit(30).toArray()) || [];

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Global keydown listeners for Cmd/Ctrl+K and Cmd/Ctrl+/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <>
      <SearchPalette />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Mobile Floating Menu Hamburger Button (< md) */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle Navigation Sidebar"
        aria-expanded={isMobileOpen}
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] rounded-[var(--radius-sm)] shadow-md focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={`w-64 bg-[var(--color-paper-2)] border-r border-[var(--color-border-hairline)] flex flex-col justify-between h-screen fixed md:sticky top-0 z-40 shrink-0 font-body text-sm transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Workspace Masthead */}
          <div className="space-y-1 pt-2 md:pt-0">
            <div className="font-display text-xl font-medium tracking-tight text-[var(--color-ink)]">
              Council of Minds
            </div>
            <div className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
              BYOK Dialectic Workspace
            </div>
          </div>

          {/* Quick Search Palette Trigger (Cmd+K) */}
          <button
            onClick={() => {
              setIsSearchOpen(true);
              setIsMobileOpen(false);
            }}
            aria-label="Open global search command palette (Command + K)"
            className="w-full flex items-center justify-between px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-all group focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Search...
            </span>
            <kbd className="font-mono text-[10px] bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] px-1.5 py-0.5 rounded text-[var(--color-ink-muted)]">
              ⌘K
            </kbd>
          </button>

          {/* Main Navigation Links */}
          <nav className="space-y-1">
            <Link
              href="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                isActive('/')
                  ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold shadow-xs border border-[var(--color-border-hairline)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/personas"
              className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                isActive('/personas') && !pathname.startsWith('/personas/groups')
                  ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold shadow-xs border border-[var(--color-border-hairline)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
              }`}
            >
              <Users className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Persona Library</span>
            </Link>

            <Link
              href="/personas/groups"
              className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                isActive('/personas/groups')
                  ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold shadow-xs border border-[var(--color-border-hairline)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" />
              <span>Persona Groups</span>
            </Link>
          </nav>

          {/* Saved Groups Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider px-2">
              <span>Saved Rosters</span>
              <Link href="/personas/groups" aria-label="Create new roster group" className="hover:text-[var(--color-accent)]">
                <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-0.5">
              {groups.length === 0 ? (
                <div className="px-3 py-1 text-[11px] font-mono text-[var(--color-ink-muted)] italic">
                  No saved rosters
                </div>
              ) : (
                groups.slice(0, 5).map((g) => (
                  <Link
                    key={g.id}
                    href="/personas/groups"
                    className="flex items-center justify-between px-3 py-1.5 rounded-[var(--radius-sm)] text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors"
                  >
                    <span className="truncate">{g.name}</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider px-2">
              <span>Recent Sessions ({recentChats.length})</span>
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsMobileOpen(false);
                }}
                className="hover:text-[var(--color-accent)] font-normal transition-colors"
                title="Search all historical sessions (⌘K)"
              >
                ⌘K
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
              {recentChats.length === 0 ? (
                <div className="px-3 py-2 text-[11px] font-mono text-[var(--color-ink-muted)] italic border border-dashed border-[var(--color-border-hairline)] rounded-[var(--radius-sm)]">
                  No active sessions yet
                </div>
              ) : (
                recentChats.map((c) => {
                  const href = c.type === 'council' ? `/chat/council/${c.id}` : `/chat/1-on-1/${c.id}`;
                  const isCurrent = pathname === href;

                  return (
                    <Link
                      key={c.id}
                      href={href}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors group ${
                        isCurrent
                          ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold shadow-xs border border-[var(--color-border-hairline)]'
                          : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                      }`}
                    >
                      {c.type === 'council' ? (
                        <Users className="w-3 h-3 text-[var(--color-accent)] shrink-0 opacity-70 group-hover:opacity-100" />
                      ) : (
                        <MessageSquare className="w-3 h-3 text-[var(--color-accent)] shrink-0 opacity-70 group-hover:opacity-100" />
                      )}
                      <span className="truncate flex-1">{c.title}</span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 border-t border-[var(--color-border-hairline)] space-y-1">
          <button
            onClick={() => {
              setIsShortcutsOpen(true);
              setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <span className="flex items-center gap-3">
              <Keyboard className="w-4 h-4 text-[var(--color-accent)]" /> Shortcuts
            </span>
            <kbd className="font-mono text-[10px] bg-[var(--color-paper)] border border-[var(--color-border-hairline)] px-1.5 py-0.5 rounded">
              ⌘/
            </kbd>
          </button>

          <Link
            href="/analytics"
            className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
              isActive('/analytics')
                ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Analytics</span>
          </Link>

          <Link
            href="/privacy"
            className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
              isActive('/privacy')
                ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Privacy Memo</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
              isActive('/settings')
                ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-semibold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
            }`}
          >
            <Settings className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
