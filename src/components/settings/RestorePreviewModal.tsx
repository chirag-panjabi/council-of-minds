'use client';

import { useState } from 'react';
import { X, Database, AlertTriangle, CheckCircle, FileText, Users, MessageSquare } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 08-modal · theme: studio · spec: spec_data_management.md */

export interface BackupManifest {
  version: string;
  createdAt: number;
  counts: {
    personas: number;
    chats: number;
    messages: number;
  };
  data: {
    personas?: any[];
    chats?: any[];
    messages?: any[];
  };
}

interface RestorePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: BackupManifest;
  onConfirmRestore: (options: {
    restorePersonas: boolean;
    restoreChats: boolean;
    conflictStrategy: 'replace' | 'duplicate' | 'skip';
  }) => void;
}

export function RestorePreviewModal({
  isOpen,
  onClose,
  manifest,
  onConfirmRestore,
}: RestorePreviewModalProps) {
  const [restorePersonas, setRestorePersonas] = useState(true);
  const [restoreChats, setRestoreChats] = useState(true);
  const [conflictStrategy, setConflictStrategy] = useState<'replace' | 'duplicate' | 'skip'>('duplicate');

  if (!isOpen || !manifest) return null;

  const handleConfirm = () => {
    onConfirmRestore({
      restorePersonas,
      restoreChats,
      conflictStrategy,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-xl flex flex-col overflow-hidden max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-preview-title"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 id="restore-preview-title" className="font-display text-xl text-[var(--color-ink)]">
              Restore Backup Preview
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close restore preview modal"
            className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Metadata */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Manifest Summary Card */}
          <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
              <span>Schema: {manifest.version || 'v1'}</span>
              <span>Created: {new Date(manifest.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-center space-y-1">
                <Users className="w-4 h-4 text-[var(--color-accent)] mx-auto" />
                <div className="font-display text-lg text-[var(--color-ink)]">{manifest.counts?.personas || 0}</div>
                <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">Personas</div>
              </div>

              <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-center space-y-1">
                <MessageSquare className="w-4 h-4 text-[var(--color-accent)] mx-auto" />
                <div className="font-display text-lg text-[var(--color-ink)]">{manifest.counts?.chats || 0}</div>
                <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">Chats</div>
              </div>

              <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-center space-y-1">
                <FileText className="w-4 h-4 text-[var(--color-accent)] mx-auto" />
                <div className="font-display text-lg text-[var(--color-ink)]">{manifest.counts?.messages || 0}</div>
                <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">Messages</div>
              </div>
            </div>
          </div>

          {/* Scope Toggles */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Restore Scope
            </h3>
            <div className="space-y-2">
              <label className="p-3 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between cursor-pointer">
                <span className="text-xs font-body text-[var(--color-ink)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--color-accent)]" /> Restore Custom Personas ({manifest.counts?.personas || 0})
                </span>
                <input
                  type="checkbox"
                  checked={restorePersonas}
                  onChange={(e) => setRestorePersonas(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
                />
              </label>

              <label className="p-3 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between cursor-pointer">
                <span className="text-xs font-body text-[var(--color-ink)] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[var(--color-accent)]" /> Restore Chat Sessions & History ({manifest.counts?.chats || 0})
                </span>
                <input
                  type="checkbox"
                  checked={restoreChats}
                  onChange={(e) => setRestoreChats(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
                />
              </label>
            </div>
          </div>

          {/* Collision Resolution Strategy */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Conflict Resolution Strategy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {(['duplicate', 'replace', 'skip'] as const).map((strat) => (
                <button
                  key={strat}
                  type="button"
                  onClick={() => setConflictStrategy(strat)}
                  className={`p-3 border rounded-[var(--radius-sm)] text-left transition-all focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                    conflictStrategy === strat
                      ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] font-semibold'
                      : 'bg-[var(--color-paper-2)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)]'
                  }`}
                >
                  <div className="text-xs font-mono uppercase text-[var(--color-ink)]">
                    {strat === 'duplicate' ? 'Keep Both' : strat === 'replace' ? 'Overwrite' : 'Skip Conflict'}
                  </div>
                  <div className="text-[10px] text-[var(--color-ink-muted)] mt-1">
                    {strat === 'duplicate'
                      ? 'Assign new UUID and append (Imported)'
                      : strat === 'replace'
                      ? 'Overwrite local records with import'
                      : 'Keep local version unchanged'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!restorePersonas && !restoreChats}
            className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] disabled:opacity-40"
          >
            Confirm & Commit Restore
          </button>
        </div>
      </div>
    </div>
  );
}
