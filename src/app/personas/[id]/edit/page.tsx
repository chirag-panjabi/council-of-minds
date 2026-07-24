'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { db } from '@/lib/db';
import type { Persona } from '@/types';
import { ArrowLeft, Save, Archive, Trash2, Send, Sparkles, Brain, CheckCircle2, Copy, Download, Cpu } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 15-split-studio · theme: garden · nav: N1b · footer: Ft6 */

export default function EditPersonaPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params?.id as string;

  const [persona, setPersona] = useState<Persona | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [tagsInput, setTagsInput] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Export Base64 State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportCode, setExportCode] = useState('');

  // Live Test Sandbox State
  const [testPrompt, setTestPrompt] = useState('');
  const [testModel, setTestModel] = useState('gpt-4o');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (!personaId) return;
    db.personas.get(personaId).then((p) => {
      if (p) {
        setPersona(p);
        setName(p.name);
        setRole(p.role);
        setDescription(p.description);
        setSystemPrompt(p.systemPrompt);
        setDefaultModel(p.defaultModel || 'gpt-4o');
        setTestModel(p.defaultModel || 'gpt-4o');
        setTagsInput(p.tags?.join(', ') || '');
        setIsArchived(p.isArchived || false);
      }
    });
  }, [personaId]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || !systemPrompt.trim()) return;

    setIsSaving(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await db.personas.update(personaId, {
      name: name.trim(),
      role: role.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      defaultModel,
      tags,
      isArchived,
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportShareCode = () => {
    if (!persona) return;
    const schemaObj = {
      schema: 'framework-engine.persona/v1',
      persona: {
        name,
        role,
        description,
        systemPrompt,
        defaultModel,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      },
    };
    const jsonStr = JSON.stringify(schemaObj);
    const b64 = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(jsonStr))) : '';
    setExportCode(b64);
    setIsExportModalOpen(true);
  };

  const handleDuplicate = async () => {
    if (!persona) return;
    const newPersonaId = 'persona-' + Date.now();
    const duplicatedPersona: Persona = {
      ...persona,
      id: newPersonaId,
      name: `${persona.name} (Copy)`,
      createdAt: Date.now(),
    };

    await db.personas.add(duplicatedPersona);
    router.push(`/personas/${newPersonaId}/edit`);
  };

  const handleToggleArchive = async () => {
    const nextState = !isArchived;
    setIsArchived(nextState);
    await db.personas.update(personaId, { isArchived: nextState });
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to permanently delete persona "${name}"?`)) {
      await db.personas.delete(personaId);
      router.push('/personas');
    }
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim() || isTesting) return;

    setIsTesting(true);
    setTestResponse('');

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
          model: testModel,
          systemPrompt,
          messages: [{ role: 'user', content: testPrompt }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value);
          setTestResponse(fullContent.replace(/<think>[\s\S]*?<\/think>/, '').trim());
        }
      }
    } catch (err: any) {
      setTestResponse(`Test Error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  if (!persona) {
    return (
      <Shell>
        <div className="p-12 text-center text-xs font-mono text-[var(--color-ink-muted)]">
          Loading persona details...
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        {/* N1b Navigation Header */}
        <header className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
          <Link
            href="/personas"
            aria-label="Back to Persona Library"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Persona Library
          </Link>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            Split Studio Persona Editor
          </div>
        </header>

        {saveSuccess && (
          <div className="p-3 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Persona successfully updated!
          </div>
        )}

        {/* 15 · Split Studio Diptych Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Pane: Persona Editor Form (7 cols) */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6">
            <div className="flex flex-wrap items-center justify-between border-b border-[var(--color-border-hairline)] pb-3 gap-2">
              <div>
                <h1 className="font-display text-2xl text-[var(--color-ink)]">Edit: {name}</h1>
                <div className="text-xs font-mono text-[var(--color-ink-muted)]">Modify persona directives & rules</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportShareCode}
                  aria-label="Export Share Code"
                  className="btn-hallmark text-xs gap-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  title="Export Share Code"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Export
                </button>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  aria-label="Duplicate Persona"
                  className="btn-hallmark text-xs gap-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  title="Duplicate Persona"
                >
                  <Copy className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={handleToggleArchive}
                  aria-label={isArchived ? 'Unarchive Persona' : 'Archive Persona'}
                  className={`btn-hallmark text-xs gap-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${isArchived ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' : ''}`}
                  title={isArchived ? 'Unarchive Persona' : 'Archive Persona'}
                >
                  <Archive className="w-3.5 h-3.5" />
                  {isArchived ? 'Archived' : 'Archive'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  aria-label="Delete Persona"
                  className="btn-hallmark text-xs text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/10 focus:outline-none focus:ring-1 focus:ring-[var(--color-error)]"
                  title="Delete Persona"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Persona Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-medium focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Default Model</label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                >
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="gpt-4o-mini">OpenAI GPT-4o Mini</option>
                  <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                  <option value="ollama-local">Ollama Local Model</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Tags (Comma Separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
                <span>System Prompt Directives</span>
                <span>{systemPrompt.length} chars</span>
              </div>
              <textarea
                required
                rows={8}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Right Pane: Live Persona Preview & Test Sandbox (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Preview Card */}
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
                  <span className="text-[10px] font-mono bg-[var(--color-accent-subtle)] text-[var(--color-accent)] px-1.5 py-0.5 rounded font-semibold">
                    {defaultModel}
                  </span>
                  {tagsInput.split(',').map((t) => (
                    <span key={t} className="text-[10px] font-mono bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] px-1.5 py-0.5 rounded">
                      #{t.trim()}
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

        {/* Base64 Export Modal */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-4">
              <h3 className="font-display text-xl text-[var(--color-ink)]">
                Export Share Code: {name}
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Copy this Base64 string (`framework-engine.persona/v1`) to share your persona directives with others.
              </p>
              <textarea
                readOnly
                value={exportCode}
                className="w-full h-32 p-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded font-mono text-xs text-[var(--color-ink)] select-all focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="btn-hallmark text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ft6 Letter Close Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-4 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Split Studio Persona Editor • Hallmark Design Governance</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
