'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Sparkles, MessageSquare, Users, AlertCircle, ArrowRight, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* Hallmark · genre: editorial · macrostructure: 01-bento-grid · theme: specimen · nav: N6 · footer: Ft1 */

export default function DashboardPage() {
  const router = useRouter();
  const [hasProviderKey, setHasProviderKey] = useState(true);

  const groups = useLiveQuery(() => db.groups.toArray()) || [];
  const personas = useLiveQuery(() => db.personas.where('isArchived').equals(0).toArray()) || [];
  const recentChats = useLiveQuery(() => db.chats.orderBy('updatedAt').reverse().limit(5).toArray()) || [];
  const usageRecords = useLiveQuery(() => db.usage.toArray()) || [];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasOpenAI = Boolean(localStorage.getItem('framework-engine:api-key:openai'));
    const hasAnthropic = Boolean(localStorage.getItem('framework-engine:api-key:anthropic'));
    const hasGemini = Boolean(localStorage.getItem('framework-engine:api-key:gemini'));
    const hasOllama = Boolean(localStorage.getItem('framework-engine:ollama-enabled') === 'true');
    setHasProviderKey(hasOpenAI || hasAnthropic || hasGemini || hasOllama);
  }, []);

  const totalTokens = usageRecords.reduce((acc, u) => acc + u.promptTokens + u.completionTokens, 0);

  const handleStart1On1 = async (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;

    const newChatId = 'chat-' + Date.now();
    await db.chats.add({
      id: newChatId,
      title: `1-on-1 with ${persona.name}`,
      type: '1-on-1',
      personaId: persona.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    router.push(`/chat/1-on-1/${newChatId}`);
  };

  return (
    <Shell>
      <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
        {/* N6 Newspaper Masthead Header */}
        <header className="border-b-2 border-[var(--color-ink)] pb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            <span>Vol. I — Executive Studio</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl text-[var(--color-ink)] leading-none tracking-tight">
            Cognitive Studio & Dilemma Debater
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] font-body max-w-2xl">
            Synthesize competing perspectives, challenge mental models, and resolve complex personal and strategic decisions.
          </p>
        </header>

        {/* Generation Gate Banner if no key configured */}
        {!hasProviderKey && (
          <div className="p-4 bg-[var(--color-warning)]/10 border border-[var(--color-warning)] rounded-[var(--radius-md)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--color-warning)] shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[var(--color-ink)]">
                  Read-Only Mode — No API Provider Configured
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">
                  Generation is currently disabled. Configure an API key or local Ollama connection to start persona debates.
                </div>
              </div>
            </div>
            <Link href="/onboarding" className="btn-hallmark btn-hallmark-primary text-xs shrink-0">
              Configure Keys
            </Link>
          </div>
        )}

        {/* 01 · Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tile 1: Persona Groups Grid (Spans 2 cols) */}
          <div className="md:col-span-2 p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
              <div>
                <span className="font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                  01 // Saved Rosters
                </span>
                <h2 className="font-display text-2xl text-[var(--color-ink)]">Persona Groups Overview</h2>
              </div>
              <Link href="/personas" className="btn-hallmark text-xs gap-1">
                <Plus className="w-3.5 h-3.5" /> Group Editor
              </Link>
            </div>

            {groups.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] space-y-3">
                <Users className="w-8 h-8 text-[var(--color-ink-faint)] mx-auto" />
                <div className="text-sm text-[var(--color-ink-muted)] font-medium">No custom persona groups created yet.</div>
                <p className="text-xs text-[var(--color-ink-faint)] max-w-sm mx-auto">
                  Combine Stoic, VC, Socratic, and CTO personas into custom Councils to deconstruct dilemmas.
                </p>
                <Link href="/personas" className="btn-hallmark text-xs inline-flex">
                  Create First Group
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((group) => (
                  <div key={group.id} className="p-4 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg text-[var(--color-ink)]">{group.name}</h3>
                      <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">{group.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-hairline)]">
                      <span className="text-[10px] font-mono text-[var(--color-ink-faint)]">
                        {group.personaIds.length} Personas
                      </span>
                      <button
                        onClick={() => router.push(`/personas`)}
                        className="text-xs text-[var(--color-accent)] font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Launch Council <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tile 2: Usage Analytics Widget */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] flex flex-col justify-between space-y-4">
            <div>
              <span className="font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                02 // Local Metrics
              </span>
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Token Consumption</h2>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                Extracted directly from SSE payloads. Zero remote telemetry.
              </p>
            </div>

            <div className="space-y-4 my-4">
              <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)]">
                <div className="text-xs text-[var(--color-ink-muted)] uppercase tracking-wider font-mono">Total Tokens Passed</div>
                <div className="font-display text-4xl text-[var(--color-ink)] mt-1">{totalTokens.toLocaleString()}</div>
              </div>

              <div className="flex justify-between text-xs text-[var(--color-ink-muted)] px-1">
                <span>Active Personas: {personas.length}</span>
                <span>Saved Groups: {groups.length}</span>
              </div>
            </div>

            <Link href="/analytics" className="btn-hallmark text-xs w-full text-center">
              View Detailed Analytics
            </Link>
          </div>

          {/* Tile 3: Quick 1-on-1 Personas Launcher */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
            <span className="font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
              03 // Quick Start
            </span>
            <h2 className="font-display text-2xl text-[var(--color-ink)]">1-on-1 Perspective</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Consult an individual persona for focused reflection.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {personas.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleStart1On1(p.id)}
                  className="w-full p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] text-left hover:border-[var(--color-accent)] transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                      {p.name}
                    </div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{p.role}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-ink-faint)] group-hover:text-[var(--color-accent)] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Tile 4: Recent History (Spans 2 cols) */}
          <div className="md:col-span-2 p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
              <div>
                <span className="font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                  04 // History
                </span>
                <h2 className="font-display text-2xl text-[var(--color-ink)]">Recent Sessions</h2>
              </div>
            </div>

            {recentChats.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-ink-muted)] italic">
                No recent sessions found. Select a persona above to start your first session.
              </div>
            ) : (
              <div className="space-y-2">
                {recentChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={chat.type === 'council' ? `/chat/council/${chat.id}` : `/chat/1-on-1/${chat.id}`}
                    className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between hover:border-[var(--color-ink-muted)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" />
                      <div>
                        <div className="text-sm font-medium text-[var(--color-ink)]">{chat.title}</div>
                        <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                          {chat.type.toUpperCase()} • Updated {new Date(chat.updatedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--color-ink-faint)]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ft1 Mast-headed Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-ink-faint)] gap-4">
          <div>Council of Minds © 2026 — Local-First Open Source Architecture</div>
          <div className="flex items-center gap-4">
            <Link href="/personas" className="hover:underline">Library</Link>
            <Link href="/analytics" className="hover:underline">Analytics</Link>
            <Link href="/settings" className="hover:underline">Settings</Link>
          </div>
        </footer>
      </div>
    </Shell>
  );
}
