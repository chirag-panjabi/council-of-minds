'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, ExternalLink, Eye, EyeOff, User } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 12-letter · theme: newsprint · nav: N9 · footer: Ft6 */

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'ollama'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [systemProfile, setSystemProfile] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValidateAndSave = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      if (selectedProvider === 'ollama') {
        // Direct browser ping to local Ollama tags endpoint
        const res = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);
        if (!res || !res.ok) {
          throw new Error('Could not connect to Ollama on ' + ollamaUrl + '. Please ensure Ollama is running and CORS is enabled via OLLAMA_ORIGINS.');
        }
        localStorage.setItem('framework-engine:ollama-enabled', 'true');
        localStorage.setItem('framework-engine:ollama-url', ollamaUrl);
      } else {
        if (!apiKey.trim()) {
          throw new Error('Please enter a valid API key.');
        }
        // Test key via dynamic validation proxy endpoint
        const res = await fetch('/api/validate-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-provider': selectedProvider,
            'x-api-key': apiKey.trim(),
            'x-ollama-url': ollamaUrl,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Validation failed (${res.status})`);
        }

        // Store key locally
        localStorage.setItem(`framework-engine:api-key:${selectedProvider}`, apiKey.trim());
      }

      if (systemProfile.trim()) {
        localStorage.setItem('framework-engine:system-profile', systemProfile.trim());
      }

      // Route to Dashboard
      localStorage.removeItem('framework-engine:has_skipped_onboarding');
      router.push('/');
    } catch (err: any) {
      setValidationError(err.message || 'Validation failed. Please check your credentials.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    if (systemProfile.trim()) {
      localStorage.setItem('framework-engine:system-profile', systemProfile.trim());
    }
    localStorage.setItem('framework-engine:has_skipped_onboarding', 'true');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] flex flex-col justify-between p-6 md:p-12">
      {/* N9 Edge-Aligned Minimal Navigation Header */}
      <header className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div className="font-display text-2xl font-normal tracking-tight">Council of Minds</div>
        <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
          Onboarding Letter & Architecture Setup
        </div>
      </header>

      {/* 12 · Letter Macrostructure Body */}
      <main className="max-w-2xl mx-auto my-12 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
            <span>Dear Thinker,</span>
            <span className="text-[var(--color-ink-muted)] font-normal">July 2026 • Letter No. 01</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-[var(--color-ink)] leading-tight">
            Welcome to a local-first studio for multi-perspective clarity.
          </h1>
          <p className="text-base text-[var(--color-ink-muted)] leading-relaxed font-body">
            Council of Minds separates knowledge frameworks from prompt behaviors so you can watch competing personas debate complex personal and strategic dilemmas.
          </p>
          <div className="text-xs font-mono text-[var(--color-ink-muted)] pt-1 italic">
            — The Council Architects
          </div>
        </div>

        {/* Privacy & Security Disclosure Banner */}
        <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] font-mono">
            <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />
            Local Storage & Privacy Guarantee
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
            Your chats, custom personas, and settings are stored 100% locally in your browser’s IndexedDB. Your API keys never touch a server database and only transit the stateless proxy during active generations.
          </p>
        </div>

        {/* Provider Setup Configuration Card */}
        <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-[var(--color-ink)]">Configure Your First Provider</h2>
            <span className="text-xs font-mono text-[var(--color-ink-muted)]">BYOK Setup</span>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { id: 'openai', label: 'OpenAI' },
              { id: 'anthropic', label: 'Anthropic' },
              { id: 'gemini', label: 'Google Gemini' },
              { id: 'ollama', label: 'Ollama (Local)' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProvider(p.id as any);
                  setValidationError(null);
                }}
                className={`btn-hallmark text-xs justify-center transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                  selectedProvider === p.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                    : 'border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-muted)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Key Input Field */}
          {selectedProvider !== 'ollama' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-mono text-[var(--color-ink-muted)]">API Key ({selectedProvider.toUpperCase()})</label>
                <a
                  href={
                    selectedProvider === 'openai'
                      ? 'https://platform.openai.com/api-keys'
                      : selectedProvider === 'anthropic'
                      ? 'https://console.anthropic.com/settings/keys'
                      : 'https://aistudio.google.com/app/apikey'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
                >
                  Get API Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`sk-...`}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] font-mono text-[var(--color-ink)]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Ollama Local Server URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              />
              <p className="text-xs text-[var(--color-ink-faint)]">
                Make sure your local Ollama instance allows CORS: <code className="bg-[var(--color-paper-3)] px-1 font-mono">OLLAMA_ORIGINS="{typeof window !== 'undefined' ? window.location.origin : '*'}" ollama serve</code>
              </p>
            </div>
          )}

          {/* Optional Personal System Profile Textarea */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border-hairline)]">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)]">
              <User className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Personal System Profile (Optional)
            </div>
            <textarea
              rows={3}
              value={systemProfile}
              onChange={(e) => setSystemProfile(e.target.value)}
              placeholder="e.g. I am a founder building open source products. Include my background context when personas respond..."
              className="w-full p-2.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
            />
          </div>

          {validationError && (
            <div className="p-3 text-xs bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 rounded-[var(--radius-sm)]">
              {validationError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
            >
              Skip for Now (Read-Only Mode)
            </button>

            <button
              type="button"
              onClick={handleValidateAndSave}
              disabled={isValidating}
              className="btn-hallmark btn-hallmark-primary text-xs gap-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
            >
              {isValidating ? 'Validating Key...' : 'Validate & Save'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Ft6 Letter Close Footer */}
      <footer className="border-t border-[var(--color-border-hairline)] pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-ink-faint)] font-mono">
        <div>Council of Minds — 100% Client-Side Open Source Architecture</div>
        <div>Store it locally, proxy it statelessly, make it beautiful.</div>
      </footer>
    </div>
  );
}
