'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { db } from '@/lib/db';
import { ArrowLeft, Save, Sparkles, Wand2, Brain, Send, Cpu } from 'lucide-react';
import { DynamicModelSelector } from '@/components/ui/DynamicModelSelector';
import { TagInput } from '@/components/personas/TagInput';
import Link from 'next/link';

/* Hallmark · genre: editorial · macrostructure: 15-split-studio · theme: atelier · nav: N1b · footer: Ft4 */

export default function NewPersonaPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [recommendedModel, setRecommendedModel] = useState('');
  const [tags, setTags] = useState<string[]>(['philosophy', 'strategy']);
  const [isSaving, setIsSaving] = useState(false);

  // AI Quick-Generate State
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Test Sandbox State
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testModel, setTestModel] = useState('gpt-4o');
  const [isTesting, setIsTesting] = useState(false);

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
      if (parsed.recommendedModel || parsed.defaultModel) setRecommendedModel(parsed.recommendedModel || parsed.defaultModel);
      if (parsed.tags && Array.isArray(parsed.tags)) setTags(parsed.tags.map((t: string) => t.trim()));
    } catch (err: any) {
      // Fallback local heuristic generator if offline or error
      setName(quickPrompt.trim());
      setRole('Advisor & Specialist');
      setDescription(`Analytical reflection persona modeled after ${quickPrompt.trim()}.`);
      setSystemPrompt(`You are ${quickPrompt.trim()}. Analyze all user dilemmas through your unique philosophical stance and core principles. Be direct, structured, and insightful.`);
      setTags(['analysis', 'custom']);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim() || isTesting) return;
    setIsTesting(true);
    setTestResponse('');

    try {
      const provider = testModel.startsWith('claude')
        ? 'anthropic'
        : testModel.startsWith('gemini')
        ? 'google'
        : testModel.startsWith('ollama')
        ? 'ollama'
        : 'openai';

      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: testModel,
          systemPrompt: systemPrompt.trim() || `You are ${name || 'an advisor'}.`,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          setTestResponse((prev) => prev + decoder.decode(value));
        }
      }
    } catch (err: any) {
      setTestResponse(`[Test Error: ${err.message || 'Failed to communicate with provider model.'}]`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    setIsSaving(true);

    await db.personas.add({
      id: 'persona-' + Date.now(),
      name: name.trim(),
      role: role.trim() || 'Advisor',
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      recommendedModel: recommendedModel.trim() || undefined,
      tags,
      isArchived: false,
      createdAt: Date.now(),
    });

    router.push('/personas');
  };

  return (
    <Shell>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        {/* N1b Navigation Header */}
        <header className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pt-3 pb-4">
          <Link
            href="/personas"
            aria-label="Back to Persona Library"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            Persona Studio Surface
          </div>
        </header>

        {/* 15-Split Studio Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* AI Auto-Draft Assistant Bar */}
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
                <h1 className="font-display text-2xl text-[var(--color-ink)]">Draft New Persona</h1>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Recommended Model (Optional)</label>
                <DynamicModelSelector
                  value={recommendedModel}
                  onChange={(modelId) => setRecommendedModel(modelId)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Persona Tags & Categories</label>
                <TagInput tags={tags} onChange={setTags} />
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
          </div>

          {/* Right Column: Live Persona Preview & Test Sandbox (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Persona Card Preview */}
            <div className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Live Persona Card Preview
              </div>

              <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-2">
                <div className="font-display text-xl text-[var(--color-ink)]">{name || 'Persona Name'}</div>
                <div className="text-xs font-mono text-[var(--color-accent)]">{role || 'Role Title'}</div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  {description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap gap-1 pt-2">
                  {recommendedModel && (
                    <span className="text-[10px] font-mono bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-1.5 py-0.5 rounded font-semibold">
                      ✨ Best with {recommendedModel}
                    </span>
                  )}
                  {tags.map((t) => (
                    <span key={t} className="text-[10px] font-mono bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] px-1.5 py-0.5 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Prompt Sandbox */}
            <div className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
                  <Brain className="w-4 h-4" /> Test Prompt Sandbox
                </div>
                <div className="flex items-center gap-1 bg-[var(--color-paper)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
                  <Cpu className="w-3 h-3 text-[var(--color-accent)]" />
                  <select
                    value={testModel}
                    onChange={(e) => setTestModel(e.target.value)}
                    className="bg-transparent text-[10px] font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer"
                  >
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="ollama-local">Ollama Local</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  placeholder={`Ask ${name || 'persona'} a test question to verify directives...`}
                  className="w-full p-2.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                />
                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting || !testPrompt.trim()}
                  aria-label="Run Test Generation"
                  className="btn-hallmark text-xs w-full justify-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  {isTesting ? 'Generating Test Output...' : 'Run Test Generation'}
                </button>
              </div>

              {testResponse && (
                <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-xs text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                  {testResponse}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ft4 Dense Colophon Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Persona Creator Studio v2.0 • Hallmark 15-Split Atelier Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
