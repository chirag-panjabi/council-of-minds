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

export interface AttachmentValidationResult {
  valid: boolean;
  error?: string;
}

export function validateAttachmentFiles(currentCount: number, currentTotalSize: number, newFile: File): AttachmentValidationResult {
  if (currentCount >= 5) {
    return { valid: false, error: 'Maximum 5 file attachments permitted per turn.' };
  }

  const isImage = newFile.type.startsWith('image/');
  const maxIndividual = isImage ? 5 * 1024 * 1024 : 1024 * 1024; // 5MB for images, 1MB for text/pdf

  if (newFile.size > maxIndividual) {
    return {
      valid: false,
      error: `File "${newFile.name}" exceeds maximum allowed size (${isImage ? '5MB' : '1MB'}).`,
    };
  }

  if (currentTotalSize + newFile.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'Total attachment batch size exceeds 10MB limit.' };
  }

  return { valid: true };
}

interface AttachmentStagingProps {
  stagedFiles: StagedFile[];
  onRemoveFile: (id: string) => void;
  onPreviewImage?: (src: string, alt: string) => void;
}

export function AttachmentStaging({ stagedFiles, onRemoveFile, onPreviewImage }: AttachmentStagingProps) {
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
            <button
              type="button"
              onClick={() => onPreviewImage && sf.previewUrl && onPreviewImage(sf.previewUrl, sf.name)}
              className="relative group/img cursor-pointer shrink-0 focus:outline-none"
              title="Click to expand image"
            >
              <img src={sf.previewUrl} alt={sf.name} className="w-6 h-6 object-cover rounded hover:opacity-80 transition-opacity" />
            </button>
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
