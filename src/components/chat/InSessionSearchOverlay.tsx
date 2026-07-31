'use client';

import { useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 05-workbench · theme: studio · nav: N5 · footer: Ft2 */

interface InSessionSearchOverlayProps {
  isOpen: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  matchCount: number;
}

export function InSessionSearchOverlay({
  isOpen,
  searchQuery,
  onSearchChange,
  onClose,
  matchCount,
}: InSessionSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        if (isOpen) {
          inputRef.current?.focus();
        } else {
          onSearchChange('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onSearchChange, onClose]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="px-6 py-2 bg-[var(--color-paper-2)] border-b border-[var(--color-border-hairline)] flex items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search within conversation... (Esc to close)"
          aria-label="Search conversation messages"
          className="w-full text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-3 py-1.5 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="flex items-center gap-3">
        {searchQuery.trim() && (
          <span className="text-xs font-mono text-[var(--color-ink-muted)]">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}

        <button
          onClick={onClose}
          aria-label="Close conversation search bar"
          className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
