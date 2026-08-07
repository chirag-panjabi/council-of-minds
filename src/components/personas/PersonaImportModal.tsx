'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, ShieldCheck, FileText, ArrowRight, RefreshCw, Copy } from 'lucide-react';
import { db } from '@/lib/db';
import type { Persona } from '@/types';

/* Hallmark · genre: studio · macrostructure: 08-modal · theme: studio · spec: spec_persona_library.md §3.4 */

interface PersonaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPersonas: Persona[];
  onImportSuccess: () => void;
}

export function PersonaImportModal({
  isOpen,
  onClose,
  existingPersonas,
  onImportSuccess,
}: PersonaImportModalProps) {
  const [activeTab, setActiveTab] = useState<'share-code' | 'json-file'>('share-code');
  const [inputCode, setInputCode] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsedCandidate, setParsedCandidate] = useState<Partial<Persona> | null>(null);
  const [collisionTarget, setCollisionTarget] = useState<Persona | null>(null);
  const [resolutionStrategy, setResolutionStrategy] = useState<'replace' | 'duplicate' | 'skip'>('duplicate');
  const [applyToAll, setApplyToAll] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setInputCode('');
    setFileError(null);
    setParsedCandidate(null);
    setCollisionTarget(null);
    setResolutionStrategy('duplicate');
    setApplyToAll(false);
    setIsCommitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parsePayloadString = (rawStr: string) => {
    setFileError(null);
    setParsedCandidate(null);
    setCollisionTarget(null);

    const trimmed = rawStr.trim();
    if (!trimmed) return;

    try {
      let jsonString = trimmed;
      // If Base64 string, attempt atob decode
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        try {
          jsonString = atob(trimmed);
        } catch {
          // Fallback to decodeURIComponent if Base64URL
          jsonString = decodeURIComponent(escape(atob(trimmed.replace(/-/g, '+').replace(/_/g, '/'))));
        }
      }

      const parsed = JSON.parse(jsonString);
      let candidateObj: any = null;

      if (parsed.version === 'framework-engine.persona/v1' && parsed.persona) {
        candidateObj = parsed.persona;
      } else if (parsed.name && (parsed.systemPrompt || parsed.instructions)) {
        candidateObj = parsed;
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        candidateObj = parsed[0]; // Take first item for preview
      } else {
        throw new Error('Unrecognized persona schema format.');
      }

      const candidatePersona: Partial<Persona> = {
        id: candidateObj.id || 'custom-' + Date.now(),
        name: candidateObj.name || 'Imported Persona',
        role: candidateObj.role || candidateObj.tagline || 'Specialist',
        description: candidateObj.description || '',
        systemPrompt: candidateObj.systemPrompt || candidateObj.instructions || '',
        welcomeMessage: candidateObj.welcomeMessage || candidateObj.firstMessage || undefined,
        tags: Array.isArray(candidateObj.tags) ? candidateObj.tags : ['imported'],
        avatar: candidateObj.avatar || '👤',
      };

      setParsedCandidate(candidatePersona);

      // Check collision
      const collision = existingPersonas.find(
        (p) => p.id === candidatePersona.id || p.name.toLowerCase() === candidatePersona.name?.toLowerCase()
      );

      if (collision) {
        setCollisionTarget(collision);
      }
    } catch (err: any) {
      setFileError(err.message || 'Invalid Base64 or JSON persona string.');
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputCode(content);
      parsePayloadString(content);
    };
    reader.readAsText(file);
  };

  const handleCommitImport = async () => {
    if (!parsedCandidate) return;
    setIsCommitting(true);

    try {
      let finalId = parsedCandidate.id || 'custom-' + Date.now();
      let finalName = parsedCandidate.name || 'Imported Persona';

      if (collisionTarget) {
        if (resolutionStrategy === 'skip') {
          handleClose();
          return;
        }
        if (resolutionStrategy === 'duplicate') {
          finalId = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
          finalName = `${finalName} (Imported)`;
        } else if (resolutionStrategy === 'replace') {
          finalId = collisionTarget.id;
        }
      }

      const toSave: Persona = {
        id: finalId,
        name: finalName,
        role: parsedCandidate.role || 'Specialist',
        description: parsedCandidate.description || '',
        systemPrompt: parsedCandidate.systemPrompt || '',
        welcomeMessage: parsedCandidate.welcomeMessage,
        tags: parsedCandidate.tags || ['imported'],
        avatar: parsedCandidate.avatar || '👤',
        isArchived: false,
        createdAt: Date.now(),
      };

      await db.personas.put(toSave);
      onImportSuccess();
      handleClose();
    } catch (err: any) {
      setFileError('Failed to commit persona to local IndexedDB: ' + err.message);
      setIsCommitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="w-full max-w-xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 id="import-modal-title" className="font-display text-xl text-[var(--color-ink)]">
              Import Persona
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Method Tabs */}
          <div className="flex border-b border-[var(--color-border-hairline)] gap-4">
            <button
              onClick={() => { setActiveTab('share-code'); resetState(); }}
              className={`pb-2 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'share-code'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                  : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              Base64 Share Code
            </button>
            <button
              onClick={() => { setActiveTab('json-file'); resetState(); }}
              className={`pb-2 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'json-file'
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                  : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              JSON File Upload
            </button>
          </div>

          {/* Input Section */}
          {activeTab === 'share-code' ? (
            <div className="space-y-2">
              <label className="text-xs font-mono text-[var(--color-ink-muted)]">
                Paste Base64 URL share code (<code className="text-zinc-300">framework-engine.persona/v1</code>):
              </label>
              <textarea
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  parsePayloadString(e.target.value);
                }}
                placeholder="Paste Base64 persona share string here..."
                rows={3}
                className="w-full p-3 font-mono text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-mono text-[var(--color-ink-muted)]">
                Upload raw <code className="text-zinc-300">.json</code> persona file:
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-paper-2)] rounded-[var(--radius-md)] p-6 text-center cursor-pointer transition-colors space-y-2"
              >
                <FileText className="w-8 h-8 text-[var(--color-accent)] mx-auto opacity-70" />
                <p className="text-xs font-mono text-[var(--color-ink)]">
                  Click or drag a <span className="text-[var(--color-accent)]">.json</span> persona file here
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {fileError && (
            <div className="p-3 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-mono rounded border border-[var(--color-error)]/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Candidate Decoded Preview */}
          {parsedCandidate && (
            <div className="space-y-4 border-t border-[var(--color-border-hairline)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Decoded Payload Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Untrusted Text Verification
                </span>
              </div>

              {/* Persona Card Preview */}
              <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl shrink-0">
                    {parsedCandidate.avatar || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base text-[var(--color-ink)] truncate">
                      {parsedCandidate.name}
                    </h4>
                    <p className="text-xs font-mono text-[var(--color-accent)]">
                      {parsedCandidate.role}
                    </p>
                  </div>
                </div>

                {parsedCandidate.description && (
                  <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                    {parsedCandidate.description}
                  </p>
                )}

                {parsedCandidate.tags && parsedCandidate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {parsedCandidate.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* System Prompt Preview */}
                <div className="space-y-1 pt-2 border-t border-[var(--color-border-hairline)]">
                  <span className="text-[11px] font-mono text-[var(--color-ink-muted)]">
                    System Instructions (Preview):
                  </span>
                  <div className="p-2.5 bg-zinc-950/80 border border-zinc-800 rounded font-mono text-[11px] text-zinc-300 max-h-24 overflow-y-auto leading-relaxed select-all">
                    {parsedCandidate.systemPrompt}
                  </div>
                </div>
              </div>

              {/* Collision Alert & Resolution Controls */}
              {collisionTarget && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[var(--radius-md)] space-y-3 text-amber-200">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Identity Collision: Persona &quot;{collisionTarget.name}&quot; already exists!</span>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <label className="text-[11px] font-mono text-amber-300/80 block">Select Resolution Action:</label>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setResolutionStrategy('duplicate')}
                        className={`p-2 rounded border text-[11px] font-mono transition-all flex flex-col items-center gap-1 ${
                          resolutionStrategy === 'duplicate'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-bold'
                            : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Keep Both</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResolutionStrategy('replace')}
                        className={`p-2 rounded border text-[11px] font-mono transition-all flex flex-col items-center gap-1 ${
                          resolutionStrategy === 'replace'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-bold'
                            : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResolutionStrategy('skip')}
                        className={`p-2 rounded border text-[11px] font-mono transition-all flex flex-col items-center gap-1 ${
                          resolutionStrategy === 'skip'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-100 font-bold'
                            : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 text-[11px] font-mono text-amber-300/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToAll}
                      onChange={(e) => setApplyToAll(e.target.checked)}
                      className="rounded border-amber-500/40 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Apply resolution choice to all conflicts</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            Cancel
          </button>
          <button
            onClick={handleCommitImport}
            disabled={!parsedCandidate || isCommitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[var(--radius-sm)] text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-all disabled:opacity-40 active:scale-95"
          >
            <span>{isCommitting ? 'Importing...' : 'Commit Import'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
