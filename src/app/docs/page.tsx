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
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Lock,
  Radio,
  BarChart2,
  Sliders,
  FileText,
  Command,
  Check,
  Scale,
  MessageSquare,
  ShieldAlert,
  Workflow,
  FileCode,
  CornerDownRight,
} from 'lucide-react';
import Link from 'next/link';

type DocSection = 'overview' | 'personas' | 'councils' | 'models' | 'prompts' | 'shortcuts';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocSection>('prompts');

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border-hairline)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
              <BookOpen className="w-4 h-4" /> Comprehensive System Manual
            </div>
            <h1 className="font-display text-4xl font-normal text-[var(--color-ink)]">
              Documentation & User Guide
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Architecture • Persona Directives • Multi-Agent Protocols • Prompt Flows
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
            { id: 'prompts', label: '5. Prompt Engineering & Flow', icon: Workflow },
            { id: 'shortcuts', label: '6. Power User Guide', icon: Terminal },
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
          {/* ========================================================================= */}
          {/* 1. Architecture, Privacy & BYOK Deep Dive */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-hairline)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Bring Your Own Key (BYOK) Architecture</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Stateless backend, zero server persistence, client-side IndexedDB</p>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none text-xs text-[var(--color-ink)] leading-relaxed space-y-4 font-mono">
                  <p>
                    <strong>Council of Minds</strong> is built from the ground up to adhere to strict <strong>Bring Your Own Key (BYOK) privacy principles</strong>. No user credentials, persona definitions, or chat conversations are stored on external server databases.
                  </p>
                </div>

                {/* Key Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                      <Lock className="w-4 h-4" /> 1. Local Storage Security
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed font-mono">
                      API keys are saved exclusively in your web browser’s <code>localStorage</code>. Keys are only read in memory when constructing API requests and are never written to disk or logged by the backend proxy.
                    </p>
                    <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded text-[11px] font-mono text-[var(--color-ink-muted)] space-y-1">
                      <div><strong className="text-[var(--color-ink)]">Storage Keys:</strong></div>
                      <div>• <code>framework-engine:openai-key</code></div>
                      <div>• <code>framework-engine:anthropic-key</code></div>
                      <div>• <code>framework-engine:gemini-key</code></div>
                      <div>• <code>framework-engine:openrouter-key</code></div>
                      <div>• <code>framework-engine:ollama-enabled</code></div>
                    </div>
                  </div>

                  <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                      <Database className="w-4 h-4" /> 2. IndexedDB Client Database
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed font-mono">
                      All personas, custom rules, council group rosters, and chat transcripts are stored locally using <strong>Dexie.js (IndexedDB)</strong> inside your browser sandbox.
                    </p>
                    <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded text-[11px] font-mono text-[var(--color-ink-muted)] space-y-1">
                      <div><strong className="text-[var(--color-ink)]">IndexedDB Tables:</strong></div>
                      <div>• <code>personas</code> — Custom & official system personas</div>
                      <div>• <code>groups</code> — Multi-agent council rosters</div>
                      <div>• <code>chats</code> — 1-on-1 & Council chat sessions</div>
                      <div>• <code>messages</code> — Streamed chat message records</div>
                      <div>• <code>usage</code> — Local token usage analytics</div>
                    </div>
                  </div>
                </div>

                {/* Local Ollama Setup Callout */}
                <div className="p-5 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-accent)] font-semibold uppercase">
                    <Radio className="w-4 h-4" /> Local Ollama Integration Guide
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed font-mono">
                    To use local models (e.g. <code>llama3</code>, <code>mistral</code>, <code>deepseek-r1</code>) with zero external network access, start your local Ollama instance with CORS permissions enabled:
                  </p>
                  <pre className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-[11px] font-mono text-[var(--color-accent)] overflow-x-auto">
                    OLLAMA_ORIGINS="*" ollama serve
                  </pre>
                  <p className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                    Then enable <strong>Ollama Local Provider</strong> in Settings (`/settings`). The Dynamic Model Selector will automatically query <code>http://localhost:11434/api/tags</code> for your locally pulled models!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. Persona Studio & Directive Engineering Manual */}
          {/* ========================================================================= */}
          {activeTab === 'personas' && (
            <div className="space-y-8">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-hairline)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Persona Studio & Directive Engineering Manual</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">System prompts, rules engine, test sandbox, revision rollbacks, share codes</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Persona Components */}
                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-[var(--color-ink)]">1. Anatomy of a Persona Definition</h3>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed font-mono">
                      Every persona consists of core metadata and explicit system prompt directives that govern its analytical perspective:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs space-y-1 font-mono">
                        <div><strong className="text-[var(--color-ink)]">Name & Role:</strong> Identifies identity (e.g. <em>Marcus Aurelius</em>) and specialization (e.g. <em>Stoic Philosopher & Emperor</em>).</div>
                      </div>
                      <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs space-y-1 font-mono">
                        <div><strong className="text-[var(--color-ink)]">System Prompt Directives:</strong> Explicit instructions specifying reasoning methodology, stance, and decision-making criteria.</div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Rules Engine */}
                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-[var(--color-ink)]">2. Advanced Rules Engine</h3>
                    <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed font-mono">
                      The Advanced Rules Builder allows injecting fine-grained behavioral constraints that are automatically appended to the system prompt:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
                      <div className="p-3.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs space-y-1 font-mono">
                        <div className="text-[var(--color-accent)] font-semibold uppercase">Tone Rules</div>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">Controls emotional stance (e.g. Socratic questioning, Academic rigor, Brutally honest).</p>
                      </div>
                      <div className="p-3.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs space-y-1 font-mono">
                        <div className="text-[var(--color-accent)] font-semibold uppercase">Style Rules</div>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">Controls output structure (e.g. Bulleted lists, Concise paragraphs, Executive summaries).</p>
                      </div>
                      <div className="p-3.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs space-y-1 font-mono">
                        <div className="text-[var(--color-accent)] font-semibold uppercase">Taboo Constraints</div>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">Strict negative constraints forbidding specific words, disclaimers, or AI references.</p>
                      </div>
                      <div className="p-3.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs space-y-1 font-mono">
                        <div className="text-[var(--color-accent)] font-semibold uppercase">Formatting</div>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">Enforces code blocks, markdown tables, or mathematical notation.</p>
                      </div>
                    </div>
                  </div>

                  {/* Sandbox & Version History */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold uppercase">
                        <Zap className="w-4 h-4" /> Test Prompt Sandbox
                      </div>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed">
                        Before saving a persona, test how it responds to test prompts using any provider model in real-time. Verify directive adherence instantly.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2 font-mono text-xs">
                      <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold uppercase">
                        <History className="w-4 h-4" /> Version Snapshots & Rollbacks
                      </div>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed">
                        Saving changes creates a numbered version snapshot (`v1`, `v2`, `v3`). Click <strong>Revision History</strong> on any persona edit page to restore prior states.
                      </p>
                    </div>
                  </div>

                  {/* Share Codes Schema */}
                  <div className="p-4 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded space-y-2 font-mono text-xs">
                    <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold uppercase">
                      <Share2 className="w-4 h-4" /> Base64 Share Code Protocol (`framework-engine.persona/v1`)
                    </div>
                    <p className="text-[var(--color-ink-muted)] leading-relaxed">
                      You can share custom personas with team members using Base64 share strings. Click <strong>Share Persona</strong> on any custom persona to copy its code, or use <strong>Import Persona</strong> to import shared codes into your library.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. Multi-Agent Council Debates Masterclass */}
          {/* ========================================================================= */}
          {activeTab === 'councils' && (
            <div className="space-y-8">
              {/* Introduction Card */}
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-hairline)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Multi-Agent Council Debates Masterclass</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Roster engineering, 3-phase debate workflow, Neural Judge synthesis, and battle-tested templates</p>
                  </div>
                </div>

                <div className="space-y-4 text-xs font-mono text-[var(--color-ink)] leading-relaxed">
                  <p>
                    Single-agent AI prompts frequently suffer from <strong>cognitive blind spots, confirmation bias, and uncritical agreement</strong>. When presented with a complex strategic question, a single model tends to offer an over-generalized response without stress-testing risky assumptions.
                  </p>
                  <p>
                    <strong>Council of Minds</strong> solves this by implementing a <strong>Multi-Agent Debate & Synthesis Architecture</strong>. Instead of asking one model for advice, your prompt is dispatched to a specialized council of distinct personas—each with opposing cognitive frameworks, risk tolerances, and priorities.
                  </p>
                </div>

                {/* 3-Phase Debate Execution Pipeline */}
                <div className="space-y-6 pt-4 border-t border-[var(--color-border-hairline)]">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl text-[var(--color-ink)] font-normal font-sans">The 3-Phase Debate Pipeline</h3>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">How a user prompt progresses through asynchronous council debate rounds</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Phase 1 */}
                    <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 font-mono text-xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-accent)] font-semibold uppercase tracking-wider text-[11px]">Phase 1</span>
                          <span className="px-2 py-0.5 bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded text-[10px] text-[var(--color-ink-muted)]">Parallel Dispatch</span>
                        </div>
                        <h4 className="font-display text-base text-[var(--color-ink)] font-sans">Individual Stances</h4>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Your query is dispatched simultaneously to all member personas in the roster. Every persona independently evaluates the problem using its specific system directives and rules.
                        </p>
                      </div>
                      <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded text-[10px] text-[var(--color-ink-faint)] space-y-1">
                        <div><strong>Execution:</strong> Async parallel stream</div>
                        <div><strong>Output:</strong> Member Stance Panels</div>
                      </div>
                    </div>

                    {/* Phase 2 */}
                    <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 font-mono text-xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-accent)] font-semibold uppercase tracking-wider text-[11px]">Phase 2</span>
                          <span className="px-2 py-0.5 bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded text-[10px] text-[var(--color-ink-muted)]">Cross-Exam</span>
                        </div>
                        <h4 className="font-display text-base text-[var(--color-ink)] font-sans">Rebuttal & Critique</h4>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Personas inspect the stance outputs of fellow council members. They challenge unverified claims, flag financial/technical risks, and counter opposing recommendations.
                        </p>
                      </div>
                      <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded text-[10px] text-[var(--color-ink-faint)] space-y-1">
                        <div><strong>Execution:</strong> Inter-persona evaluation</div>
                        <div><strong>Output:</strong> Critique & Counter-points</div>
                      </div>
                    </div>

                    {/* Phase 3 */}
                    <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 font-mono text-xs flex flex-col justify-between border-l-2 border-l-[var(--color-accent)]">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-accent)] font-semibold uppercase tracking-wider text-[11px]">Phase 3</span>
                          <span className="px-2 py-0.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] rounded text-[10px] font-semibold">Synthesis</span>
                        </div>
                        <h4 className="font-display text-base text-[var(--color-ink)] font-sans">Neural Judge Verdict</h4>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          The designated <strong>Synthesizer Persona (Neural Judge)</strong> correlates all stances, highlights key trade-offs, resolves disagreements, and generates a final executive report.
                        </p>
                      </div>
                      <div className="p-3 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded text-[10px] text-[var(--color-accent)] space-y-1">
                        <div><strong>Execution:</strong> Consensus correlation</div>
                        <div><strong>Output:</strong> Executive Verdict Report</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre-Built Battle-Tested Council Templates */}
                <div className="space-y-4 pt-6 border-t border-[var(--color-border-hairline)]">
                  <div className="space-y-1">
                    <h3 className="font-display text-xl text-[var(--color-ink)] font-normal font-sans">Battle-Tested Council Roster Templates</h3>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Pre-configured council rosters optimized for specific domain decisions</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 font-mono text-xs">
                    {/* Template 1 */}
                    <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-accent)] font-semibold uppercase tracking-wider text-[10px]">Strategic Board</span>
                          <Users className="w-4 h-4 text-[var(--color-accent)]" />
                        </div>
                        <h4 className="font-display text-base text-[var(--color-ink)] font-sans">Executive Leadership Board</h4>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Ideal for business strategy, fundraising, pivot decisions, and market expansion dilemmas.
                        </p>
                        <div className="space-y-1.5 pt-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Growth Strategist</strong> (Scale & Opportunity)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Risk Manager</strong> (Financial Liabilities)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Tech Architect</strong> (Feasibility & Speed)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)] text-semibold" /> <strong>Synthesizer:</strong> Neural Judge</div>
                        </div>
                      </div>
                    </div>

                    {/* Template 2 */}
                    <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-accent)] font-semibold uppercase tracking-wider text-[10px]">Product Board</span>
                          <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                        </div>
                        <h4 className="font-display text-base text-[var(--color-ink)] font-sans">Product & UX Council</h4>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Optimized for feature planning, UX redesigns, user onboarding flows, and customer retention strategies.
                        </p>
                        <div className="space-y-1.5 pt-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Product Manager</strong> (User Value & Metrics)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>UX Designer</strong> (Usability & Friction)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Customer Advocate</strong> (User Empathy)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Synthesizer:</strong> Product Director</div>
                        </div>
                      </div>
                    </div>

                    {/* Template 3 */}
                    <div className="p-5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-accent)] font-semibold uppercase tracking-wider text-[10px]">Engineering Board</span>
                          <Code className="w-4 h-4 text-[var(--color-accent)]" />
                        </div>
                        <h4 className="font-display text-base text-[var(--color-ink)] font-sans">Software Architecture Board</h4>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Designed for refactoring audits, database schema design, API contract reviews, and security hardening.
                        </p>
                        <div className="space-y-1.5 pt-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Security Auditor</strong> (Vulnerabilities)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Performance Engineer</strong> (Latency & LCP)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Clean Code Craftsman</strong> (Refactoring)</div>
                          <div className="flex items-center gap-1.5 text-[var(--color-ink)]"><Check className="w-3 h-3 text-[var(--color-accent)]" /> <strong>Synthesizer:</strong> Principal Architect</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Management Guide */}
                <div className="p-5 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-[var(--color-accent)] font-semibold uppercase">
                    <Users className="w-4 h-4" /> Managing Council Groups (`/personas/groups`)
                  </div>
                  <p className="text-[var(--color-ink-muted)] leading-relaxed">
                    Navigate to <strong>Council Groups</strong> in the sidebar to create, edit, or customize council rosters. You can add or remove members, swap out synthesizer personas, and create custom boards tailored to your exact project workflow!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. Dynamic Model Selector & Providers */}
          {/* ========================================================================= */}
          {activeTab === 'models' && (
            <div className="space-y-8">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-hairline)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Dynamic Model Selector & Provider Ecosystem</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Live catalog fetching, streaming SSE resilience, and token metering</p>
                  </div>
                </div>

                <div className="space-y-6 text-xs font-mono text-[var(--color-ink)] leading-relaxed">
                  <div className="space-y-3">
                    <h3 className="font-display text-lg text-[var(--color-ink)] font-normal font-sans">Supported Provider Models</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-2">
                        <div className="text-[var(--color-accent)] font-semibold">OpenRouter Catalog</div>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Fetches hundreds of open-source and proprietary models live. Supports free tier models (e.g. <code>meta-llama/llama-3.3-70b-instruct:free</code>) and custom auto-routing.
                        </p>
                      </div>

                      <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-2">
                        <div className="text-[var(--color-accent)] font-semibold">Local Ollama Server</div>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Auto-discovers locally pulled models from <code>http://localhost:11434</code> for completely offline, zero-cost AI execution.
                        </p>
                      </div>

                      <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-2">
                        <div className="text-[var(--color-accent)] font-semibold">OpenAI & Anthropic</div>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Direct support for GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet, and Claude 3 Opus with API key authentication.
                        </p>
                      </div>

                      <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-2">
                        <div className="text-[var(--color-accent)] font-semibold">Google Gemini</div>
                        <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                          Native integration with Gemini 2.0 Flash and Gemini 1.5 Pro via Gemini API keys.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Streaming & Retention */}
                  <div className="p-4 bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] rounded space-y-2">
                    <div className="text-[var(--color-accent)] font-semibold uppercase">Resilient SSE Token Streaming</div>
                    <p className="text-[var(--color-ink-muted)] text-[11px] leading-relaxed">
                      All chat interactions stream real-time tokens using Server-Sent Events (`data: [JSON]`). Resilient chunk parsers extract text content across standard OpenAI delta formats, OpenRouter chunks, and raw text streams cleanly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. Prompt Engineering & Execution Flow Masterclass */}
          {/* ========================================================================= */}
          {activeTab === 'prompts' && (
            <div className="space-y-8">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-hairline)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Prompt Engineering & Execution Flow Masterclass</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)] font-mono">System prompt assembly, dispatch conditions, context retention, and edge cases</p>
                  </div>
                </div>

                {/* System Prompt Assembly Formula */}
                <div className="space-y-4 font-mono text-xs text-[var(--color-ink)]">
                  <h3 className="font-display text-lg font-normal font-sans">1. System Prompt Compilation Assembly</h3>
                  <p className="text-[var(--color-ink-muted)] leading-relaxed">
                    Whenever an AI request is constructed, the final system prompt is compiled by combining the base persona prompt directives with active rules from the Advanced Rules Engine:
                  </p>

                  <pre className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-[11px] text-[var(--color-accent)] overflow-x-auto">
{`Final System Prompt = persona.systemPrompt.trim() + formatRulesBlock(persona.advancedRules)

[ADVANCED RULES DIRECTIVES]
• TONE RULES: [Active Tone Rules]
• STYLE RULES: [Active Style Rules]
• TABOO CONSTRAINTS: [Active Taboo Rules - Do not mention X, Y, Z]
• FORMATTING: [Active Formatting Constraints - Use LaTeX / Markdown]`}</pre>
                </div>

                {/* Execution Flows by Condition Table */}
                <div className="space-y-4 pt-4 border-t border-[var(--color-border-hairline)] font-mono text-xs">
                  <h3 className="font-display text-lg font-normal text-[var(--color-ink)] font-sans">2. Execution Flows & Conditions</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-border-hairline)] bg-[var(--color-paper)] text-[var(--color-accent)] uppercase text-[11px]">
                          <th className="p-3">Interaction Mode</th>
                          <th className="p-3">System Message Sent</th>
                          <th className="p-3">User Prompt Payload</th>
                          <th className="p-3">Context Slicing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-hairline)] text-[var(--color-ink)] text-[11px]">
                        <tr>
                          <td className="p-3 font-semibold text-[var(--color-accent)]">1-on-1 Persona Chat</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Persona System Prompt + Active Rules</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">User input + File attachment content</td>
                          <td className="p-3 font-mono text-[var(--color-ink-faint)]">Sliced by retention (`last-5`, `last-10`, `all`)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--color-accent)]">Council Phase 1</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Member Persona System Prompt + Rules</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">User dilemma prompt</td>
                          <td className="p-3 font-mono text-[var(--color-ink-faint)]">Parallel dispatch to all members</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--color-accent)]">Council Phase 2</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Member Persona System Prompt + Rules</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Phase 1 member stance outputs for critique</td>
                          <td className="p-3 font-mono text-[var(--color-ink-faint)]">Inter-persona cross-examination</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-[var(--color-accent)]">Council Phase 3</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Synthesizer Persona Prompt (Neural Judge)</td>
                          <td className="p-3 text-[var(--color-ink-muted)]">User Query + All Phase 1 Stances + Phase 2 Critiques</td>
                          <td className="p-3 font-mono text-[var(--color-ink-faint)]">Consensus & Executive Verdict Report</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* System Edge Cases Breakdown */}
                <div className="space-y-4 pt-4 border-t border-[var(--color-border-hairline)] font-mono text-xs">
                  <h3 className="font-display text-lg font-normal text-[var(--color-ink)] font-sans">3. System Edge Cases & Failure Recovery Protocol</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-1.5">
                      <div className="text-[var(--color-accent)] font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" /> Edge Case 1: Empty System Prompt
                      </div>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed">
                        If a user saves a persona with an empty system prompt, the engine automatically injects a fallback directive: <em>"You are an analytical thought partner and reasoning framework."</em>
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-1.5">
                      <div className="text-[var(--color-accent)] font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-warning)]" /> Edge Case 2: Missing API Key (401)
                      </div>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed">
                        If the request header lacks an API key for the selected provider, the API proxy returns `401 Unauthorized`. The UI catches this error cleanly and presents the <strong>Configure Key</strong> modal prompt.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-1.5">
                      <div className="text-[var(--color-accent)] font-semibold flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[var(--color-warning)]" /> Edge Case 3: Ollama Connection Error
                      </div>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed">
                        If Ollama is offline or blocked by CORS at <code>http://localhost:11434</code>, the model catalog catches the network error and displays diagnostic instructions: <em>OLLAMA_ORIGINS="*" ollama serve</em>.
                      </p>
                    </div>

                    <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded space-y-1.5">
                      <div className="text-[var(--color-accent)] font-semibold flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Edge Case 4: Official Persona Editing
                      </div>
                      <p className="text-[var(--color-ink-muted)] leading-relaxed">
                        Official system personas (`isSystem: true`) are read-only. Editing an official persona automatically triggers <code>handleForkPersona()</code>, creating a user-owned custom copy with `custom-[timestamp]` ID.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. Power User Guide & Keyboard Shortcuts */}
          {/* ========================================================================= */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-8">
              <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-hairline)]">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-semibold shrink-0">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-[var(--color-ink)]">Power User Guide & Keyboard Shortcuts</h2>
                    <p className="text-xs font-mono text-[var(--color-ink-muted)]">Command Palette, fast navigation, and productivity tips</p>
                  </div>
                </div>

                {/* Keyboard Shortcuts Table */}
                <div className="space-y-4">
                  <h3 className="font-display text-lg text-[var(--color-ink)]">Keyboard Shortcuts Reference</h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-border-hairline)] bg-[var(--color-paper)] text-[var(--color-accent)] uppercase">
                          <th className="p-3">Shortcut</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Scope</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-hairline)] text-[var(--color-ink)]">
                        <tr>
                          <td className="p-3 font-semibold"><kbd className="bg-[var(--color-paper-3)] border border-[var(--color-border)] px-2 py-1 rounded text-[var(--color-accent)]">⌘ /</kbd> or <kbd className="bg-[var(--color-paper-3)] border border-[var(--color-border)] px-2 py-1 rounded text-[var(--color-accent)]">Ctrl /</kbd></td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Open Command Palette Search</td>
                          <td className="p-3">Global Application</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold"><kbd className="bg-[var(--color-paper-3)] border border-[var(--color-border)] px-2 py-1 rounded text-[var(--color-accent)]">Ctrl Enter</kbd></td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Send Message / Submit Prompt</td>
                          <td className="p-3">Chat Input Area</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold"><kbd className="bg-[var(--color-paper-3)] border border-[var(--color-border)] px-2 py-1 rounded text-[var(--color-accent)]">Esc</kbd></td>
                          <td className="p-3 text-[var(--color-ink-muted)]">Close Search Palette / Modals</td>
                          <td className="p-3">Modals & Overlays</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Shell>
  );
}
