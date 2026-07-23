'use client';

import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { db } from '@/lib/db';
import { Key, ShieldAlert, Trash2, Eye, EyeOff, Save, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

/* Hallmark · genre: editorial · macrostructure: 04-stat-led · theme: almanac · nav: N1a · footer: Ft7 */

export default function SettingsPage() {
  const router = useRouter();

  // Saved Provider Keys State
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeys, setShowKeys] = useState(false);

  // System Prompt Personal Profile
  const [systemProfile, setSystemProfile] = useState('');

  // Hard Wipe Modal State
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setOpenaiKey(localStorage.getItem('framework-engine:api-key:openai') || '');
    setAnthropicKey(localStorage.getItem('framework-engine:api-key:anthropic') || '');
    setGeminiKey(localStorage.getItem('framework-engine:api-key:gemini') || '');
    setSystemProfile(localStorage.getItem('framework-engine:system-profile') || '');
  }, []);

  const handleSaveKeys = () => {
    localStorage.setItem('framework-engine:api-key:openai', openaiKey.trim());
    localStorage.setItem('framework-engine:api-key:anthropic', anthropicKey.trim());
    localStorage.setItem('framework-engine:api-key:gemini', geminiKey.trim());
    localStorage.setItem('framework-engine:system-profile', systemProfile.trim());

    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
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
            Manage provider credentials, system prompt injections, and local data retention boundaries.
          </p>
        </header>

        {saveStatus && (
          <div className="p-3 bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 rounded text-xs font-mono">
            {saveStatus}
          </div>
        )}

        {/* Section 1: Provider API Key Management */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
            <div>
              <h2 className="font-display text-xl text-[var(--color-ink)]">API Key Credentials (BYOK)</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">Stored exclusively in local browser storage.</p>
            </div>
            <button
              onClick={() => setShowKeys(!showKeys)}
              className="btn-hallmark text-xs gap-1.5"
            >
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showKeys ? 'Mask Keys' : 'Reveal Keys'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">OpenAI API Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Anthropic API Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Google Gemini API Key</label>
              <input
                type={showKeys ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Profile System Injection */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4">
          <h2 className="font-display text-xl text-[var(--color-ink)]">Personal System Profile</h2>
          <p className="text-xs text-[var(--color-ink-muted)]">
            This background instructions block will be prepended to all persona system prompts (e.g. "I am a founder in my 30s building open source tools...").
          </p>
          <textarea
            rows={4}
            value={systemProfile}
            onChange={(e) => setSystemProfile(e.target.value)}
            placeholder="Enter personal context to automatically inform persona responses..."
            className="w-full p-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)]"
          />
        </div>

        <div className="flex justify-end">
          <button onClick={handleSaveKeys} className="btn-hallmark btn-hallmark-primary gap-2">
            <Save className="w-4 h-4" /> Save Settings
          </button>
        </div>

        {/* Section 3: Data Management & Hard Wipe */}
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
                Type <code className="bg-[var(--color-paper-3)] px-1 font-bold text-[var(--color-ink)]">DELETE</code> to confirm permanent deletion of all local storage and history.
              </p>

              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE..."
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded font-mono text-[var(--color-ink)]"
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
      </div>
    </Shell>
  );
}
