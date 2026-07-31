'use client';

import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertTriangle, RefreshCw, Globe, Terminal, HelpCircle } from 'lucide-react';
import { LocalModelGuidance } from '@/components/settings/LocalModelGuidance';

/* Hallmark · component: LocalEndpointManager · genre: studio · theme: studio · spec: spec_settings.md (§7.6) */

export type LocalRuntimePreset = 'ollama' | 'lmstudio' | 'vllm' | 'localai' | 'custom';

export interface LocalEndpointConfig {
  preset: LocalRuntimePreset;
  url: string;
  isEnabled: boolean;
}

export const RUNTIME_PRESETS: { id: LocalRuntimePreset; label: string; defaultUrl: string; desc: string }[] = [
  { id: 'ollama', label: 'Ollama', defaultUrl: 'http://localhost:11434', desc: 'Default Ollama daemon loopback' },
  { id: 'lmstudio', label: 'LM Studio', defaultUrl: 'http://localhost:1234/v1', desc: 'LM Studio local REST API' },
  { id: 'vllm', label: 'vLLM Engine', defaultUrl: 'http://localhost:8000/v1', desc: 'High-throughput vLLM server' },
  { id: 'localai', label: 'LocalAI', defaultUrl: 'http://localhost:8080/v1', desc: 'LocalAI OpenAI-compatible backend' },
  { id: 'custom', label: 'Custom Endpoint', defaultUrl: 'http://localhost:5000/v1', desc: 'User custom OpenAI-compatible server' },
];

export function LocalEndpointManager() {
  const [preset, setPreset] = useState<LocalRuntimePreset>('ollama');
  const [url, setUrl] = useState<string>('http://localhost:11434');
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [showGuidanceModal, setShowGuidanceModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('framework-engine:local-endpoint-config');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.preset) setPreset(parsed.preset);
          if (parsed.url) setUrl(parsed.url);
          if (typeof parsed.isEnabled === 'boolean') setIsEnabled(parsed.isEnabled);
        } catch {}
      }
    }
  }, []);

  const saveConfig = (newPreset: LocalRuntimePreset, newUrl: string, newEnabled: boolean) => {
    setPreset(newPreset);
    setUrl(newUrl);
    setIsEnabled(newEnabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'framework-engine:local-endpoint-config',
        JSON.stringify({ preset: newPreset, url: newUrl, isEnabled: newEnabled })
      );
      // Backwards compatibility sync for Ollama URL key
      localStorage.setItem('framework-engine:ollama-url', newUrl);
      localStorage.setItem('framework-engine:ollama-enabled', String(newEnabled));
    }
  };

  const handleSelectPreset = (p: LocalRuntimePreset) => {
    const selected = RUNTIME_PRESETS.find((item) => item.id === p);
    const newUrl = selected ? selected.defaultUrl : url;
    saveConfig(p, newUrl, isEnabled);
    setTestStatus('idle');
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('');

    try {
      const targetUrl = url.trim().replace(/\/+$/, '');
      const pingEndpoint = preset === 'ollama' ? `${targetUrl}/api/tags` : `${targetUrl}/models`;

      const response = await fetch(pingEndpoint, { method: 'GET', mode: 'cors' });
      if (response.ok) {
        setTestStatus('success');
        setTestMessage('✓ Endpoint reachable & responding to browser request');
      } else {
        setTestStatus('error');
        setTestMessage(`✕ Server returned HTTP status ${response.status}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      if (err.name === 'TypeError' || String(err).includes('Failed to fetch')) {
        setTestMessage('✕ CORS Blocked or Local Server Unreachable');
      } else {
        setTestMessage(`✕ Connection error: ${err.message || String(err)}`);
      }
    }
  };

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Local LLM Engine & Runtime Endpoints
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Connect directly to Ollama, LM Studio, vLLM, or LocalAI for zero-cloud zero-egress local inference.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGuidanceModal(true)}
          className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[var(--color-accent)]" /> CORS & Setup Guide
        </button>
      </div>

      <div className="space-y-4 font-mono text-xs">
        {/* Enable Loopback Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => saveConfig(preset, url, e.target.checked)}
            className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
          />
          <span className="text-xs font-mono text-[var(--color-ink)] font-semibold">
            Enable Local Engine Browser Loopback
          </span>
        </label>

        {/* Preset Selector Chips */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase text-[var(--color-ink-muted)] tracking-wider">
            Select Runtime Preset:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {RUNTIME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                  preset === p.id
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] font-semibold shadow-xs'
                    : 'bg-[var(--color-paper)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-accent)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Server URL Input & Test Button */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-[10px] uppercase text-[var(--color-ink-muted)] tracking-wider">
              Endpoint Server Base URL
            </label>
            {testStatus === 'testing' && <span className="text-[var(--color-accent)] animate-pulse">Testing Connection...</span>}
            {testStatus === 'success' && <span className="text-emerald-600 font-semibold">{testMessage}</span>}
            {testStatus === 'error' && <span className="text-red-500 font-semibold">{testMessage}</span>}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => saveConfig(preset, e.target.value, isEnabled)}
              placeholder="http://localhost:11434"
              className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
            >
              Test Connection
            </button>
          </div>
        </div>
      </div>

      <LocalModelGuidance isOpen={showGuidanceModal} onClose={() => setShowGuidanceModal(false)} />
    </div>
  );
}
