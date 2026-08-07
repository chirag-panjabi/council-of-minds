'use client';

import React from 'react';
import { Shell } from '@/components/layout/Shell';
import { BookOpen, Sparkles, Cpu, Shield, Brain, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
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
              Architectural Specifications • Persona Directives • Multi-Agent Protocols
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

        {/* Documentation Content Placeholder Container */}
        <main className="space-y-6">
          <div className="p-8 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 pb-6 border-b border-[var(--color-border-hairline)]">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-2xl text-[var(--color-ink)]">
                  Council of Minds Documentation
                </h2>
                <p className="text-xs font-mono text-[var(--color-ink-muted)]">
                  Comprehensive reference guide and technical specifications.
                </p>
              </div>
            </div>

            {/* Content Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                  <Brain className="w-4 h-4" /> Persona Engineering
                </div>
                <h3 className="font-display text-base text-[var(--color-ink)]">Persona Directives & Rules</h3>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  Detailed guides on crafting cognitive frameworks, system prompts, taboo rules, and behavioral directives.
                </p>
              </div>

              <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                  <Cpu className="w-4 h-4" /> Multi-Agent Debates
                </div>
                <h3 className="font-display text-base text-[var(--color-ink)]">Council Protocol & Orchestration</h3>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  Explanations of multi-round synthesis, neural judge evaluation, voting mechanisms, and consensus reports.
                </p>
              </div>

              <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                  <Shield className="w-4 h-4" /> Security & Privacy
                </div>
                <h3 className="font-display text-base text-[var(--color-ink)]">BYOK Stateless Architecture</h3>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  Details on client-side storage, key protection, proxy handling, and zero server persistence.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Shell>
  );
}
