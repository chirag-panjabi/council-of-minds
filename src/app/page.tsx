'use client';

import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Persona } from '@/types';
import Link from 'next/link';
import { Users, MessageSquare, ArrowRight, Zap, Shield, Search, Plus, Trash2 } from 'lucide-react';
import { PersonaSelectorModal } from '@/components/personas/PersonaSelectorModal';
import { useRouter } from 'next/navigation';

/* Hallmark · genre: editorial · macrostructure: 01-bento · theme: studio · nav: N1 · footer: Ft1 */

export default function DashboardPage() {
  const router = useRouter();
  const personas = useLiveQuery(() => db.personas.filter((p) => !p.isArchived).toArray()) || [];
  const groups = useLiveQuery(() => db.groups.toArray()) || [];
  const recentChats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().limit(5).toArray()) || [];
  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];

  const [personaSearch, setPersonaSearch] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const totalTokens = usageRecords.reduce(
    (acc, rec) => acc + (rec.promptTokens || 0) + (rec.completionTokens || 0),
    0
  );

  const filteredPersonas = personas.filter(
    (p) =>
      p.name.toLowerCase().includes(personaSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(personaSearch.toLowerCase())
  );

  const handleSelectPersonaForChat = (persona: Persona) => {
    router.push(`/chat/1-on-1/new?persona=${persona.id}`);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Delete this chat session permanently?')) {
      await db.messages.where('chatId').equals(sessionId).delete();
      await db.chats.delete(sessionId);
    }
  };

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10">
        {/* Persona Selector Modal triggered by + New Chat */}
        <PersonaSelectorModal
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          mode="single"
          title="Select Persona to Start 1-on-1 Chat"
          onSelectPersona={handleSelectPersonaForChat}
        />

        {/* Masthead Header (N1) */}
        <header className="border-b border-[var(--color-border-hairline)] pb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] inline-block" />
            Workspace Orientation • Sovereign Local Engine
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-[var(--color-ink)] tracking-tight">
            Council of Minds
          </h1>
          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)] max-w-2xl font-body">
            Multi-persona cognitive framework for structured decision synthesis, dialectic debate, and analytical 1-on-1 dialogue.
          </p>
        </header>

        {/* Bento Grid Layout (Macrostructure 01) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bento Tile 1: Saved Persona Groups (Rosters) */}
          <div className="lg:col-span-2 p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-6 flex flex-col justify-between group hover:border-[var(--color-border)] transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                  <Users className="w-4 h-4 text-[var(--color-accent)]" /> Saved Roster Panels
                </div>
                <Link
                  href="/personas/groups"
                  className="text-xs font-mono text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  Manage Groups <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {groups.length === 0 ? (
                <div className="py-8 text-center space-y-3 border border-dashed border-[var(--color-border)] rounded-[var(--radius-sm)]">
                  <p className="text-xs text-[var(--color-ink-muted)]">No persona rosters configured yet.</p>
                  <Link
                    href="/personas/groups"
                    className="btn-hallmark text-xs inline-flex items-center gap-1 bg-[var(--color-accent)] text-white"
                  >
                    + Create Roster Group
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.slice(0, 4).map((g) => (
                    <Link
                      key={g.id}
                      href={`/chat/council/new?group=${g.id}`}
                      className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] hover:border-[var(--color-accent)] rounded-[var(--radius-sm)] transition-all space-y-2 block"
                    >
                      <div className="font-display text-base text-[var(--color-ink)] flex items-center justify-between">
                        <span>{g.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--color-paper-2)] rounded text-[var(--color-ink-muted)]">
                          {g.personaIds?.length || 0} Members
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">{g.description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bento Tile 2: Usage Telemetry Widget */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--color-accent)]" /> Token Telemetry
                </span>
                <Link href="/analytics" className="text-xs font-mono text-[var(--color-accent)] hover:underline">
                  Details
                </Link>
              </div>

              <div className="space-y-1">
                <div className="font-display text-3xl text-[var(--color-ink)]">
                  {totalTokens.toLocaleString()}
                </div>
                <div className="text-xs font-mono text-[var(--color-ink-muted)]">Total Tokens Consumed</div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border-hairline)] flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Local Storage
              </span>
              <span>100% BYOK</span>
            </div>
          </div>

          {/* Bento Tile 3: 1-on-1 Quick Start */}
          <div className="lg:col-span-2 p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" /> 1-on-1 Persona Quick-Start
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSelectorOpen(true)}
                  className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] gap-1 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                >
                  <Plus className="w-3.5 h-3.5" /> New 1-on-1 Chat
                </button>
                <Link href="/personas" className="text-xs font-mono text-[var(--color-accent)] hover:underline">
                  All ({personas.length})
                </Link>
              </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={personaSearch}
                onChange={(e) => setPersonaSearch(e.target.value)}
                placeholder="Filter personas by name or role..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto">
              {filteredPersonas.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/chat/1-on-1/new?persona=${p.id}`}
                  className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] hover:border-[var(--color-accent)] rounded-[var(--radius-sm)] transition-all flex items-center justify-between group"
                >
                  <div>
                    <div className="font-display text-sm text-[var(--color-ink)]">{p.name}</div>
                    <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">{p.role}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Bento Tile 4: Recent Sessions List with Delete Shortcut */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
                Recent Sessions
              </span>
              <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">{recentChats.length} Active</span>
            </div>

            {recentChats.length === 0 ? (
              <div className="py-8 text-center text-xs font-mono text-[var(--color-ink-muted)]">
                No recent chat sessions.
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] hover:border-[var(--color-border)] rounded-[var(--radius-sm)] flex items-center justify-between transition-all group"
                  >
                    <Link
                      href={c.type === 'council' ? `/chat/council/${c.id}` : `/chat/1-on-1/${c.id}`}
                      className="flex-1 min-w-0 pr-2"
                    >
                      <div className="font-display text-sm text-[var(--color-ink)] truncate">{c.title}</div>
                      <div className="text-[10px] font-mono text-[var(--color-ink-muted)] flex items-center gap-2">
                        <span className="uppercase">{c.type}</span> • {new Date(c.updatedAt).toLocaleDateString()}
                      </div>
                    </Link>

                    <button
                      onClick={(e) => handleDeleteSession(e, c.id)}
                      aria-label={`Delete chat session ${c.title}`}
                      className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-error)] opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Masthead Footer (Ft1) */}
        <footer className="pt-8 border-t border-[var(--color-border-hairline)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--color-ink-muted)]">
          <div>Council of Minds • Open Source BYOK Edition</div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[var(--color-ink)] underline">
              Privacy Memo
            </Link>
            <Link href="/settings" className="hover:text-[var(--color-ink)] underline">
              Settings & Keys
            </Link>
          </div>
        </footer>
      </div>
    </Shell>
  );
}
