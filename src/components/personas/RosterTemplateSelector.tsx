'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import type { PersonaGroup } from '@/types';
import { Sparkles, Users, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* Hallmark · genre: editorial · theme: studio · spec: spec_persona_groups.md */

interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  personaNames: string[];
  roles: string[];
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'tmpl-exec-board',
    name: 'Executive Leadership Board',
    description: 'Balanced C-suite perspective covering Strategy, Finance, Engineering, and Risk.',
    personaNames: ['Strategic Operator', 'Risk & Compliance Auditor', 'Systems Architect', 'Empathetic Facilitator'],
    roles: ['CEO Strategy', 'Risk Management', 'Tech Infrastructure', 'Team Alignment'],
  },
  {
    id: 'tmpl-sci-review',
    name: 'Scientific Peer Review Panel',
    description: 'Rigor-driven academic dialectic reviewing methodological validity and evidence.',
    personaNames: ['Socratic Skeptic', 'Dialectic Philosopher', 'Systems Architect'],
    roles: ['Methodology Audit', 'Epistemology', 'Technical Soundness'],
  },
  {
    id: 'tmpl-product-council',
    name: 'Product & Design Strategy Council',
    description: 'User-centric product review balancing UX aesthetics, technical architecture, and market risk.',
    personaNames: ['UX & Design Critic', 'Strategic Operator', 'Systems Architect'],
    roles: ['User Experience', 'Market Strategy', 'Tech Feasibility'],
  },
  {
    id: 'tmpl-ethics-panel',
    name: 'Ethical Oversight & Governance',
    description: 'Proactive evaluation of AI safety, legal compliance, and long-term societal impact.',
    personaNames: ['Risk & Compliance Auditor', 'Dialectic Philosopher', 'Empathetic Facilitator'],
    roles: ['Regulatory Compliance', 'Ethical Standards', 'Stakeholder Care'],
  },
];

export function RosterTemplateSelector() {
  const router = useRouter();
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);

  const handleUseTemplate = async (tmpl: TemplatePreset) => {
    const allPersonas = await db.personas.toArray();

    // Match persona IDs by name fallback to first available
    const matchedIds = tmpl.personaNames
      .map((name) => allPersonas.find((p) => p.name.toLowerCase().includes(name.toLowerCase()))?.id)
      .filter(Boolean) as string[];

    const finalIds = matchedIds.length > 0 ? matchedIds : allPersonas.slice(0, 3).map((p) => p.id);

    const newGroup: PersonaGroup = {
      id: 'group-' + Date.now(),
      name: tmpl.name,
      description: tmpl.description,
      personaIds: finalIds,
      synthesizerPersonaId: finalIds[0],
      createdAt: Date.now(),
    };

    await db.groups.add(newGroup);
    setCreatedTemplateId(tmpl.id);
    setTimeout(() => {
      router.push(`/chat/council/new?group=${newGroup.id}`);
    }, 600);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--color-accent)]" /> Curated Roster Templates
        </h2>
        <span className="text-xs font-mono text-[var(--color-ink-muted)]">1-Click Launch</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATE_PRESETS.map((tmpl) => {
          const isJustCreated = createdTemplateId === tmpl.id;
          return (
            <div
              key={tmpl.id}
              onClick={() => handleUseTemplate(tmpl)}
              className={`p-5 rounded-[var(--radius-md)] border transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
                isJustCreated
                  ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)]'
                  : 'bg-[var(--color-paper-2)] border-[var(--color-border-hairline)] hover:border-[var(--color-accent)] hover:bg-[var(--color-paper)]'
              }`}
            >
              <div className="space-y-2">
                <div className="font-display text-lg text-[var(--color-ink)] flex items-center justify-between">
                  <span>{tmpl.name}</span>
                  {isJustCreated ? (
                    <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Launching...
                    </span>
                  ) : (
                    <Users className="w-4 h-4 text-[var(--color-accent)] opacity-60 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">{tmpl.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--color-border-hairline)]">
                <div className="flex flex-wrap gap-1.5">
                  {tmpl.roles.map((r) => (
                    <span
                      key={r}
                      className="px-2 py-0.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-[10px] font-mono text-[var(--color-ink-muted)]"
                    >
                      {r}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[var(--color-accent)] group-hover:underline pt-1">
                  <span>Launch Council Debate</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
