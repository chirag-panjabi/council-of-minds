'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

/* Hallmark · component: ReadOnlyBanner · genre: studio · theme: studio · spec: spec_onboarding.md (§12.5) */

export function ReadOnlyBanner() {
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const openrouterKey = localStorage.getItem('framework-engine:api-key:openrouter') || localStorage.getItem('framework-engine:openrouter-key');
      const geminiKey = localStorage.getItem('framework-engine:api-key:gemini') || localStorage.getItem('framework-engine:gemini-key');
      const openaiKey = localStorage.getItem('framework-engine:api-key:openai') || localStorage.getItem('framework-engine:openai-key');
      const anthropicKey = localStorage.getItem('framework-engine:api-key:anthropic') || localStorage.getItem('framework-engine:anthropic-key');
      const ollamaKey = localStorage.getItem('framework-engine:api-key:ollama') || localStorage.getItem('framework-engine:ollama-enabled');

      const hasAnyKey = Boolean(
        openrouterKey?.trim() ||
        geminiKey?.trim() ||
        openaiKey?.trim() ||
        anthropicKey?.trim() ||
        ollamaKey === 'true'
      );

      setIsReadOnly(!hasAnyKey);
    }
  }, []);

  if (!isReadOnly) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs font-mono text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-2 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong className="font-semibold uppercase tracking-wider">Read-Only Exploration Mode</strong> — No API keys configured. Complete onboarding setup to enable live LLM turn generation.
        </span>
      </div>

      <Link
        href="/onboarding"
        className="btn-hallmark text-[11px] py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 border-amber-500/40 gap-1 focus:outline-none shrink-0"
      >
        <span>Setup API Keys</span> <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
