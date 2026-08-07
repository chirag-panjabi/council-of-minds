'use client';

import React, { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import {
  BookOpen,
  Sparkles,
  Cpu,
  Shield,
  Brain,
  Zap,
  Terminal,
  Key,
  Users,
  GitFork,
  History,
  Share2,
  Code,
  Layers,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

type DocSection = 'overview' | 'personas' | 'councils' | 'models' | 'shortcuts';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocSection>('overview');

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border-hairline)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
              <BookOpen className="w-4 h-4" /> System Knowledgebase
            </div>
            <h1 className="font-display text-4xl font-normal text-[var(--color-ink)]">
              Documentation & User Guide
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Architecture • Persona Directives • Multi-Agent Protocols • Provider Keys
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/personas"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Brain className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Persona Library
            </Link>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 border-b border-[var(--color-border-hairline)] pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: '1. Architecture & BYOK', icon: Shield },
            { id: 'personas', label: '2. Persona Studio', icon: Brain },
            { id: 'councils', label: '3. Multi-Agent Councils', icon: Users },
            { id: 'models', label: '4. Dynamic Models', icon: Cpu },
            { id: 'shortcuts', label: '5. Power User Guide', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DocSection)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[var(--radius-sm)] text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                  isActive
                    ? 'bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-accent)] font-semibold shadow-sm'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Sections */}
        <main className="space-y-8">
          {/* 1. Architecture & BYOK */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Bring Your Own Key (BYOK) Architecture</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Stateless backend, zero server persistence, client-side IndexedDB</p>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                  Council of Minds operates on a completely <strong>stateless, open-source BYOK architecture</strong>. All user state (chat histories, custom personas, revision records, and API credentials) is saved exclusively inside your browser’s local storage and IndexedDB.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold">
                      <Key className="w-4 h-4" /> Secure Key Management
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      API keys for OpenAI, Anthropic, Google Gemini, OpenRouter, and Ollama exist strictly in browser memory and local storage. The backend server proxy never persists, logs, or writes API keys to disk.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold">
                      <Layers className="w-4 h-4" /> Client-Side IndexedDB Storage
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      All persona directives, council group rosters, and chat transcripts are stored locally using Dexie.js. No central database connection is required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Persona Studio */}
          {activeTab === 'personas' && (
            <div className="space-y-6">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Persona Studio & Directive Engineering</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Creating, testing, rules building, and share codes</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                      <Sparkles className="w-4 h-4" /> Advanced Rules Builder
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Inject structured constraints into persona directives: <strong>Tone</strong> (e.g. Socratic, Pragmatic), <strong>Style</strong> (e.g. Concise, Bulleted), <strong>Taboo</strong> (forbidden topics/words), and <strong>Formatting</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                      <Zap className="w-4 h-4" /> Test Prompt Sandbox
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Test persona system prompts live with any provider model (OpenRouter, Gemini, OpenAI, Claude, Ollama) before committing changes.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                      <History className="w-4 h-4" /> Revision History & Rollbacks
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Every save creates a numbered persona revision snapshot. Review past versions and restore previous system prompts with a single click.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                      <Share2 className="w-4 h-4" /> Export & Import Share Codes
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Export any persona as a compact Base64 share code. Import custom personas into your local library with automatic collision handling (skip, duplicate, overwrite).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Multi-Agent Councils */}
          {activeTab === 'councils' && (
            <div className="space-y-6">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Multi-Agent Council Debates</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Executive boards, roster groups, and neural synthesizer consensus</p>
                  </div>
                </div>

                <p className="text-xs text-[var(--color-ink)] leading-relaxed">
                  Council Debates allow you to assemble specialized rosters of personas to analyze complex strategic dilemmas from multiple conflicting angles simultaneously.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold">
                      <GitFork className="w-4 h-4" /> 1. Individual Stances (Round 1)
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      Each persona in the council evaluates the user's prompt independently according to their cognitive framework and directives.
                    </p>
                  </div>

                  <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold">
                      <Cpu className="w-4 h-4" /> 2. Neural Judge Synthesis
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                      The designated <strong>Synthesizer Persona</strong> (Neural Judge) correlates all individual perspectives, identifies trade-offs, and issues a final consensus report.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Dynamic Models */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Dynamic Model Selector & Providers</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Live catalog fetching, local Ollama models, and streaming resilience</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-[var(--color-ink)] leading-relaxed">
                  <p>
                    The <code>DynamicModelSelector</code> component dynamically queries provider model catalogs to give you instant access to any available model:
                  </p>

                  <ul className="space-y-2 list-disc list-inside font-mono text-[var(--color-ink-muted)]">
                    <li><strong>OpenRouter</strong>: Fetches hundreds of live models (including free tier models like <code>meta-llama/llama-3.3-70b-instruct:free</code>).</li>
                    <li><strong>Ollama (Local)</strong>: Automatically queries local <code>http://localhost:11434</code> instances for downloaded models.</li>
                    <li><strong>OpenAI / Anthropic / Gemini</strong>: Access flagship models like GPT-4o, Claude 3.5 Sonnet, and Gemini 2.0 Flash.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 5. Power User Guide */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Power User Guide & Shortcuts</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Command Palette, keyboard navigation, and prompt metering</p>
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--color-ink)] font-semibold">Command Palette Search</span>
                    <kbd className="font-mono text-xs bg-[var(--color-paper-3)] border border-[var(--color-border)] px-2 py-0.5 rounded text-[var(--color-accent)]">
                      ⌘ /
                    </kbd>
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    Press <code>⌘/</code> (or <code>Ctrl+/</code>) anywhere in the application to instantly open the Search Palette. Search across all persona definitions, active chat sessions, and council rosters.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Shell>
  );
}
