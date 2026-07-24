'use client';

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, MessageSquare, Users, Key, RefreshCw } from 'lucide-react';
import { db, isOfficialPersona } from '@/lib/db';

/* Hallmark · genre: studio · macrostructure: 08-modal · theme: studio · spec: spec_data_management.md §3.2 */

export type ClearDataScope = 'chats' | 'personas' | 'settings' | 'full';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleared: (scope: ClearDataScope) => void;
}

export function ClearDataModal({ isOpen, onClose, onCleared }: ClearDataModalProps) {
  const [scope, setScope] = useState<ClearDataScope>('chats');
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const isFullReset = scope === 'full';
  const canSubmit = !isFullReset || confirmText.trim().toUpperCase() === 'DELETE';

  const handleExecuteWipe = async () => {
    if (!canSubmit) return;
    setIsClearing(true);

    try {
      if (scope === 'chats') {
        await db.messages.clear();
        await db.chats.clear();
        await db.usage.clear();
      } else if (scope === 'personas') {
        const allPersonas = await db.personas.toArray();
        const customPersonaIds = allPersonas.filter((p) => !isOfficialPersona(p)).map((p) => p.id);
        await db.personas.bulkDelete(customPersonaIds);
        await db.groups.clear();
      } else if (scope === 'settings') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('framework-engine:') || key.startsWith('council:')) {
            localStorage.removeItem(key);
          }
        });
      } else if (scope === 'full') {
        await db.messages.clear();
        await db.chats.clear();
        await db.personas.clear();
        await db.groups.clear();
        await db.usage.clear();
        localStorage.clear();
      }

      onCleared(scope);
      onClose();
      if (scope === 'full' || scope === 'settings') {
        window.location.reload();
      }
    } catch (err: any) {
      alert('Failed to clear selected data: ' + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-data-title"
    >
      <div className="w-full max-w-lg bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-[var(--color-error)]" />
            <h2 id="clear-data-title" className="font-display text-xl text-[var(--color-ink)]">
              Granular Data Wipe
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Options */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <p className="text-xs text-[var(--color-ink-muted)]">
            Select the specific scope of local data you wish to delete:
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Chats Only */}
            <label
              onClick={() => setScope('chats')}
              className={`p-3.5 border rounded-[var(--radius-md)] flex items-start gap-3 cursor-pointer transition-all ${
                scope === 'chats'
                  ? 'bg-[var(--color-paper-2)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                  : 'bg-[var(--color-paper)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="clear-scope"
                checked={scope === 'chats'}
                onChange={() => setScope('chats')}
                className="mt-0.5 text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
              />
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Chat Sessions & History Only
                </div>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Deletes all 1-on-1 and Council dialogues and usage logs. Preserves custom personas and API keys.
                </p>
              </div>
            </label>

            {/* Option 2: Custom Personas Only */}
            <label
              onClick={() => setScope('personas')}
              className={`p-3.5 border rounded-[var(--radius-md)] flex items-start gap-3 cursor-pointer transition-all ${
                scope === 'personas'
                  ? 'bg-[var(--color-paper-2)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                  : 'bg-[var(--color-paper)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="clear-scope"
                checked={scope === 'personas'}
                onChange={() => setScope('personas')}
                className="mt-0.5 text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
              />
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Custom Personas & Groups Only
                </div>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Deletes user-created personas and groups. Preserves official personas, chat sessions, and API keys.
                </p>
              </div>
            </label>

            {/* Option 3: API Keys & Settings Only */}
            <label
              onClick={() => setScope('settings')}
              className={`p-3.5 border rounded-[var(--radius-md)] flex items-start gap-3 cursor-pointer transition-all ${
                scope === 'settings'
                  ? 'bg-[var(--color-paper-2)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                  : 'bg-[var(--color-paper)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="clear-scope"
                checked={scope === 'settings'}
                onChange={() => setScope('settings')}
                className="mt-0.5 text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
              />
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[var(--color-accent)]" /> API Keys & App Preferences Only
                </div>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Clears local API keys, model choices, and profiles from localStorage. Preserves chat database.
                </p>
              </div>
            </label>

            {/* Option 4: Full Factory Reset */}
            <label
              onClick={() => setScope('full')}
              className={`p-3.5 border rounded-[var(--radius-md)] flex items-start gap-3 cursor-pointer transition-all ${
                scope === 'full'
                  ? 'bg-[var(--color-error)]/10 border-[var(--color-error)] ring-1 ring-[var(--color-error)]'
                  : 'bg-[var(--color-paper)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)]'
              }`}
            >
              <input
                type="radio"
                name="clear-scope"
                checked={scope === 'full'}
                onChange={() => setScope('full')}
                className="mt-0.5 text-[var(--color-error)] focus:ring-[var(--color-error)]"
              />
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-[var(--color-error)] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Full Factory Reset (All Local Data)
                </div>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Permanently wipes all IndexedDB tables and localStorage settings. Re-initializes app state.
                </p>
              </div>
            </label>
          </div>

          {/* Full Wipe Confirmation Text Entry */}
          {isFullReset && (
            <div className="p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded space-y-2 animate-in fade-in">
              <label className="text-xs font-mono text-[var(--color-error)] block font-semibold">
                Type &quot;DELETE&quot; to confirm full database reset:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full p-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-error)]/40 rounded text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-error)] uppercase"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteWipe}
            disabled={!canSubmit || isClearing}
            className={`btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-2 disabled:opacity-40 ${
              isFullReset
                ? 'bg-[var(--color-error)] text-white hover:bg-red-700 focus:ring-[var(--color-error)]'
                : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus:ring-[var(--color-focus)]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isClearing ? 'Clearing...' : isFullReset ? 'Confirm Full Reset' : 'Clear Selected Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
