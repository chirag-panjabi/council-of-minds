import * as React from 'react';
import type { PersonaSearchResult, ChatSearchResult } from '@/lib/search/types';

// ---------------------------------------------------------------------------
// Match highlighting
// ---------------------------------------------------------------------------

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const normalizedText = text.normalize('NFC').toLowerCase();
  const normalizedQuery = query.normalize('NFC').toLowerCase();
  const idx = normalizedText.indexOf(normalizedQuery);

  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

// ---------------------------------------------------------------------------
// PersonaResultItem
// ---------------------------------------------------------------------------

interface PersonaResultItemProps {
  result: PersonaSearchResult;
  query: string;
  isSelected: boolean;
  onClick: () => void;
}

export function PersonaResultItem({
  result,
  query,
  isSelected,
  onClick,
}: PersonaResultItemProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
        P
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{highlightMatch(result.name, query)}</p>
        {result.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {result.matchField === 'description'
              ? highlightMatch(result.snippet, query)
              : result.description}
          </p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// ChatResultItem
// ---------------------------------------------------------------------------

interface ChatResultItemProps {
  result: ChatSearchResult;
  query: string;
  isSelected: boolean;
  onClick: () => void;
}

export function ChatResultItem({
  result,
  query,
  isSelected,
  onClick,
}: ChatResultItemProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
      }`}
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
        {result.mode === 'council' ? 'C' : '1'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {result.matchField === 'title'
            ? highlightMatch(result.sessionTitle, query)
            : result.sessionTitle}
        </p>
        {result.matchField === 'content' && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {highlightMatch(result.snippet, query)}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          {result.mode === 'council' ? 'Council' : '1-on-1'}
        </p>
      </div>
    </button>
  );
}
