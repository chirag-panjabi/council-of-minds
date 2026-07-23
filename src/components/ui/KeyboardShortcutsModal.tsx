'use client';

import { useState, useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 08-modal · theme: studio · spec: spec_keyboard_shortcuts.md */

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Global Navigation' | 'Chat & Composer' | 'Council Debate';
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['⌘', 'K'], description: 'Open Global Search & Command Palette', category: 'Global Navigation' },
  { keys: ['⌘', '/'], description: 'Toggle Keyboard Shortcuts Cheat Sheet', category: 'Global Navigation' },
  { keys: ['⌘', 'Shift', 'S'], description: 'Toggle Navigation Sidebar Drawer', category: 'Global Navigation' },
  { keys: ['⌘', ','], description: 'Open Settings Control Panel', category: 'Global Navigation' },
  { keys: ['Enter'], description: 'Send Chat Message in Composer', category: 'Chat & Composer' },
  { keys: ['Shift', 'Enter'], description: 'Insert New Line in Textarea', category: 'Chat & Composer' },
  { keys: ['Escape'], description: 'Close Topmost Modal or Popover', category: 'Chat & Composer' },
  { keys: ['@Persona'], description: 'Trigger Debater Mention Popover', category: 'Council Debate' },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Global keydown listener for Cmd/Ctrl + /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['Global Navigation', 'Chat & Composer', 'Council Debate'] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-xl flex flex-col overflow-hidden max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 id="keyboard-shortcuts-title" className="font-display text-xl text-[var(--color-ink)]">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts modal"
            className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {categories.map((cat) => {
            const catShortcuts = SHORTCUTS.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)] border-b border-[var(--color-border-hairline)] pb-1">
                  {cat}
                </h3>
                <div className="space-y-2">
                  {catShortcuts.map((sc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between gap-4"
                    >
                      <span className="text-xs font-body text-[var(--color-ink)]">{sc.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[11px] font-mono text-[var(--color-ink)] font-semibold shadow-xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
          <span>Press <kbd className="px-1.5 py-0.5 bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-semibold text-[10px]">Esc</kbd> to close</span>
          <button
            onClick={onClose}
            className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
