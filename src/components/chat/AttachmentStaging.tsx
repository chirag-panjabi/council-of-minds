'use client';

import { X, FileText, Image as ImageIcon, File } from 'lucide-react';

export interface StagedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'text' | 'pdf';
  previewUrl?: string;
  textContent?: string;
}

interface AttachmentStagingProps {
  stagedFiles: StagedFile[];
  onRemoveFile: (id: string) => void;
}

export function AttachmentStaging({ stagedFiles, onRemoveFile }: AttachmentStagingProps) {
  if (stagedFiles.length === 0) return null;

  return (
    <div className="p-3 bg-[var(--color-paper-2)] border-b border-[var(--color-border-hairline)] flex items-center gap-3 overflow-x-auto">
      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-muted)] shrink-0">
        Staged ({stagedFiles.length}/5):
      </span>

      {stagedFiles.map((sf) => (
        <div
          key={sf.id}
          className="p-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] flex items-center gap-2 text-xs font-mono text-[var(--color-ink)] shrink-0 max-w-xs group"
        >
          {sf.type === 'image' && sf.previewUrl ? (
            <img src={sf.previewUrl} alt={sf.name} className="w-6 h-6 object-cover rounded shrink-0" />
          ) : sf.type === 'image' ? (
            <ImageIcon className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
          )}

          <div className="truncate min-w-0">
            <div className="truncate text-xs font-medium">{sf.name}</div>
            <div className="text-[10px] text-[var(--color-ink-muted)]">
              {(sf.size / 1024).toFixed(1)} KB
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemoveFile(sf.id)}
            aria-label={`Remove attachment ${sf.name}`}
            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-error)] shrink-0 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
