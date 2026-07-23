'use client';

import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Persona } from '@/types';
import { Search, Plus, Grid, List, Tag, Share2, Upload, Trash2, Edit2, Play, Copy, Check, Star } from 'lucide-react';
import Link from 'next/link';

/* Hallmark · genre: editorial · macrostructure: 11-catalogue · theme: studio · nav: N1b */

export default function PersonaLibraryPage() {
  const personas = useLiveQuery(() => db.personas.toArray()) || [];
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'favorites' | 'custom' | 'default' | 'archived'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [exportPersona, setExportPersona] = useState<Persona | null>(null);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load favorites from local storage
  useEffect(() => {
    const savedFavs = localStorage.getItem('framework-engine:favorite-personas');
    if (savedFavs) {
      try {
        setFavoriteIds(JSON.parse(savedFavs));
      } catch (e) {
        setFavoriteIds([]);
      }
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newFavs: string[];
    if (favoriteIds.includes(id)) {
      newFavs = favoriteIds.filter((favId) => favId !== id);
    } else {
      newFavs = [...favoriteIds, id];
    }
    setFavoriteIds(newFavs);
    localStorage.setItem('framework-engine:favorite-personas', JSON.stringify(newFavs));
  };

  // Collect all unique tags
  const allTags = Array.from(new Set(personas.flatMap((p) => p.tags || [])));

  const filteredPersonas = personas.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedTag && !p.tags.includes(selectedTag)) return false;

    if (selectedCategory === 'favorites') return favoriteIds.includes(p.id);
    if (selectedCategory === 'custom') return (!p.id.startsWith('persona-') || p.id.startsWith('custom-')) && !p.isArchived;
    if (selectedCategory === 'default') return p.id.startsWith('persona-') && !p.isArchived;
    if (selectedCategory === 'archived') return p.isArchived;

    return !p.isArchived;
  });

  const handleExport = (persona: Persona) => {
    const exportData = {
      version: 'framework-engine.persona/v1',
      persona: {
        name: persona.name,
        role: persona.role,
        description: persona.description,
        systemPrompt: persona.systemPrompt,
        defaultModel: persona.defaultModel,
        tags: persona.tags,
      },
    };
    setExportPersona(persona);
  };

  const getExportCode = (persona: Persona) => {
    const exportData = {
      version: 'framework-engine.persona/v1',
      persona: {
        name: persona.name,
        role: persona.role,
        description: persona.description,
        systemPrompt: persona.systemPrompt,
        defaultModel: persona.defaultModel,
        tags: persona.tags,
      },
    };
    return btoa(JSON.stringify(exportData));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleImport = async () => {
    setImportError(null);
    if (!importCode.trim()) return;

    try {
      const decoded = atob(importCode.trim());
      const parsed = JSON.parse(decoded);

      if (parsed.version !== 'framework-engine.persona/v1' || !parsed.persona) {
        throw new Error('Invalid persona format version.');
      }

      const p = parsed.persona;
      const newPersona: Persona = {
        id: 'custom-' + Date.now(),
        name: p.name || 'Imported Persona',
        role: p.role || 'Specialist',
        description: p.description || '',
        systemPrompt: p.systemPrompt || '',
        defaultModel: p.defaultModel || 'gpt-4o',
        tags: p.tags || ['imported'],
        isArchived: false,
        createdAt: Date.now(),
      };

      await db.personas.add(newPersona);
      setShowImportModal(false);
      setImportCode('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse persona code.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      await db.personas.delete(id);
    }
  };

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-8">
        {/* Header Bar (N1b) */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border-hairline)] pb-6">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-normal text-[var(--color-ink)]">
              Persona Library
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Catalogue & Roster Management • {filteredPersonas.length} Available
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              aria-label="Import Persona Share Code"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Upload className="w-3.5 h-3.5" /> Import Persona
            </button>
            <Link
              href="/personas/new"
              className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            >
              <Plus className="w-3.5 h-3.5" /> Create Persona
            </Link>
          </div>
        </header>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--color-border-hairline)]">
          {(['all', 'favorites', 'custom', 'default', 'archived'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                selectedCategory === cat
                  ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-semibold'
                  : 'bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              {cat === 'favorites' ? `★ Favorites (${favoriteIds.length})` : cat}
            </button>
          ))}
        </div>

        {/* Search, Filter Pills & View Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search personas by name, role, or directive tags..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                  selectedTag === null
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]'
                    : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border border-[var(--color-border)] hover:text-[var(--color-ink)]'
                }`}
              >
                All Tags
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                    selectedTag === tag
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold border border-[var(--color-accent)]'
                      : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border border-[var(--color-border)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[var(--color-paper-2)] border border-[var(--color-border)] p-1 rounded-[var(--radius-sm)] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Grid View"
              className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                viewMode === 'grid' ? 'bg-[var(--color-paper)] text-[var(--color-ink)] shadow-xs' : 'text-[var(--color-ink-muted)]'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="List View"
              className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                viewMode === 'list' ? 'bg-[var(--color-paper)] text-[var(--color-ink)] shadow-xs' : 'text-[var(--color-ink-muted)]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Persona Cards Catalogue */}
        {filteredPersonas.length === 0 ? (
          <div className="p-12 border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] text-center space-y-3">
            <div className="font-display text-xl text-[var(--color-ink)]">No personas match your query</div>
            <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mx-auto">
              Try adjusting your search terms, clearing tag filters, or create a custom persona.
            </p>
            <Link
              href="/personas/new"
              className="btn-hallmark text-xs inline-flex items-center gap-1 bg-[var(--color-accent)] text-white"
            >
              <Plus className="w-3.5 h-3.5" /> Create New Persona
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPersonas.map((persona) => {
              const isFav = favoriteIds.includes(persona.id);
              return (
                <div
                  key={persona.id}
                  className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-border)] rounded-[var(--radius-md)] flex flex-col justify-between space-y-6 group transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-paper)] border border-[var(--color-border)] flex items-center justify-center font-display text-lg text-[var(--color-accent)] font-semibold shrink-0">
                          {persona.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-display text-lg text-[var(--color-ink)] leading-tight">
                            {persona.name}
                          </h3>
                          <div className="text-xs font-mono text-[var(--color-ink-muted)]">{persona.role}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(persona.id, e)}
                        aria-label={`Toggle favorite for ${persona.name}`}
                        className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                          isFav ? 'text-[var(--color-warning)] fill-current' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-warning)]'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-3">
                      {persona.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {persona.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-[10px] font-mono text-[var(--color-ink-muted)]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--color-border-hairline)] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/personas/${persona.id}/edit`}
                        aria-label={`Edit ${persona.name}`}
                        className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                        title="Edit Persona"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleExport(persona)}
                        aria-label={`Share ${persona.name}`}
                        className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                        title="Share Persona Base64 Code"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      {!persona.id.startsWith('persona-') && (
                        <button
                          onClick={() => handleDelete(persona.id, persona.name)}
                          aria-label={`Delete ${persona.name}`}
                          className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-error)]"
                          title="Delete Custom Persona"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <Link
                      href={`/chat/1-on-1/new?persona=${persona.id}`}
                      className="btn-hallmark text-xs gap-1 bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-[var(--color-accent)] hover:text-white"
                    >
                      <Play className="w-3 h-3 fill-current" /> Start 1-on-1
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] divide-y divide-[var(--color-border-hairline)] overflow-hidden">
            {filteredPersonas.map((persona) => {
              const isFav = favoriteIds.includes(persona.id);
              return (
                <div
                  key={persona.id}
                  className="p-4 bg-[var(--color-paper)] hover:bg-[var(--color-paper-2)] flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(persona.id, e)}
                      aria-label={`Toggle favorite for ${persona.name}`}
                      className={`p-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                        isFav ? 'text-[var(--color-warning)] fill-current' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-warning)]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-[var(--color-paper-2)] border border-[var(--color-border)] flex items-center justify-center font-display text-sm text-[var(--color-accent)] font-semibold shrink-0">
                      {persona.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base text-[var(--color-ink)] flex items-center gap-2">
                        <span>{persona.name}</span>
                        <span className="text-xs font-mono text-[var(--color-ink-muted)] font-normal">({persona.role})</span>
                      </div>
                      <p className="text-xs text-[var(--color-ink-muted)] truncate">{persona.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/personas/${persona.id}/edit`}
                      aria-label={`Edit ${persona.name}`}
                      className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/chat/1-on-1/new?persona=${persona.id}`}
                      className="btn-hallmark text-xs gap-1 bg-[var(--color-ink)] text-[var(--color-paper)]"
                    >
                      <Play className="w-3 h-3 fill-current" /> Start 1-on-1
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Share Code Modal */}
        {exportPersona && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
                <h3 className="font-display text-xl text-[var(--color-ink)]">
                  Share Persona: {exportPersona.name}
                </h3>
                <button
                  onClick={() => setExportPersona(null)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--color-ink-muted)]">
                Copy this portable Base64 share code to import this persona on any device running Council of Minds.
              </p>

              <div className="p-3 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded font-mono text-[10px] break-all select-all text-[var(--color-ink)] max-h-32 overflow-y-auto">
                {getExportCode(exportPersona)}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => handleCopyCode(getExportCode(exportPersona))}
                  className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                >
                  {copiedExport ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedExport ? 'Copied to Clipboard!' : 'Copy Code'}
                </button>
                <button
                  onClick={() => setExportPersona(null)}
                  className="btn-hallmark text-xs bg-[var(--color-paper-2)]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Code Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
                <h3 className="font-display text-xl text-[var(--color-ink)]">Import Persona</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--color-ink-muted)]">
                Paste a portable Base64 persona share code (`framework-engine.persona/v1`).
              </p>

              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                placeholder="Paste Base64 persona share code here..."
                rows={4}
                className="w-full p-3 font-mono text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
              />

              {importError && (
                <div className="p-2.5 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-mono rounded border border-[var(--color-error)]/20">
                  {importError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="btn-hallmark text-xs bg-[var(--color-paper-2)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importCode.trim()}
                  className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
                >
                  Import Persona
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
