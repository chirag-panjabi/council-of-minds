'use client';

import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { ShieldCheck, Lock, Cpu, AlertTriangle, ArrowLeft } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 02-long-document · theme: newsprint · nav: N1a · footer: Ft1 */

export default function PrivacyPage() {
  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-3xl mx-auto space-y-10">
        {/* N1a Broad-sheet Navigation Header */}
        <header className="border-b border-[var(--color-border-hairline)] pb-4 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Return to Dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            Public Disclosure Document
          </div>
        </header>

        {/* 02 · Long Document Macrostructure Content */}
        <article className="space-y-8 prose text-[var(--color-ink)]">
          <div className="border-b-2 border-[var(--color-ink)] pb-4 space-y-2">
            <div className="text-xs font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
              Document Ref: PRIVACY-SAFETY-V1.0 • Updated July 2026
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-normal leading-tight text-[var(--color-ink)]">
              Privacy, Security, and Data Boundaries
            </h1>
            <p className="text-base text-[var(--color-ink-muted)] font-body leading-relaxed">
              An uncompromised memo explaining local browser data sovereignty, stateless proxy transit guarantees, local LLM boundaries, and safety disclaimers.
            </p>
          </div>

          {/* Section 1: Local Data Sovereignty */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] font-mono uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> 1.0 Local Data Sovereignty
            </div>
            <h2 className="font-display text-2xl text-[var(--color-ink)]">Your Data Belongs Exclusively to Your Browser</h2>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Council of Minds operates on a <strong>100% Client-Side Storage</strong> architecture. All your conversation histories, custom personas, persona groups, attachments, and settings are stored locally inside your browser’s IndexedDB database (<code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">CouncilOfMindsDB</code>) and localStorage.
            </p>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              There is zero server-side database (no PostgreSQL, MongoDB, or cloud backup buckets). If you clear your browser cache or reset site data, your local information is purged unless you export a <code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">.json</code> database backup from Settings.
            </p>
          </section>

          <div className="hairline-divider" />

          {/* Section 2: Stateless Proxy Boundary */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] font-mono uppercase tracking-wider">
              <Lock className="w-4 h-4" /> 2.0 Stateless API Proxy Boundary
            </div>
            <h2 className="font-display text-2xl text-[var(--color-ink)]">How Cloud API Keys & Streaming Transit</h2>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              When you interact with cloud LLM providers (OpenAI, Anthropic, Google Gemini), requests pass through a same-origin stateless proxy route (<code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">/api/chat</code>) executing on the Edge Runtime.
            </p>
            <ul className="text-sm text-[var(--color-ink-muted)] space-y-1.5 list-disc pl-5">
              <li>Your API key is sent via HTTPS request headers (<code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">x-api-key</code>) directly from your browser.</li>
              <li>The proxy exists purely to bypass browser CORS restrictions and stream Server-Sent Events (SSE) back to your screen.</li>
              <li><strong>The proxy server never logs, prints, or persists your API key or prompt content.</strong> Once the stream finishes, request memory is immediately garbage collected.</li>
            </ul>
          </section>

          <div className="hairline-divider" />

          {/* Section 3: Local Engine Boundary */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] font-mono uppercase tracking-wider">
              <Cpu className="w-4 h-4" /> 3.0 Local LLM Engine Boundary (Ollama / LM Studio)
            </div>
            <h2 className="font-display text-2xl text-[var(--color-ink)]">Direct Browser-to-Loopback Connectivity</h2>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              If you configure a local LLM daemon (Ollama on <code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">http://localhost:11434</code> or LM Studio on <code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">http://localhost:1234</code>), requests travel <strong>browser → localhost loopback directly</strong>.
            </p>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              Cloud proxies are completely bypassed for local requests. No data or prompts leave your machine. You must ensure your local daemon allows CORS requests from your application domain (e.g., <code className="bg-[var(--color-paper-2)] px-1 font-mono text-xs">OLLAMA_ORIGINS</code>).
            </p>
          </section>

          <div className="hairline-divider" />

          {/* Section 4: Safety & Disclaimers */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-error)] font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" /> 4.0 Important Safety & Legal Disclaimers
            </div>
            <h2 className="font-display text-2xl text-[var(--color-ink)]">Accuracy, Medical & Legal Boundaries</h2>
            <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-2 text-xs text-[var(--color-ink-muted)] leading-relaxed">
              <p>
                <strong>Accuracy:</strong> Model outputs generated during multi-agent debates can be wrong, incomplete, or fabricated. Users must independently verify all material facts, citations, and calculations.
              </p>
              <p>
                <strong>Medical & Crisis Disclaimer:</strong> Council of Minds is an intellectual experimentation studio, NOT medical, mental-health, legal, or crisis advice. Someone in crisis must contact local emergency or crisis services immediately.
              </p>
              <p>
                <strong>Legal Drafting:</strong> Persona debates are private drafting and critique aids, not legal advice or a substitute for a licensed attorney.
              </p>
            </div>
          </section>
        </article>

        {/* Ft1 Mast-headed Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 flex items-center justify-between text-xs font-mono text-[var(--color-ink-faint)]">
          <div>Council of Minds Memo Ref: PRIVACY-SAFETY-V1.0</div>
          <Link
            href="/onboarding"
            aria-label="Back to Onboarding"
            className="text-[var(--color-accent)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
          >
            Back to Onboarding
          </Link>
        </footer>
      </div>
    </Shell>
  );
}
