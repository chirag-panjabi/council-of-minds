'use client';

import { useState, useEffect, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { db } from '@/lib/db';
import { ShieldAlert, Trash2, Eye, EyeOff, Save, Download, Upload, Cpu, CheckCircle2, AlertCircle, Play } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 04-stat-led · theme: almanac · nav: N1a · footer: Ft7 */

export default function SettingsPage() {
  // Saved Provider Keys State
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaEnabled, setOllamaEnabled] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  // Connection Ping Test Badges
  const [testResults, setTestResults] = useState<Record<string, { status: 'testing' | 'success' | 'error'; message: string }>>({});

  // System Prompt Personal Profile
  const [systemProfile, setSystemProfile] = useState('');

  // Hard Wipe & Backup State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOpenaiKey(localStorage.getItem('framework-engine:api-key:openai') || '');
    setAnthropicKey(localStorage.getItem('framework-engine:api-key:anthropic') || '');
    setGeminiKey(localStorage.getItem('framework-engine:api-key:gemini') || '');
    setOllamaUrl(localStorage.getItem('framework-engine:ollama-url') || 'http://localhost:11434');
    setOllamaEnabled(localStorage.getItem('framework-engine:ollama-enabled') === 'true');
    setSystemProfile(localStorage.getItem('framework-engine:system-profile') || '');
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('framework-engine:api-key:openai', openaiKey.trim());
    localStorage.setItem('framework-engine:api-key:anthropic', anthropicKey.trim());
    localStorage.setItem('framework-engine:api-key:gemini', geminiKey.trim());
    localStorage.setItem('framework-engine:ollama-url', ollamaUrl.trim());
    localStorage.setItem('framework-engine:ollama-enabled', String(ollamaEnabled));
    localStorage.setItem('framework-engine:system-profile', systemProfile.trim());

    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTestConnection = async (provider: 'openai' | 'anthropic' | 'gemini' | 'ollama') => {
    setTestResults((prev) => ({ ...prev, [provider]: { status: 'testing', message: 'Testing connection...' } }));

    try {
      let apiKey = '';
      let model = 'gpt-4o-mini';

      if (provider === 'openai') apiKey = openaiKey.trim();
      else if (provider === 'anthropic') {
        apiKey = anthropicKey.trim();
        model = 'claude-3-5-sonnet';
      } else if (provider === 'gemini') {
        apiKey = geminiKey.trim();
        model = 'gemini-1.5-pro';
      } else if (provider === 'ollama') {
        model = 'ollama-local';
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          systemPrompt: 'Respond strictly with "OK".',
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setTestResults((prev) => ({ ...prev, [provider]: { status: 'success', message: 'Connection Verified!' } }));
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [provider]: { status: 'error', message: err.message || 'Connection failed.' } }));
    }
  };

  const handleExportBackup = async () => {
    const backupData = {
      schema: 'framework-engine.backup/v1',
      timestamp: Date.now(),
      personas: await db.personas.toArray(),
      groups: await db.groups.toArray(),
      chats: await db.chats.toArray(),
      messages: await db.messages.toArray(),
      attachments: await db.attachments.toArray(),
      usage: await db.usage.toArray(),
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `council-of-minds-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setBackupStatus('Complete backup exported successfully!');
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);

          if (parsed.schema !== 'framework-engine.backup/v1') {
            throw new Error('Invalid backup schema file.');
          }

          if (parsed.personas?.length) await db.personas.bulkPut(parsed.personas);
          if (parsed.groups?.length) await db.groups.bulkPut(parsed.groups);
          if (parsed.chats?.length) await db.chats.bulkPut(parsed.chats);
          if (parsed.messages?.length) await db.messages.bulkPut(parsed.messages);
          if (parsed.attachments?.length) await db.attachments.bulkPut(parsed.attachments);
          if (parsed.usage?.length) await db.usage.bulkPut(parsed.usage);

          setBackupStatus('Backup imported successfully into IndexedDB!');
          setTimeout(() => setBackupStatus(null), 3000);
        } catch (err: any) {
          alert(`Import Error: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert(`Import Failed: ${err.message}`);
    }
  };

  const handleHardWipe = async () => {
    if (deleteConfirmation.trim() !== 'DELETE') return;

    // Clear IndexedDB Tables
    await db.delete();

    // Clear LocalStorage
    localStorage.clear();

    // Route Guard Refresh to Onboarding
    window.location.href = '/onboarding';
  };

  return (
    <Shell>
      <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
        {/* N1a Broad-sheet Header */}
        <header className="border-b border-[var(--color-border-hairline)] pb-4 space-y-1">
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            Administrative Control Panel
          </div>
          <h1 className="font-display text-4xl text-[var(--color-ink)]">System Settings</h1>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Manage provider credentials, test active connections, and configure data retention boundaries.
          </p>
        </header>

        {saveStatus && (
          <div className="p-3 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {saveStatus}
          </div>
        )}

        {backupStatus && (
          <div className="p-3 bg-[var(--color-paper-3)] text-[var(--color-ink)] border border-[var(--color-border)] rounded text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" /> {backupStatus}
          </div>
        )}

        {/* Section 1: Provider API Key Management & Ollama Local Setup */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink)]">API Key Credentials & Local Engines (BYOK)</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">Stored exclusively in local browser storage.</p>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showKeys ? 'Mask Keys' : 'Reveal Keys'}
            </button>
          </div>

          <div className="space-y-4">
            {/* OpenAI */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">OpenAI API Key</label>
                <div className="flex items-center gap-2">
                  {testResults.openai && (
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${testResults.openai.status === 'success' ? 'text-[var(--color-accent)]' : 'text-[var(--color-error)]'}`}>
                      {testResults.openai.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {testResults.openai.message}
                    </span>
                  )}
                  <button
                    onClick={() => handleTestConnection('openai')}
                    className="text-[10px] font-mono text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] focus:outline-none"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>

            {/* Anthropic */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Anthropic API Key</label>
                <div className="flex items-center gap-2">
                  {testResults.anthropic && (
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${testResults.anthropic.status === 'success' ? 'text-[var(--color-accent)]' : 'text-[var(--color-error)]'}`}>
                      {testResults.anthropic.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {testResults.anthropic.message}
                    </span>
                  )}
                  <button
                    onClick={() => handleTestConnection('anthropic')}
                    className="text-[10px] font-mono text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] focus:outline-none"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>

            {/* Gemini */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Google Gemini API Key</label>
                <div className="flex items-center gap-2">
                  {testResults.gemini && (
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${testResults.gemini.status === 'success' ? 'text-[var(--color-accent)]' : 'text-[var(--color-error)]'}`}>
                      {testResults.gemini.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {testResults.gemini.message}
                    </span>
                  )}
                  <button
                    onClick={() => handleTestConnection('gemini')}
                    className="text-[10px] font-mono text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] focus:outline-none"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
              <input
                type={showKeys ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>

            {/* Ollama Local Engine Config */}
            <div className="pt-3 border-t border-[var(--color-border-hairline)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)]">
                  <Cpu className="w-4 h-4 text-[var(--color-accent)]" /> Ollama Local Engine Connection
                </div>
                <div className="flex items-center gap-3">
                  {testResults.ollama && (
                    <span className={`text-[10px] font-mono flex items-center gap-1 ${testResults.ollama.status === 'success' ? 'text-[var(--color-accent)]' : 'text-[var(--color-error)]'}`}>
                      {testResults.ollama.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {testResults.ollama.message}
                    </span>
                  )}
                  <button
                    onClick={() => handleTestConnection('ollama')}
                    className="text-[10px] font-mono text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] focus:outline-none"
                  >
                    Test Connection
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-mono">
                    <input
                      type="checkbox"
                      checked={ollamaEnabled}
                      onChange={(e) => setOllamaEnabled(e.target.checked)}
                      className="accent-[var(--color-accent)]"
                    />
                    <span>Enable Local Engine</span>
                  </label>
                </div>
              </div>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Profile System Injection */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
          <h2 className="font-display text-xl text-[var(--color-ink)]">Personal System Profile</h2>
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
            This background instructions block will be prepended to all persona system prompts (e.g. "I am a founder in my 30s building open source tools...").
          </p>
          <textarea
            rows={4}
            value={systemProfile}
            onChange={(e) => setSystemProfile(e.target.value)}
            placeholder="Enter personal context to automatically inform persona responses..."
            className="w-full p-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
          />
        </div>

        <div className="flex justify-end">
          <button onClick={handleSaveKeys} className="btn-hallmark btn-hallmark-primary gap-2 text-xs">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>

        {/* Section 3: Data Management & Backup Import/Export */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
          <div>
            <h2 className="font-display text-xl text-[var(--color-ink)]">Database Backup & Transfer</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Export 1-click JSON backups of all local IndexedDB tables or restore from a previous backup file.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="btn-hallmark text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Complete Backup (.json)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-hallmark text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Restore Backup (.json)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackupFile}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {/* Section 4: Danger Zone Hard Wipe */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-error)]/30 rounded-[var(--radius-lg)] space-y-4">
          <div className="flex items-center gap-2 text-[var(--color-error)]">
            <ShieldAlert className="w-5 h-5" />
            <h2 className="font-display text-xl">Danger Zone: Data Management</h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Wipe all local IndexedDB tables, stored API keys, and conversation logs. This action is permanent and cannot be undone.
          </p>

          <button
            onClick={() => setIsWipeModalOpen(true)}
            className="btn-hallmark text-xs text-[var(--color-error)] border-[var(--color-error)]/40 hover:bg-[var(--color-error)]/10 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Wipe All Local Data
          </button>
        </div>

        {/* Hard Wipe Modal */}
        {isWipeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-[var(--color-paper)] border border-[var(--color-error)] rounded-[var(--radius-lg)] p-6 space-y-4">
              <h3 className="font-display text-xl text-[var(--color-error)]">Confirm Hard Data Wipe</h3>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Type <code className="bg-[var(--color-paper-3)] px-1 font-bold text-[var(--color-ink)] font-mono">DELETE</code> to confirm permanent deletion of all local storage and history.
              </p>

              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-error)]"
              />

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setIsWipeModalOpen(false)} className="text-xs text-[var(--color-ink-muted)] underline">
                  Cancel
                </button>
                <button
                  onClick={handleHardWipe}
                  disabled={deleteConfirmation.trim() !== 'DELETE'}
                  className="btn-hallmark text-xs bg-[var(--color-error)] text-white border-none disabled:opacity-40"
                >
                  Confirm Delete & Reload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ft7 Almanac Colophon Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-6 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Settings Control Schema v1.0 • Almanac Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
