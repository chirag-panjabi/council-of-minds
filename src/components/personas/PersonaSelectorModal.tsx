'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Persona } from '@/types';
import { Search, X, Star, Plus, Check, Users, User, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

/* Hallmark · genre: editorial · macrostructure: 08-modal · theme: studio */

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'single' | 'multi';
  title?: string;
  selectedPersonaIds?: string[];
  onSelectPersona?: (persona: Persona) => void;
  onSelectMultiplePersonas?: (personas: Persona[]) => void;
}

export function PersonaSelectorModal({
  isOpen,
  onClose,
  mode = 'single',
  title = 'Select Persona',
  selectedPersonaIds = [],
  onSelectPersona,
  onSelectMultiplePersonas,
}: PersonaSelectorModalProps) {
  const personas = useLiveQuery(() => db.personas.filter((p) => !p.isArchived).toArray()) || [];
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'official' | 'custom' | 'favorites'>('all');
  const [markedIds, setMarkedIds] = useState<string[]>(selectedPersonaIds);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const selectedIdsKey = selectedPersonaIds ? selectedPersonaIds.join(',') : '';

  useEffect(() => {
    if (isOpen) {
      setMarkedIds(selectedPersonaIds);
    }
  }, [selectedIdsKey, isOpen]);

  // Load favorites from local storage key
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

  const handleToggleMark = (persona: Persona) => {
    if (mode === 'single') {
      if (onSelectPersona) {
        onSelectPersona(persona);
        onClose();
      }
    } else {
      if (markedIds.includes(persona.id)) {
        setMarkedIds(markedIds.filter((id) => id !== persona.id));
      } else {
        setMarkedIds([...markedIds, persona.id]);
      }
    }
  };

  const handleConfirmMulti = () => {
    if (onSelectMultiplePersonas) {
      const selectedPersonas = personas.filter((p) => markedIds.includes(p.id));
      onSelectMultiplePersonas(selectedPersonas);
      onClose();
    }
  };

  const filteredPersonas = personas.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (category === 'favorites') return favoriteIds.includes(p.id) || p.isFavorite;
    if (category === 'official') return Boolean(p.isSystem || p.id.startsWith('persona-'));
    if (category === 'custom') return Boolean(p.isCustom || p.id.startsWith('custom-'));
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-2xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-selector-title"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {mode === 'single' ? <User className="w-5 h-5 text-[var(--color-accent)]" /> : <Users className="w-5 h-5 text-[var(--color-accent)]" />}
            <h2 id="persona-selector-title" className="font-display text-xl text-[var(--color-ink)]">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/personas/new"
              onClick={onClose}
              className="btn-hallmark text-xs gap-1 py-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Plus className="w-3.5 h-3.5" /> New Persona
            </Link>
            <button
              onClick={onClose}
              aria-label="Close persona selector modal"
              className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="p-4 space-y-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper)]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, or tag..."
              autoFocus
              className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'official', 'custom', 'favorites'] as const).map((cat) => {
              let label = 'All';
              if (cat === 'official') label = `⚡ Official (${personas.filter((p) => p.isSystem || p.id.startsWith('persona-')).length})`;
              else if (cat === 'custom') label = `🎨 Custom (${personas.filter((p) => p.isCustom || p.id.startsWith('custom-')).length})`;
              else if (cat === 'favorites') label = `⭐ Favorites (${favoriteIds.length})`;
              else label = `All (${personas.length})`;

              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                    category === cat
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] font-semibold'
                      : 'bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Persona Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredPersonas.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-[var(--color-ink-muted)] space-y-2">
              <div>No personas match your criteria.</div>
              <Link href="/personas/new" onClick={onClose} className="text-[var(--color-accent)] hover:underline">
                + Create a new persona
              </Link>
            </div>
          ) : (
            filteredPersonas.map((p) => {
              const isMarked = markedIds.includes(p.id);
              const isFav = favoriteIds.includes(p.id);
              const isOfficial = Boolean(p.isSystem || p.id.startsWith('persona-'));

              return (
                <div
                  key={p.id}
                  onClick={() => handleToggleMark(p)}
                  className={`p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isMarked
                      ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] shadow-xs'
                      : 'bg-[var(--color-paper)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)] hover:bg-[var(--color-paper-2)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-paper-2)] border border-[var(--color-border)] flex items-center justify-center font-display text-sm text-[var(--color-accent)] font-semibold shrink-0">
                      {p.name.charAt(0)}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-display text-sm text-[var(--color-ink)] flex items-center gap-2 flex-wrap">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)] font-normal">
                          ({p.role})
                        </span>
                        {isOfficial ? (
                          <span className="px-1.5 py-0.5 bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 rounded text-[9px] font-mono text-[var(--color-accent)] font-semibold flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5 text-[var(--color-accent)]" /> OFFICIAL
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-[var(--color-paper-3)] border border-[var(--color-border)] rounded text-[9px] font-mono text-[var(--color-ink-muted)] font-semibold">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-ink-muted)] truncate">{p.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(p.id, e)}
                      aria-label={`Toggle favorite for ${p.name}`}
                      className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                        isFav ? 'text-[var(--color-warning)] fill-current' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-warning)]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {mode === 'multi' && (
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isMarked
                            ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                            : 'border-[var(--color-border)] bg-[var(--color-paper)]'
                        }`}
                      >
                        {isMarked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar for Multi-Select Confirmation */}
        {mode === 'multi' && (
          <div className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-[var(--color-ink-muted)]">
              {markedIds.length} persona{markedIds.length === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMulti}
                disabled={markedIds.length === 0}
                className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] disabled:opacity-40"
              >
                Add to Council ({markedIds.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
