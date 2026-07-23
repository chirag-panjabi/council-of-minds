'use client';

import { useState } from 'react';
import { X, Server, Copy, Check, Terminal, ExternalLink, HelpCircle } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 08-modal · theme: studio · spec: spec_local_models.md */

interface LocalModelGuidanceProps {
  isOpen: boolean;
  onClose: () => void;
  ollamaUrl?: string;
}

export function LocalModelGuidance({
  isOpen,
  onClose,
  ollamaUrl = 'http://localhost:11434',
}: LocalModelGuidanceProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  if (!isOpen) return null;

  const ollamaCmd = `OLLAMA_ORIGINS="*" ollama serve`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(ollamaCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleTestPing = async () => {
    setPingStatus('testing');
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`);
      if (res.ok) {
        setPingStatus('success');
      } else {
        setPingStatus('error');
      }
    } catch (e) {
      setPingStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-xl flex flex-col overflow-hidden max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="local-guidance-title"
      >
        {/* Header Bar */}
        <div className="p-4 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 id="local-guidance-title" className="font-display text-xl text-[var(--color-ink)]">
              Local LLM CORS & Connection Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close local LLM guidance modal"
            className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Ollama Setup */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--color-accent)]" /> 1. Ollama CORS Setup (Default: Port 11434)
            </h3>
            <p className="text-xs leading-relaxed text-[var(--color-ink-muted)] font-body">
              Browsers restrict cross-origin background calls to loopback destinations. Run Ollama with the allowed origins environment variable set:
            </p>

            <div className="p-3 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between gap-3">
              <code className="font-mono text-xs text-[var(--color-ink)] select-all break-all">
                {ollamaCmd}
              </code>
              <button
                onClick={handleCopyCmd}
                aria-label="Copy Ollama CORS setup command"
                className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] shrink-0 gap-1"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCmd ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Section 2: LM Studio Setup */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)] flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--color-accent)]" /> 2. LM Studio Setup (Default: Port 1234)
            </h3>
            <p className="text-xs leading-relaxed text-[var(--color-ink-muted)] font-body">
              In LM Studio, navigate to the <strong>Local Server</strong> tab on the sidebar, check the <strong>"Enable CORS"</strong> checkbox, and start the server.
            </p>
          </div>

          {/* Section 3: Diagnostic Ping */}
          <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--color-ink)]">
                Loopback Ping: {ollamaUrl}/api/tags
              </span>
              <button
                onClick={handleTestPing}
                disabled={pingStatus === 'testing'}
                className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
              >
                {pingStatus === 'testing' ? 'Pinging...' : 'Test Connection'}
              </button>
            </div>

            {pingStatus === 'success' && (
              <div className="p-2.5 bg-emerald-500/10 text-emerald-700 text-xs font-mono rounded border border-emerald-500/20">
                ✓ Local engine is online and CORS is configured correctly!
              </div>
            )}

            {pingStatus === 'error' && (
              <div className="p-2.5 bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-mono rounded border border-[var(--color-error)]/20">
                ✕ Connection failed. Verify local daemon is running and CORS origins are enabled.
              </div>
            )}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between gap-3">
          <a
            href="https://docs.ollama.com/faq"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[var(--color-accent)] hover:underline flex items-center gap-1"
          >
            Official Ollama FAQ <ExternalLink className="w-3 h-3" />
          </a>
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
