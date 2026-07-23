'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/stores/useUIStore';
import { db } from '@/lib/db';
import type { Persona, ChatSession, ChatMessage } from '@/types';
import { Search, MessageSquare, User, X, FileText, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* Hallmark · genre: editorial · macrostructure: 08-modal · theme: studio · spec: spec_search.md */

interface MessageSearchResult {
  message: ChatMessage;
  chatTitle: string;
  chatType: '1-on-1' | 'council';
  senderName: string;
}

export function SearchPalette() {
  const { isSearchPaletteOpen, setSearchPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [matchingMessages, setMatchingMessages] = useState<MessageSearchResult[]>([]);
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
      setMatchingMessages([]);
      return;
    }

    const q = query.toLowerCase();

    // 1. Search Personas
    db.personas
      .filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
      .toArray()
      .then(setPersonas);

    // 2. Search Chat Sessions
    db.chats
      .filter((c) => c.title.toLowerCase().includes(q))
      .toArray()
      .then(setChats);

    // 3. Full-Text Search Messages Content & Reasoning
    const executeMessageSearch = async () => {
      const allMsgs = await db.messages
        .filter((m) => m.content.toLowerCase().includes(q) || Boolean(m.reasoning?.toLowerCase().includes(q)))
        .limit(10)
        .toArray();

      const allPersonas = await db.personas.toArray();
      const allChatSessions = await db.chats.toArray();

      const results: MessageSearchResult[] = allMsgs.map((m) => {
        const chat = allChatSessions.find((c) => c.id === m.chatId);
        const persona = allPersonas.find((p) => p.id === m.personaId);

        return {
          message: m,
          chatTitle: chat?.title || 'Untitled Session',
          chatType: chat?.type || '1-on-1',
          senderName: m.role === 'user' ? 'You' : persona?.name || 'Assistant',
        };
      });

      setMatchingMessages(results);
    };

    executeMessageSearch();
  }, [query, isSearchPaletteOpen]);

  if (!isSearchPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)]">
          <Search className="w-5 h-5 text-[var(--color-accent)] mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search full-text messages, personas, dilemma chats... (Cmd+K)"
            className="flex-1 bg-transparent border-none outline-none font-body text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-muted)]"
            autoFocus
          />
          <kbd className="px-2 py-0.5 bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-ink-muted)] mr-2">
            ESC
          </kbd>
          <button
            onClick={() => setSearchPaletteOpen(false)}
            aria-label="Close search"
            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[28rem] overflow-y-auto p-4 space-y-6">
          {personas.length === 0 && chats.length === 0 && matchingMessages.length === 0 && query.trim() !== '' && (
            <div className="p-8 text-center text-xs font-mono text-[var(--color-ink-muted)] space-y-1">
              <div>No matching personas, sessions, or message content found for &quot;{query}&quot;.</div>
              <div className="text-[10px]">Try searching for keywords like &quot;strategy&quot;, &quot;architecture&quot;, or persona names.</div>
            </div>
          )}

          {/* Full-Text Messages Section */}
          {matchingMessages.length > 0 && (
            <div className="space-y-2">
              <div className="px-1 text-xs font-mono uppercase tracking-wider text-[var(--color-accent)] font-semibold flex items-center justify-between">
                <span>Message Content Matches ({matchingMessages.length})</span>
                <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">Full-Text Indexed</span>
              </div>
              <div className="space-y-2">
                {matchingMessages.map((res) => (
                  <button
                    key={res.message.id}
                    onClick={() => {
                      setSearchPaletteOpen(false);
                      router.push(res.chatType === 'council' ? `/chat/council/${res.message.chatId}` : `/chat/1-on-1/${res.message.chatId}`);
                    }}
                    className="w-full p-3 text-left rounded-[var(--radius-sm)] bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-accent)] transition-all group flex flex-col space-y-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
                      <span className="flex items-center gap-1.5 text-[var(--color-ink)] font-semibold">
                        <FileText className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                        {res.chatTitle}
                      </span>
                      <span>{new Date(res.message.timestamp).toLocaleDateString()}</span>
                    </div>

                    <div className="text-xs font-body text-[var(--color-ink-muted)] line-clamp-2 leading-relaxed">
                      <span className="font-semibold text-[var(--color-ink)] font-mono mr-1">[{res.senderName}]:</span>
                      {res.message.content}
                    </div>

                    <div className="text-[10px] font-mono text-[var(--color-accent)] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
                      <span>Jump to session message</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Personas Section */}
          {personas.length > 0 && (
            <div className="space-y-2">
              <div className="px-1 text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Personas ({personas.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSearchPaletteOpen(false);
                      router.push(`/personas`);
                    }}
                    className="flex items-center p-3 text-left rounded-[var(--radius-sm)] bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-accent)] transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] flex items-center justify-center font-display text-xs text-[var(--color-accent)] font-semibold shrink-0 mr-3">
                      {p.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-[var(--color-ink)] truncate">{p.name}</div>
                      <div className="text-[10px] font-mono text-[var(--color-ink-muted)] truncate">{p.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversations Section */}
          {chats.length > 0 && (
            <div className="space-y-2">
              <div className="px-1 text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Conversations ({chats.length})
              </div>
              <div className="space-y-1">
                {chats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSearchPaletteOpen(false);
                      router.push(c.type === 'council' ? `/chat/council/${c.id}` : `/chat/1-on-1/${c.id}`);
                    }}
                    className="w-full flex items-center justify-between p-3 text-left rounded-[var(--radius-sm)] bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-accent)] transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
                      <span className="text-xs font-semibold text-[var(--color-ink)] truncate">{c.title}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)] px-2 py-0.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded shrink-0">
                      {c.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
