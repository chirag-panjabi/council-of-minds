'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { db } from '@/lib/db';
import { ArrowLeft, Save, Sparkles, Wand2 } from 'lucide-react';
import { DynamicModelSelector } from '@/components/ui/DynamicModelSelector';
import Link from 'next/link';

/* Hallmark · genre: editorial · macrostructure: form-surface · theme: atelier · nav: N1b · footer: Ft4 */

export default function NewPersonaPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [tagsInput, setTagsInput] = useState('Philosophy, Strategy');
  const [isSaving, setIsSaving] = useState(false);

  // AI Quick-Generate State
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuickGenerate = async () => {
    if (!quickPrompt.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      const provider = 'openai';
      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          systemPrompt: 'You are a Persona Directive Generator. Given a character name or prompt, output a JSON object with keys: name, role, description, systemPrompt, defaultModel, tags (array of strings). Do NOT wrap in markdown code blocks.',
          messages: [{ role: 'user', content: `Generate persona directives for: "${quickPrompt}"` }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const text = await res.text();
      const cleanJsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      if (parsed.name) setName(parsed.name);
      if (parsed.role) setRole(parsed.role);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.systemPrompt) setSystemPrompt(parsed.systemPrompt);
      if (parsed.defaultModel) setDefaultModel(parsed.defaultModel);
      if (parsed.tags && Array.isArray(parsed.tags)) setTagsInput(parsed.tags.join(', '));
    } catch (err: any) {
      // Fallback local heuristic generator if offline or error
      setName(quickPrompt.trim());
      setRole('Advisor & Specialist');
      setDescription(`Analytical reflection persona modeled after ${quickPrompt.trim()}.`);
      setSystemPrompt(`You are ${quickPrompt.trim()}. Analyze all user dilemmas through your unique philosophical stance and core principles. Be direct, structured, and insightful.`);
      setTagsInput('Analysis, Custom');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    setIsSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await db.personas.add({
      id: 'persona-' + Date.now(),
      name: name.trim(),
      role: role.trim() || 'Advisor',
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      defaultModel,
      tags,
      isArchived: false,
      createdAt: Date.now(),
    });

    router.push('/personas');
  };

  return (
    <Shell>
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
        {/* N1b Navigation Header */}
        <header className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
          <Link
            href="/personas"
            aria-label="Back to Persona Library"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            Persona Creator Surface
          </div>
        </header>

        {/* AI Quick-Generate Assistant Bar */}
        <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-accent)]/30 rounded-[var(--radius-lg)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[var(--color-accent)] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> AI Auto-Draft Assistant
            </div>
            <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">1-Click Directive Generator</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="e.g. Marcus Aurelius, Skeptical VC, or Friedrich Nietzsche..."
              className="flex-1 px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
            />
            <button
              type="button"
              onClick={handleQuickGenerate}
              disabled={isGenerating || !quickPrompt.trim()}
              aria-label="Auto-Draft Directives"
              className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isGenerating ? 'Drafting...' : 'Auto-Draft'}
            </button>
          </div>
        </div>

        {/* Form Surface */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 md:p-8">
          <div>
            <h1 className="font-display text-3xl text-[var(--color-ink)]">Draft New Persona</h1>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1 leading-relaxed">
              Define the identity, behavioral directives, and default model for a new thinking agent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Persona Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Socrates"
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Role / Title</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Classical Philosopher"
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Brief Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of persona's analytical perspective..."
              className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Default Model Target</label>
              <DynamicModelSelector
                value={defaultModel}
                onChange={(newModelId) => setDefaultModel(newModelId)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Tags (Comma Separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>System Prompt Directives *</span>
              <span>{systemPrompt.length} chars</span>
            </div>
            <textarea
              required
              rows={6}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are [Name]. Analyze the user's dilemma by..."
              className="w-full p-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-hairline)]">
            <Link href="/personas" className="btn-hallmark text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Persona'}
            </button>
          </div>
        </form>

        {/* Ft4 Dense Colophon Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Persona Creator Schema v1.0 • Hallmark Atelier Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
