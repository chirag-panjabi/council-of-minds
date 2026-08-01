'use client';

import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';

/* Hallmark · component: ImageLightboxModal · genre: studio · theme: studio · modal: M1 */

interface ImageLightboxModalProps {
  isOpen: boolean;
  src?: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightboxModal({ isOpen, src, alt, onClose }: ImageLightboxModalProps) {
  if (!isOpen || !src) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative max-w-5xl max-h-[90vh] flex flex-col bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden">
        {/* Modal Header Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)]">
          <div className="text-xs font-mono text-[var(--color-ink-muted)] truncate max-w-md">
            {alt || 'Image Attachment Preview'}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              download={alt || 'attachment.png'}
              className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] rounded transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </a>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] rounded transition-colors"
              title="Open original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-paper)] rounded transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Image Viewport */}
        <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-black/40">
          <img
            src={src}
            alt={alt || 'Full-screen attachment'}
            className="max-w-full max-h-[75vh] object-contain rounded shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
