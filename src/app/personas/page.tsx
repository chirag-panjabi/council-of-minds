'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Persona } from '@/types';
import { Plus, Grid, List, Download, Upload, Edit3, ArrowRight, Search, CheckCircle2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* Hallmark · genre: editorial · macrostructure: 11-catalogue · theme: atelier · nav: N1b · footer: Ft4 */

export default function PersonaLibraryPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Base64 Import/Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPersonaForExport, setSelectedPersonaForExport] = useState<Persona | null>(null);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);

  const personas = useLiveQuery(() => db.personas.where('isArchived').equals(0).toArray()) || [];

  // Extract all unique tags
  const allTags = Array.from(new Set(personas.flatMap((p) => p.tags || [])));

  const filteredPersonas = personas.filter((p) => {
    const matchesTag = selectedTag ? p.tags?.includes(selectedTag) : true;
    const matchesSearch = searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTag && matchesSearch;
  });

  const handleStart1On1 = async (persona: Persona) => {
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

  const handleExport = (persona: Persona) => {
    setSelectedPersonaForExport(persona);
    const schemaObj = {
      schema: 'framework-engine.persona/v1',
      persona: {
        name: persona.name,
        role: persona.role,
        description: persona.description,
        systemPrompt: persona.systemPrompt,
        defaultModel: persona.defaultModel,
        tags: persona.tags,
      },
    };
    const jsonStr = JSON.stringify(schemaObj);
    const b64 = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(jsonStr))) : '';
    setExportCode(b64);
    setIsExportModalOpen(true);
    setCopyStatus(false);
  };

  const handleCopyCode = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(exportCode);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const handleImport = async (collisionStrategy: 'replace' | 'duplicate' | 'skip') => {
    try {
      setImportStatus(null);
      const jsonStr = decodeURIComponent(escape(atob(importCode.trim())));
      const parsed = JSON.parse(jsonStr);

      if (parsed.schema !== 'framework-engine.persona/v1' || !parsed.persona?.name) {
        throw new Error('Invalid share code format.');
      }

      const importedPersona = parsed.persona;
      const existing = await db.personas.where('name').equals(importedPersona.name).first();

      if (existing) {
        if (collisionStrategy === 'skip') {
          setIsImportModalOpen(false);
          return;
        }
        if (collisionStrategy === 'replace') {
          await db.personas.update(existing.id, {
            ...importedPersona,
            createdAt: Date.now(),
          });
        } else if (collisionStrategy === 'duplicate') {
          await db.personas.add({
            ...importedPersona,
            id: 'persona-' + Date.now(),
            name: `${importedPersona.name} (Copy)`,
            isArchived: false,
            createdAt: Date.now(),
          });
        }
      } else {
        await db.personas.add({
          ...importedPersona,
          id: 'persona-' + Date.now(),
          isArchived: false,
          createdAt: Date.now(),
        });
      }

      setIsImportModalOpen(false);
      setImportCode('');
    } catch (err: any) {
      setImportStatus(err.message || 'Failed to import persona share code.');
    }
  };

  return (
    <Shell>
      <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
        {/* N1b Canonical Three-Section Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--color-border-hairline)] pb-6 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
              Catalogue Surface
            </div>
            <h1 className="font-display text-4xl text-[var(--color-ink)]">Persona Library & Groups</h1>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Curate thinking frameworks, export Base64 codes, and manage Council rosters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              aria-label="Import persona share code"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Upload className="w-3.5 h-3.5" /> Import Code
            </button>
            <Link
              href="/personas/new"
              aria-label="Create new persona"
              className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Plus className="w-3.5 h-3.5" /> + New Persona
            </Link>
          </div>
        </header>

        {/* Dynamic Search & Tag Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
          {/* Live Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, or description..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
            />
            <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-2.5 top-2" />
          </div>

          {/* Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 text-xs rounded-[var(--radius-sm)] font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                selectedTag === null
                  ? 'bg-[var(--color-accent)] text-white font-semibold'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              All ({personas.length})
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 text-xs rounded-[var(--radius-sm)] font-mono transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                  selectedTag === tag
                    ? 'bg-[var(--color-accent)] text-white font-semibold'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Grid/List View Toggle */}
          <div className="flex items-center border border-[var(--color-border)] rounded-[var(--radius-sm)] p-0.5 bg-[var(--color-paper)] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Switch to grid view"
              className={`p-1.5 rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                viewMode === 'grid' ? 'bg-[var(--color-paper-3)] text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Switch to list view"
              className={`p-1.5 rounded-[2px] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                viewMode === 'list' ? 'bg-[var(--color-paper-3)] text-[var(--color-ink)]' : 'text-[var(--color-ink-muted)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 11 · Catalogue Grid/List Surface */}
        {filteredPersonas.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)]">
            <div className="text-sm text-[var(--color-ink-muted)]">No personas match the selected search or tag filter.</div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonas.map((persona) => (
              <div
                key={persona.id}
                className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] flex flex-col justify-between space-y-4 hover:border-[var(--color-ink-muted)] transition-colors group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-xl text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                        {persona.name}
                      </h3>
                      <div className="text-xs font-mono text-[var(--color-ink-muted)]">{persona.role}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/personas/${persona.id}/edit`}
                        aria-label={`Edit ${persona.name}`}
                        className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
                        title="Edit Persona Directives"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleExport(persona)}
                        aria-label={`Export share code for ${persona.name}`}
                        className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
                        title="Export Share Code"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed line-clamp-3">
                    {persona.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--color-border-hairline)]">
                  <div className="flex flex-wrap gap-1">
                    {persona.tags?.map((t) => (
                      <span key={t} className="text-[10px] font-mono bg-[var(--color-paper)] px-1.5 py-0.5 rounded border border-[var(--color-border-hairline)] text-[var(--color-ink-faint)]">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleStart1On1(persona)}
                    aria-label={`Start 1-on-1 dialogue with ${persona.name}`}
                    className="w-full btn-hallmark text-xs justify-between focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    <span>Start 1-on-1</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPersonas.map((persona) => (
              <div
                key={persona.id}
                className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] flex items-center justify-between hover:border-[var(--color-ink-muted)] transition-colors"
              >
                <div>
                  <div className="font-display text-lg text-[var(--color-ink)]">{persona.name}</div>
                  <div className="text-xs font-mono text-[var(--color-ink-muted)]">{persona.role} — {persona.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/personas/${persona.id}/edit`}
                    className="btn-hallmark text-xs p-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                    aria-label={`Edit ${persona.name}`}
                    title="Edit Persona"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleExport(persona)}
                    className="btn-hallmark text-xs p-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                    aria-label={`Export ${persona.name}`}
                    title="Export Share Code"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStart1On1(persona)}
                    aria-label={`Start Chat with ${persona.name}`}
                    className="btn-hallmark btn-hallmark-primary text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Base64 Export Modal */}
        {isExportModalOpen && selectedPersonaForExport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-4">
              <h3 className="font-display text-xl text-[var(--color-ink)]">
                Export Share Code: {selectedPersonaForExport.name}
              </h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Copy this Base64 string (`framework-engine.persona/v1`) and share it on Discord or Reddit for 1-click community importing.
              </p>
              <textarea
                readOnly
                value={exportCode}
                className="w-full h-32 p-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded font-mono text-xs text-[var(--color-ink)] select-all focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCopyCode}
                  className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                >
                  {copyStatus ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  {copyStatus ? 'Copied Code!' : 'Copy to Clipboard'}
                </button>
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

        {/* Base64 Import Modal with Collision Handling */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 space-y-4">
              <h3 className="font-display text-xl text-[var(--color-ink)]">Import Persona Share Code</h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Paste a Base64 export string generated by Framework Engine.
              </p>
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste Base64 code here..."
                className="w-full h-24 p-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded font-mono text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
              />

              {importStatus && (
                <div className="p-2 text-xs bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 rounded">
                  {importStatus}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[var(--color-border-hairline)]">
                <div className="text-xs font-mono text-[var(--color-ink-muted)]">If Persona Name Collides:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleImport('replace')}
                    className="btn-hallmark text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => handleImport('duplicate')}
                    className="btn-hallmark btn-hallmark-primary text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    Duplicate (Copy)
                  </button>
                  <button
                    onClick={() => handleImport('skip')}
                    className="btn-hallmark text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    Skip
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-xs text-[var(--color-ink-muted)] underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ft4 Dense Colophon Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Catalogue Schema v1.0 • Base64 Isolated Export</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
