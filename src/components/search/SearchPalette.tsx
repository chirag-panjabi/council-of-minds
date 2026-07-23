'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/stores/useUIStore';
import { db } from '@/lib/db';
import type { Persona, ChatSession } from '@/types';
import { Search, MessageSquare, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SearchPalette() {
  const { isSearchPaletteOpen, setSearchPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchPaletteOpen(!isSearchPaletteOpen);
      }
      if (e.key === 'Escape' && isSearchPaletteOpen) {
        setSearchPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchPaletteOpen, setSearchPaletteOpen]);

  useEffect(() => {
    if (!isSearchPaletteOpen || !query.trim()) {
      setPersonas([]);
      setChats([]);
      return;
    }

    const q = query.toLowerCase();
    db.personas
      .filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
      .toArray()
      .then(setPersonas);

    db.chats
      .filter((c) => c.title.toLowerCase().includes(q))
      .toArray()
      .then(setChats);
  }, [query, isSearchPaletteOpen]);

  if (!isSearchPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border-hairline)]">
          <Search className="w-5 h-5 text-[var(--color-ink-muted)] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search personas, chats, dilemmas..."
            className="flex-1 bg-transparent border-none outline-none text-base text-[var(--color-ink)] placeholder-[var(--color-ink-faint)]"
            autoFocus
          />
          <button
            onClick={() => setSearchPaletteOpen(false)}
            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {personas.length === 0 && chats.length === 0 && query.trim() !== '' && (
            <div className="p-4 text-center text-sm text-[var(--color-ink-muted)]">
              No matching personas or conversations found.
            </div>
          )}

          {personas.length > 0 && (
            <div className="mb-4">
              <div className="px-3 py-1 text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Personas
              </div>
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSearchPaletteOpen(false);
                    router.push(`/personas`);
                  }}
                  className="w-full flex items-center px-3 py-2 text-left rounded-[var(--radius-sm)] hover:bg-[var(--color-paper-2)] transition-colors"
                >
                  <User className="w-4 h-4 text-[var(--color-accent)] mr-3" />
                  <div>
                    <div className="text-sm font-medium text-[var(--color-ink)]">{p.name}</div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{p.role}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {chats.length > 0 && (
            <div>
              <div className="px-3 py-1 text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Conversations
              </div>
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSearchPaletteOpen(false);
                    router.push(c.type === 'council' ? `/chat/council/${c.id}` : `/chat/1-on-1/${c.id}`);
                  }}
                  className="w-full flex items-center px-3 py-2 text-left rounded-[var(--radius-sm)] hover:bg-[var(--color-paper-2)] transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-[var(--color-ink-muted)] mr-3" />
                  <div className="text-sm text-[var(--color-ink)]">{c.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
