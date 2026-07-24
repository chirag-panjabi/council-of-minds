'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Tag, Plus, X, Check } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Type a tag and press Enter or comma...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Harvest all unique tags from workspace IndexedDB
  const personas = useLiveQuery(() => db.personas.toArray()) || [];
  
  const allExistingTags = useMemo(() => {
    const set = new Set<string>();
    personas.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          if (t && typeof t === 'string') {
            set.add(t.trim().toLowerCase());
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [personas]);

  // Filter existing tags based on current input
  const suggestions = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];
    return allExistingTags.filter(
      (t) => t.includes(query) && !tags.some((selected) => selected.toLowerCase() === t)
    );
  }, [allExistingTags, inputValue, tags]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tagToAdd: string) => {
    const cleaned = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (!cleaned) return;
    if (!tags.some((t) => t.toLowerCase() === cleaned)) {
      onChange([...tags, cleaned]);
    }
    setInputValue('');
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const toggleExistingTag = (tag: string) => {
    const exists = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (exists) {
      removeTag(tag);
    } else {
      addTag(tag);
    }
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Input Container with Active Tag Chips */}
      <div className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus-within:border-[var(--color-focus)] focus-within:ring-1 focus-within:ring-[var(--color-focus)] transition-all">
        <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded text-xs font-mono font-semibold transition-all group"
            >
              <span>#{t}</span>
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-[var(--color-accent-hover)] focus:outline-none"
                aria-label={`Remove tag ${t}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <div className="relative flex-1 min-w-[140px]">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : 'Add tag...'}
              className="w-full bg-transparent text-xs font-mono text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] focus:outline-none py-1"
            />

            {/* Real-time Autocomplete Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg z-30 max-h-48 overflow-y-auto py-1">
                <div className="px-2.5 py-1 text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
                  Matching Workspace Tags
                </div>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addTag(s)}
                    className="w-full text-left px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] hover:bg-[var(--color-paper)] hover:text-[var(--color-accent)] flex items-center justify-between transition-colors"
                  >
                    <span>#{s}</span>
                    <Plus className="w-3 h-3 text-[var(--color-accent)] opacity-70" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Available Workspace Tags Cloud */}
      {allExistingTags.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--color-ink-muted)] uppercase tracking-wider">
            <Tag className="w-3 h-3 text-[var(--color-accent)]" />
            <span>Click existing tags to add/remove:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allExistingTags.map((t) => {
              const isSelected = tags.some((selected) => selected.toLowerCase() === t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleExistingTag(t)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    isSelected
                      ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/40 font-semibold shadow-xs'
                      : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] border border-[var(--color-border-hairline)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)]/50'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <span>#</span>}
                  <span>{t}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
