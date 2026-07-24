'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, Lock, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface EgressDisclosureModalProps {
  isOpen: boolean;
  providerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function EgressDisclosureModal({
  isOpen,
  providerName,
  onConfirm,
  onCancel,
}: EgressDisclosureModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="egress-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-6 text-zinc-100 font-sans">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 id="egress-modal-title" className="text-lg font-bold tracking-tight text-white">
              Cloud Data Egress Notice
            </h2>
            <p className="text-xs text-zinc-400">Before sending your first request</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            You are about to send a prompt to <span className="font-semibold text-amber-300">{providerName}</span>.
          </p>
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2 text-xs text-zinc-400">
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-zinc-200">Local-First BYOK:</strong> Your API keys and conversation history are stored exclusively in your browser&apos;s IndexedDB and localStorage.
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-zinc-200">Stateless Proxy:</strong> Our same-origin proxy strictly routes your encrypted API payload and does not log, track, or persist your prompts or keys.
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400">
            For 100% offline generation with zero network transmission, you can switch to local engines like <strong className="text-zinc-200">Ollama</strong> in Settings.
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <span>I Understand & Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Policy Link */}
        <div className="text-center pt-1">
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center space-x-1 text-[11px] text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            <span>Read Privacy & Safety Architecture</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
