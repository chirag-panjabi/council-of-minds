'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useUIStore } from '@/lib/stores/useUIStore';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Plus,
  Settings,
  BarChart2,
  HelpCircle,
  ChevronLeft,
  Search,
  Sparkles,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen, setSearchPaletteOpen } = useUIStore();

  const groups = useLiveQuery(() => db.groups.toArray()) || [];
  const recentChats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().limit(10).toArray()) || [];

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 h-screen sticky top-0 flex flex-col bg-[var(--color-paper-2)] border-r border-[var(--color-border-hairline)] select-none z-30 transition-all duration-200">
      {/* Broad-sheet Masthead Header */}
      <div className="p-4 border-b border-[var(--color-border-hairline)] flex items-center justify-between">
        <Link href="/" className="group flex flex-col">
          <span className="font-display text-lg tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
            Council of Minds
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            Editorial Studio v1.0
          </span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ⌘K Search Quick Trigger */}
      <div className="px-3 py-2">
        <button
          onClick={() => setSearchPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-[var(--color-ink-muted)] bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-ink-muted)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Search...
          </span>
          <kbd className="font-mono text-[10px] bg-[var(--color-paper-3)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Core Pages */}
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
              pathname === '/'
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Orientation Dashboard
          </Link>
          <Link
            href="/personas"
            className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
              pathname?.startsWith('/personas')
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
            }`}
          >
            <Users className="w-4 h-4" />
            Persona Library & Groups
          </Link>
        </div>

        {/* Persona Groups Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-faint)]">
              Persona Groups
            </span>
            <Link
              href="/personas/new"
              className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] p-0.5"
              title="Create New Persona"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            {groups.length === 0 ? (
              <div className="px-3 py-2 text-xs italic text-[var(--color-ink-faint)]">
                No saved rosters yet.
              </div>
            ) : (
              groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/personas`}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-[var(--radius-sm)] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span className="truncate">{group.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Conversations */}
        <div>
          <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-faint)]">
            Recent Conversations
          </div>
          <div className="space-y-1">
            {recentChats.length === 0 ? (
              <div className="px-3 py-2 text-xs italic text-[var(--color-ink-faint)]">
                No recent chats.
              </div>
            ) : (
              recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  href={chat.type === 'council' ? `/chat/council/${chat.id}` : `/chat/1-on-1/${chat.id}`}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] rounded-[var(--radius-sm)] transition-colors ${
                    pathname?.includes(chat.id) ? 'bg-[var(--color-paper-3)] text-[var(--color-ink)] font-medium' : ''
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--color-ink-muted)]" />
                  <span className="truncate">{chat.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </nav>

      {/* Footer Navigation (Settings & Analytics) */}
      <div className="p-3 border-t border-[var(--color-border-hairline)] space-y-1">
        <Link
          href="/analytics"
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
            pathname === '/analytics'
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analytics
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
            pathname === '/settings'
              ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
              : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
