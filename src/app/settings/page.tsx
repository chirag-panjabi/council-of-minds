'use client';

import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Key, Eye, EyeOff, Shield, Server, Download, Upload, Trash2, CheckCircle2, Cpu, FileText, UserCheck } from 'lucide-react';
import { RestorePreviewModal, BackupManifest } from '@/components/settings/RestorePreviewModal';
import { LocalModelGuidance } from '@/components/settings/LocalModelGuidance';
import { DynamicModelSelector, ModelProvider } from '@/components/ui/DynamicModelSelector';

/* Hallmark · genre: editorial · macrostructure: 04-stat-led · theme: studio · nav: N4 */

export default function SettingsPage() {
  const personas = useLiveQuery(() => db.personas.toArray()) || [];
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [isOllamaEnabled, setIsOllamaEnabled] = useState(false);

  const [personalProfile, setPersonalProfile] = useState('');
  const [defaultProvider, setDefaultProvider] = useState<ModelProvider>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('framework-engine:default-provider') as ModelProvider) || 'openai';
    }
    return 'openai';
  });
  const [defaultModel, setDefaultModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('framework-engine:default-model') || 'gpt-4o';
    }
    return 'gpt-4o';
  });
  const [defaultPersonaId, setDefaultPersonaId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('framework-engine:default-persona-id') || '';
    }
    return '';
  });
  const [showKeys, setShowKeys] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  interface ConnectionDetail {
    status: 'idle' | 'testing' | 'success' | 'error';
    modelCount?: number;
    modelNames?: string[];
    errorMessage?: string;
  }

  const [connectionInfo, setConnectionInfo] = useState<Record<string, ConnectionDetail>>({});

  // Restore & Guidance Modal States
  const [restoreManifest, setRestoreManifest] = useState<BackupManifest | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);

  useEffect(() => {
    setOpenaiKey(localStorage.getItem('framework-engine:api-key:openai') || '');
    setAnthropicKey(localStorage.getItem('framework-engine:api-key:anthropic') || '');
    setGeminiKey(localStorage.getItem('framework-engine:api-key:gemini') || '');
    setOllamaUrl(localStorage.getItem('framework-engine:ollama-url') || 'http://localhost:11434');
    setIsOllamaEnabled(localStorage.getItem('framework-engine:ollama-enabled') === 'true');
    setPersonalProfile(localStorage.getItem('framework-engine:personal-profile') || '');
  }, []);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('framework-engine:api-key:openai', openaiKey.trim());
    localStorage.setItem('framework-engine:api-key:anthropic', anthropicKey.trim());
    localStorage.setItem('framework-engine:api-key:gemini', geminiKey.trim());
    localStorage.setItem('framework-engine:ollama-url', ollamaUrl.trim());
    localStorage.setItem('framework-engine:ollama-enabled', isOllamaEnabled.toString());
    localStorage.setItem('framework-engine:personal-profile', personalProfile.trim());
    localStorage.setItem('framework-engine:default-provider', defaultProvider);
    localStorage.setItem('framework-engine:default-model', defaultModel);
    if (defaultPersonaId) {
      localStorage.setItem('framework-engine:default-persona-id', defaultPersonaId);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async (provider: string, key: string) => {
    setConnectionInfo((prev) => ({ ...prev, [provider]: { status: 'testing' } }));
    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': key,
          'x-ollama-url': ollamaUrl,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setConnectionInfo((prev) => ({
          ...prev,
          [provider]: {
            status: 'success',
            modelCount: data.modelCount,
            modelNames: data.modelNames,
          },
        }));
      } else {
        setConnectionInfo((prev) => ({
          ...prev,
          [provider]: {
            status: 'error',
            errorMessage: data.error || `Validation failed (${res.status})`,
          },
        }));
      }
    } catch (e: any) {
      setConnectionInfo((prev) => ({
        ...prev,
        [provider]: {
          status: 'error',
          errorMessage: e.message || 'Connection failed',
        },
      }));
    }
  };

  const handleExportBackup = async () => {
    const personas = await db.personas.toArray();
    const chats = await db.chats.toArray();
    const messages = await db.messages.toArray();

    const backup = {
      version: 'framework-engine.backup/v1',
      createdAt: Date.now(),
      counts: {
        personas: personas.length,
        chats: chats.length,
        messages: messages.length,
      },
      data: { personas, chats, messages },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-of-minds-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectRestoreFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        setRestoreManifest(parsed);
        setShowRestoreModal(true);
      } catch (err) {
        alert('Invalid backup JSON archive file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestoreData = async (options: {
    restorePersonas: boolean;
    restoreChats: boolean;
    conflictStrategy: 'replace' | 'duplicate' | 'skip';
  }) => {
    if (!restoreManifest || !restoreManifest.data) return;

    if (options.restorePersonas && restoreManifest.data.personas) {
      for (const p of restoreManifest.data.personas) {
        if (options.conflictStrategy === 'duplicate') {
          p.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
          p.name = `${p.name} (Imported)`;
        }
        await db.personas.put(p);
      }
    }

    if (options.restoreChats && restoreManifest.data.chats) {
      for (const c of restoreManifest.data.chats) {
        await db.chats.put(c);
      }
      if (restoreManifest.data.messages) {
        for (const m of restoreManifest.data.messages) {
          await db.messages.put(m);
        }
      }
    }

    alert('Data restoration completed successfully!');
    setRestoreManifest(null);
  };

  const handleWipeData = async () => {
    const confirmation = prompt('DANGER ZONE: Type "DELETE" to permanently wipe all local database records.');
    if (confirmation === 'DELETE') {
      await db.messages.clear();
      await db.chats.clear();
      await db.personas.clear();
      await db.groups.clear();
      await db.usage.clear();
      alert('All local database records have been permanently cleared.');
      window.location.reload();
    }
  };

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-10">
        {/* Local Model Guidance Modal */}
        <LocalModelGuidance
          isOpen={showGuidanceModal}
          onClose={() => setShowGuidanceModal(false)}
          ollamaUrl={ollamaUrl}
        />

        {/* Restore Preview Modal */}
        {restoreManifest && (
          <RestorePreviewModal
            isOpen={showRestoreModal}
            onClose={() => setShowRestoreModal(false)}
            manifest={restoreManifest}
            onConfirmRestore={handleConfirmRestoreData}
          />
        )}

        {/* Page Header (N4) */}
        <header className="border-b border-[var(--color-border-hairline)] pb-6 space-y-2">
          <h1 className="font-display text-4xl font-normal text-[var(--color-ink)]">
            Settings & Control Panel
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            BYOK Key Storage • Local Models • Data Import & Backup
          </p>
        </header>

        {/* Form Container */}
        <form onSubmit={handleSaveKeys} className="space-y-8">
          {/* Section 1: Cloud API Keys */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
              <div className="space-y-1">
                <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
                  <Key className="w-5 h-5 text-[var(--color-accent)]" /> Cloud Model API Keys
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  API keys are stored exclusively in browser localStorage and passed through the stateless proxy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKeys(!showKeys)}
                className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
              >
                {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showKeys ? 'Hide Keys' : 'Show Keys'}
              </button>
            </div>

            <div className="space-y-4">
              {/* OpenAI Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--color-ink)] flex items-center justify-between">
                  <span>OpenAI API Key (sk-...)</span>
                  {connectionInfo['openai']?.status === 'testing' && <span className="text-[var(--color-accent)] font-mono animate-pulse">Testing...</span>}
                  {connectionInfo['openai']?.status === 'success' && (
                    <span className="text-emerald-600 font-mono text-xs" title={connectionInfo['openai'].modelNames?.join(', ')}>
                      ✓ Validated ({connectionInfo['openai'].modelCount || 0} models)
                    </span>
                  )}
                  {connectionInfo['openai']?.status === 'error' && (
                    <span className="text-[var(--color-error)] font-mono text-xs">
                      ✕ {connectionInfo['openai'].errorMessage || 'Error'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestConnection('openai', openaiKey)}
                    disabled={!openaiKey.trim() || connectionInfo['openai']?.status === 'testing'}
                    className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* Anthropic Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--color-ink)] flex items-center justify-between">
                  <span>Anthropic API Key (sk-ant-...)</span>
                  {connectionInfo['anthropic']?.status === 'testing' && <span className="text-[var(--color-accent)] font-mono animate-pulse">Testing...</span>}
                  {connectionInfo['anthropic']?.status === 'success' && (
                    <span className="text-emerald-600 font-mono text-xs">
                      ✓ Validated ({connectionInfo['anthropic'].modelCount || 0} models)
                    </span>
                  )}
                  {connectionInfo['anthropic']?.status === 'error' && (
                    <span className="text-[var(--color-error)] font-mono text-xs">
                      ✕ {connectionInfo['anthropic'].errorMessage || 'Error'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="sk-ant-api..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestConnection('anthropic', anthropicKey)}
                    disabled={!anthropicKey.trim() || connectionInfo['anthropic']?.status === 'testing'}
                    className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* Gemini Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--color-ink)] flex items-center justify-between">
                  <span>Google Gemini API Key (AIzaSy...)</span>
                  {connectionInfo['gemini']?.status === 'testing' && <span className="text-[var(--color-accent)] font-mono animate-pulse">Testing...</span>}
                  {connectionInfo['gemini']?.status === 'success' && (
                    <span className="text-emerald-600 font-mono text-xs" title={connectionInfo['gemini'].modelNames?.join(', ')}>
                      ✓ Validated ({connectionInfo['gemini'].modelCount || 0} models)
                    </span>
                  )}
                  {connectionInfo['gemini']?.status === 'error' && (
                    <span className="text-[var(--color-error)] font-mono text-xs">
                      ✕ {connectionInfo['gemini'].errorMessage || 'Error'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestConnection('gemini', geminiKey)}
                    disabled={!geminiKey.trim() || connectionInfo['gemini']?.status === 'testing'}
                    className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Local Model Settings */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
              <div className="space-y-1">
                <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
                  <Server className="w-5 h-5 text-[var(--color-accent)]" /> Local LLM Engine (Ollama / LM Studio)
                </h2>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Direct browser-to-loopback connection. Zero cloud proxy transit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuidanceModal(true)}
                className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
              >
                CORS & Setup Guide
              </button>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOllamaEnabled}
                  onChange={(e) => setIsOllamaEnabled(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-focus)]"
                />
                <span className="text-xs font-mono text-[var(--color-ink)]">Enable Local LLM Provider Loopback</span>
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--color-ink)] flex items-center justify-between">
                  <span>Local Server URL</span>
                  {connectionInfo['ollama']?.status === 'testing' && <span className="text-[var(--color-accent)] font-mono animate-pulse">Testing...</span>}
                  {connectionInfo['ollama']?.status === 'success' && (
                    <span className="text-emerald-600 font-mono text-xs">
                      ✓ Connected ({connectionInfo['ollama'].modelCount || 0} models)
                    </span>
                  )}
                  {connectionInfo['ollama']?.status === 'error' && (
                    <span className="text-[var(--color-error)] font-mono text-xs">
                      ✕ {connectionInfo['ollama'].errorMessage || 'Unreachable'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestConnection('ollama', '')}
                    disabled={connectionInfo['ollama']?.status === 'testing'}
                    className="btn-hallmark text-xs bg-[var(--color-paper)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Global Default Provider & Model Targets */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-6">
            <div className="space-y-1 border-b border-[var(--color-border-hairline)] pb-4">
              <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[var(--color-accent)]" /> Global Default Targets
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Pre-selects your preferred AI provider, model target, and default persona for new dialogues.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <label className="text-xs font-mono text-[var(--color-ink)] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--color-accent)]" /> Default AI Model Target:
                </label>
                <DynamicModelSelector
                  value={defaultModel}
                  onChange={(newModelId, newProvider) => {
                    setDefaultModel(newModelId);
                    setDefaultProvider(newProvider);
                    localStorage.setItem('framework-engine:default-provider', newProvider);
                    localStorage.setItem('framework-engine:default-model', newModelId);
                  }}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-[var(--color-border-hairline)]">
                <div className="space-y-0.5">
                  <label className="text-xs font-mono text-[var(--color-ink)] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[var(--color-accent)]" /> Default 1-on-1 Persona:
                  </label>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Automatically starts new 1-on-1 dialogues with this persona.
                  </p>
                </div>

                <select
                  value={defaultPersonaId}
                  onChange={(e) => {
                    setDefaultPersonaId(e.target.value);
                    localStorage.setItem('framework-engine:default-persona-id', e.target.value);
                  }}
                  className="px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] font-mono min-w-[240px]"
                >
                  <option value="" disabled>-- Select Default Persona --</option>
                  <optgroup label="⚡ Official Built-in Personas">
                    {personas.filter((p) => p.isSystem || p.id.startsWith('persona-')).map((p) => (
                      <option key={p.id} value={p.id}>⚡ {p.name} ({p.role})</option>
                    ))}
                  </optgroup>
                  <optgroup label="🎨 Custom User Personas">
                    {personas.filter((p) => !p.isSystem && !p.id.startsWith('persona-')).map((p) => (
                      <option key={p.id} value={p.id}>🎨 {p.name} ({p.role})</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Personal System Profile */}
          <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-4">
            <div className="space-y-1 border-b border-[var(--color-border-hairline)] pb-4">
              <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--color-accent)]" /> Personal System Profile
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Global context directive prepended to all 1-on-1 and Council prompts.
              </p>
            </div>

            <textarea
              value={personalProfile}
              onChange={(e) => setPersonalProfile(e.target.value)}
              placeholder="e.g. I am a software architect working on distributed systems. Prefer concise, technical responses..."
              rows={4}
              className="w-full p-3 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] font-mono"
            />
          </div>

          {/* Save Settings Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            >
              Save Settings & Configuration
            </button>

            {savedSuccess && (
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Configuration Saved!
              </span>
            )}
          </div>
        </form>

        {/* Section 4: Data Management & Backup */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-6">
          <div className="space-y-1 border-b border-[var(--color-border-hairline)] pb-4">
            <h2 className="font-display text-xl text-[var(--color-ink)] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[var(--color-accent)]" /> Data Management & Privacy
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Backup your local database, restore archive files, or perform a hard wipe.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleExportBackup}
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON Backup
            </button>

            <label className="btn-hallmark text-xs gap-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]">
              <Upload className="w-3.5 h-3.5" /> Restore Backup Archive
              <input
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && handleSelectRestoreFile(e.target.files[0])}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleWipeData}
              className="btn-hallmark text-xs text-[var(--color-error)] border-[var(--color-error)]/30 hover:bg-[var(--color-error)]/10 gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-error)] ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Wipe Local Database
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
