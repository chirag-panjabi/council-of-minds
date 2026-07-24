'use client';

import React, { useState } from 'react';
import type { PersonaRevision } from '@/types';
import { History, RotateCcw, Clock, ShieldCheck, X } from 'lucide-react';

/* Hallmark · component: PersonaRevisionHistoryModal · genre: studio · theme: studio · spec: spec_persona_library.md §3.4 */

interface PersonaRevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: PersonaRevision[];
  currentVersion: number;
  onRestore: (revision: PersonaRevision) => void;
}

export function PersonaRevisionHistoryModal({
  isOpen,
  onClose,
  revisions,
  currentVersion,
  onRestore,
}: PersonaRevisionHistoryModalProps) {
  const [selectedRevId, setSelectedRevId] = useState<string | null>(
    revisions.length > 0 ? revisions[revisions.length - 1].id : null
  );

  if (!isOpen) return null;

  const selectedRevision = revisions.find((r) => r.id === selectedRevId) || revisions[revisions.length - 1];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] max-w-3xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--color-accent)]" />
            <h3 className="font-display text-xl text-[var(--color-ink)]">
              Persona Revision History (v{currentVersion})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {revisions.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Clock className="w-8 h-8 text-[var(--color-ink-muted)] mx-auto opacity-50" />
            <p className="text-xs font-mono text-[var(--color-ink-muted)]">
              No historical revisions recorded yet. Revisions are created automatically each time you update and save persona directives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[320px]">
            {/* Left Timeline Panel (5 cols) */}
            <div className="md:col-span-5 space-y-2 border-r border-[var(--color-border-hairline)] pr-4 max-h-[380px] overflow-y-auto">
              <div className="text-[10px] font-mono uppercase text-[var(--color-ink-muted)] tracking-wider">
                Revision Timeline:
              </div>
              {revisions
                .slice()
                .reverse()
                .map((rev) => {
                  const isSelected = selectedRevision?.id === rev.id;
                  return (
                    <div
                      key={rev.id}
                      onClick={() => setSelectedRevId(rev.id)}
                      className={`p-3 rounded-[var(--radius-sm)] border cursor-pointer transition-all space-y-1 ${
                        isSelected
                          ? 'bg-[var(--color-paper)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                          : 'bg-[var(--color-paper)] border-[var(--color-border-hairline)] hover:border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-[var(--color-accent)]">
                          v{rev.version}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                          {new Date(rev.updatedAt).toLocaleDateString()} {new Date(rev.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[var(--color-ink)] truncate">
                        {rev.role || 'Directive Revision'}
                      </div>
                      <div className="text-[10px] text-[var(--color-ink-muted)] line-clamp-1">
                        {rev.description || rev.systemPrompt.slice(0, 60)}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Right Preview & Restoration Panel (7 cols) */}
            <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
              {selectedRevision ? (
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-2">
                    <span className="text-xs font-mono font-semibold text-[var(--color-ink)]">
                      Revision v{selectedRevision.version} Details
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                      Saved {new Date(selectedRevision.updatedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-mono text-[var(--color-ink-muted)] block text-[10px]">Role / Title:</span>
                      <span className="font-medium text-[var(--color-ink)]">{selectedRevision.role}</span>
                    </div>

                    <div>
                      <span className="font-mono text-[var(--color-ink-muted)] block text-[10px]">Description:</span>
                      <span className="text-[var(--color-ink-muted)]">{selectedRevision.description}</span>
                    </div>

                    <div>
                      <span className="font-mono text-[var(--color-ink-muted)] block text-[10px]">System Prompt Snapshot:</span>
                      <pre className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded text-[11px] font-mono text-[var(--color-ink)] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {selectedRevision.systemPrompt}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedRevision && (
                <div className="pt-3 border-t border-[var(--color-border-hairline)] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-hallmark text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRestore(selectedRevision);
                      onClose();
                    }}
                    className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Version {selectedRevision.version}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
