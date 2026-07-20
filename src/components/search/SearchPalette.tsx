"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import { SearchService } from '@/lib/search/search-service';
import type { SearchFilters, SearchResults } from '@/lib/search/types';
import {
  PersonaResultItem,
  ChatResultItem,
} from '@/components/search/SearchResultItem';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const router = useRouter();
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const serviceRef = React.useRef<SearchService | null>(null);

  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState<SearchFilters>({});
  const [results, setResults] = React.useState<SearchResults | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Total flattened result count for keyboard nav
  const totalResults =
    (results?.personas.length ?? 0) + (results?.chats.length ?? 0);

  // ---------- Dialog lifecycle ----------

  React.useEffect(() => {
    if (open) {
      serviceRef.current = new SearchService();
      serviceRef.current.init();
      dialogRef.current?.showModal();
      // Focus input after dialog opens
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      serviceRef.current?.destroy();
      serviceRef.current = null;
      dialogRef.current?.close();
      setQuery('');
      setResults(null);
      setError(null);
      setSelectedIndex(0);
      setFilters({});
    }
  }, [open]);

  // ---------- Debounced search ----------

  React.useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const res = await serviceRef.current?.search(trimmed, filters);
        if (res) {
          setResults(res);
          setSelectedIndex(0);
        }
      } catch {
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, open]);

  // ---------- Navigation helpers ----------

  function navigateToResult(index: number) {
    if (!results) return;

    const personaCount = results.personas.length;

    if (index < personaCount) {
      const persona = results.personas[index];
      router.push(routes.personaEdit(persona.id));
    } else {
      const chat = results.chats[index - personaCount];
      const route =
        chat.mode === 'council'
          ? routes.chatCouncil(chat.sessionId)
          : routes.chatOneOnOne(chat.sessionId);
      const url = chat.messageId ? `${route}?msg=${chat.messageId}` : route;
      router.push(url);
    }

    onClose();
  }

  // ---------- Keyboard handling ----------

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, totalResults - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter' && totalResults > 0) {
      e.preventDefault();
      navigateToResult(selectedIndex);
    }
  }

  // ---------- Click outside → close ----------

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    // Only close if clicking the backdrop (the dialog element itself)
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  // ---------- Filter toggles ----------

  const modeOptions: { value: SearchFilters['mode']; label: string }[] = [
    { value: undefined, label: 'All' },
    { value: '1-on-1', label: '1-on-1' },
    { value: 'council', label: 'Council' },
  ];

  // ---------- Render ----------

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      aria-label="Search"
      className="fixed inset-0 z-50 m-0 flex h-full w-full items-start justify-center bg-black/50 p-0 pt-[15vh] backdrop:bg-transparent"
    >
      <div className="mx-4 w-full max-w-xl rounded-xl border bg-background shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            placeholder="Search personas and chats…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search query"
            autoComplete="off"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>

        {/* Filters */}
        <div className="flex gap-1 border-b px-4 py-2">
          {modeOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setFilters({ ...filters, mode: opt.value })}
              aria-pressed={filters.mode === opt.value}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filters.mode === opt.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results area */}
        <div
          className="max-h-[50vh] overflow-y-auto px-2 py-2"
          role="listbox"
          aria-label="Search results"
        >
          {/* Loading */}
          {loading && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Searching…
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-6 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                type="button"
                onClick={() => setQuery((q) => q + ' ')}
                className="mt-2 text-xs text-primary underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty query */}
          {!loading && !error && !results && query.trim().length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Type to search personas and chats.
            </p>
          )}

          {/* No results */}
          {!loading && !error && results && totalResults === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results found.
            </p>
          )}

          {/* Persona results */}
          {!loading && results && results.personas.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Personas
              </p>
              {results.personas.map((r, i) => (
                <PersonaResultItem
                  key={r.id}
                  result={r}
                  query={query}
                  isSelected={selectedIndex === i}
                  onClick={() => navigateToResult(i)}
                />
              ))}
              {results.personasTruncated && (
                <p className="px-3 py-1 text-xs text-muted-foreground">
                  Results capped at 50. Refine your query.
                </p>
              )}
            </div>
          )}

          {/* Chat results */}
          {!loading && results && results.chats.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Chats
              </p>
              {results.chats.map((r, i) => {
                const flatIndex = (results?.personas.length ?? 0) + i;
                return (
                  <ChatResultItem
                    key={`${r.sessionId}-${r.messageId ?? 'title'}`}
                    result={r}
                    query={query}
                    isSelected={selectedIndex === flatIndex}
                    onClick={() => navigateToResult(flatIndex)}
                  />
                );
              })}
              {results.chatsTruncated && (
                <p className="px-3 py-1 text-xs text-muted-foreground">
                  Results capped at 50. Refine your query.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Status region (accessible) */}
        <div aria-live="polite" className="sr-only" role="status">
          {!loading && results && totalResults > 0
            ? `${totalResults} result${totalResults === 1 ? '' : 's'} found.`
            : ''}
          {!loading && results && totalResults === 0
            ? 'No results found.'
            : ''}
          {!loading &&
            results &&
            (results.personasTruncated || results.chatsTruncated)
            ? 'Some results truncated. Refine your query.'
            : ''}
        </div>
      </div>
    </dialog>
  );
}
