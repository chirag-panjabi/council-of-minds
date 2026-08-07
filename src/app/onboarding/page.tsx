'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ShieldCheck, ArrowRight, ExternalLink, Eye, EyeOff, User, UserCheck, CheckCircle2, Lock, Cpu, Server, ChevronLeft, Zap } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 12-letter · theme: newsprint · nav: N9 · footer: Ft6 */

export default function OnboardingPage() {
  const router = useRouter();
  const personas = useLiveQuery(() => db.personas.toArray()) || [];

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 2 & 3 State
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'ollama'>('openai');
  const [selectedDefaultModel, setSelectedDefaultModel] = useState<string>('gpt-4o');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('2cfc4b5b-ba28-5fc5-97f3-79186fc174d1');
  const [systemProfile, setSystemProfile] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [quickTestState, setQuickTestState] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    latencyMs?: number;
    message?: string;
  }>({ status: 'idle' });

  const handleQuickTestConnection = async () => {
    setQuickTestState({ status: 'testing' });
    const startTime = Date.now();

    try {
      if (selectedProvider === 'ollama') {
        const res = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);
        const latencyMs = Date.now() - startTime;
        if (!res || !res.ok) {
          throw new Error('Local server unreachable or CORS blocked.');
        }
        setQuickTestState({
          status: 'success',
          latencyMs,
          message: `Verified local connection in ${latencyMs}ms`,
        });
      } else {
        if (!apiKey.trim()) {
          throw new Error('Please enter an API key to test.');
        }
        const res = await fetch('/api/validate-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-provider': selectedProvider,
            'x-api-key': apiKey.trim(),
            'x-ollama-url': ollamaUrl,
          },
        });
        const latencyMs = Date.now() - startTime;
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          const rawErr = data.error || `Key validation failed (${res.status})`;
          const errMsg = typeof rawErr === 'object' ? (rawErr.message || JSON.stringify(rawErr)) : String(rawErr);
          throw new Error(errMsg);
        }
        setQuickTestState({
          status: 'success',
          latencyMs,
          message: `Verified (${data.modelCount || 1} models, ${latencyMs}ms echo)`,
        });
      }
    } catch (err: any) {
      setQuickTestState({
        status: 'error',
        message: typeof err?.message === 'object' ? JSON.stringify(err.message) : (err?.message || 'Connection test failed'),
      });
    }
  };

  const handleValidateAndSave = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      if (selectedProvider === 'ollama') {
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

        localStorage.setItem(`framework-engine:api-key:${selectedProvider}`, apiKey.trim());
        localStorage.setItem('framework-engine:default-provider', selectedProvider);
        localStorage.setItem('framework-engine:default-model', selectedDefaultModel || (data.modelNames?.[0] || 'gpt-4o'));
      }

      if (selectedPersonaId) {
        localStorage.setItem('framework-engine:default-persona-id', selectedPersonaId);
      }

      if (systemProfile.trim()) {
        localStorage.setItem('framework-engine:system-profile', systemProfile.trim());
      }

      localStorage.removeItem('framework-engine:has_skipped_onboarding');
      router.push('/');
    } catch (err: any) {
      setValidationError(err.message || 'Validation failed. Please check your credentials.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    if (selectedPersonaId) {
      localStorage.setItem('framework-engine:default-persona-id', selectedPersonaId);
    }
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
      <main className="max-w-2xl mx-auto my-8 space-y-6 w-full">
        {/* Multi-Step Wizard Indicator */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          {[
            { num: 1, label: 'Privacy Architecture' },
            { num: 2, label: 'Provider Setup' },
            { num: 3, label: 'Personalization' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num < currentStep || s.num === 1) setCurrentStep(s.num as any);
              }}
              className={`flex items-center gap-2 text-xs font-mono transition-colors ${
                currentStep === s.num
                  ? 'text-[var(--color-accent)] font-semibold'
                  : currentStep > s.num
                  ? 'text-[var(--color-ink)] hover:text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-faint)] cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                  currentStep === s.num
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold'
                    : currentStep > s.num
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                    : 'border-[var(--color-border)] text-[var(--color-ink-faint)]'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* STEP 1: Privacy Architecture & Local-First Guarantee */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
                <span>Step 1 of 3 • Fundamental Architecture</span>
                <span className="text-[var(--color-ink-muted)] font-normal">July 2026</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-normal text-[var(--color-ink)] leading-tight">
                Zero-Database, Local-First Privacy Guarantee.
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed font-body">
                Council of Minds is built ground-up on Bring Your Own Key (BYOK) principles. Your intellectual artifacts, personas, and conversation logs remain strictly under your control.
              </p>
            </div>

            {/* Privacy Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold font-mono text-[var(--color-ink)]">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  100% Client-Side Storage
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  All chat history, persona definitions, and rules are stored in your browser’s local IndexedDB. No backend database exists.
                </p>
              </div>

              <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold font-mono text-[var(--color-ink)]">
                  <Cpu className="w-4 h-4 text-[var(--color-accent)]" />
                  Stateless API Proxy
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  Your API keys only transit in-memory proxy headers during active calls. They are never written to disk or logged.
                </p>
              </div>

              <div className="p-4 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-md)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold font-mono text-[var(--color-ink)]">
                  <Server className="w-4 h-4 text-sky-600" />
                  Local AI Ready
                </div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  Connect Ollama, LM Studio, or LocalAI for complete air-gapped zero-cloud execution with zero internet egress.
                </p>
              </div>
            </div>

            {/* Privacy Guarantee Confirmation */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-[var(--radius-md)] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-emerald-700">Privacy Verification Standard</div>
                <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  You can audit your storage consumption, key inventory, and privacy footprint anytime in the Analytics drawer.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-hairline)]">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline focus:outline-none rounded"
              >
                Skip Onboarding (Read-Only Mode)
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn-hallmark btn-hallmark-primary text-xs gap-2 focus:outline-none"
              >
                I Understand & Agree → Setup Provider
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Provider Setup & Connection Validation */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
                <span>Step 2 of 3 • Provider Connection</span>
                <span className="text-[var(--color-ink-muted)] font-normal">BYOK Setup</span>
              </div>
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Configure Your First AI Provider</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Select your preferred model host. Your API key will be validated and saved locally in browser storage.
              </p>
            </div>

            <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-6">
              {/* Provider Selection */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {[
                  { id: 'openrouter', label: 'OpenRouter' },
                  { id: 'openai', label: 'OpenAI' },
                  { id: 'anthropic', label: 'Anthropic' },
                  { id: 'gemini', label: 'Google Gemini' },
                  { id: 'ollama', label: 'Ollama (Local)' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      const pId = p.id as any;
                      setSelectedProvider(pId);
                      setValidationError(null);
                      setQuickTestState({ status: 'idle' });
                      if (typeof window !== 'undefined' && pId !== 'ollama') {
                        setApiKey(localStorage.getItem(`framework-engine:api-key:${pId}`) || '');
                      }
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

              {/* Default Model Target Selector */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-hairline)]">
                <label className="text-xs font-mono text-[var(--color-ink-muted)] flex items-center justify-between">
                  <span>Default Model Target</span>
                  <span className="text-[10px] text-[var(--color-accent)] font-semibold uppercase">Global Fallback</span>
                </label>
                <select
                  value={selectedDefaultModel}
                  onChange={(e) => setSelectedDefaultModel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)]"
                >
                  <option value="openrouter/auto">openrouter/auto — Dynamic Router (OpenRouter)</option>
                  <option value="gpt-4o">gpt-4o — Flagship Multimodal (OpenAI)</option>
                  <option value="gpt-4o-mini">gpt-4o-mini — Fast & Cost-Effective (OpenAI)</option>
                  <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 — Deep Reasoning (Anthropic)</option>
                  <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022 — Ultra-Fast (Anthropic)</option>
                  <option value="gemini-2.5-flash">gemini-2.5-flash — High Throughput (Google)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro — Advanced Reasoning (Google)</option>
                  <option value="llama3.2">llama3.2 — Local Runtime (Ollama / LocalAI)</option>
                </select>
              </div>

              {/* Key Input Field */}
              {selectedProvider !== 'ollama' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-mono text-[var(--color-ink-muted)]">API Key ({selectedProvider.toUpperCase()})</label>
                    <a
                      href={
                        selectedProvider === 'openrouter'
                          ? 'https://openrouter.ai/keys'
                          : selectedProvider === 'openai'
                          ? 'https://platform.openai.com/api-keys'
                          : selectedProvider === 'anthropic'
                          ? 'https://console.anthropic.com/settings/keys'
                          : 'https://aistudio.google.com/app/apikey'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline focus:outline-none rounded"
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
                      className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] focus:outline-none font-mono text-[var(--color-ink)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-2.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
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
                    className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] font-mono text-[var(--color-ink)] focus:outline-none"
                  />
                  <p className="text-xs text-[var(--color-ink-faint)]">
                    Ensure Ollama is running and CORS is enabled: <code className="bg-[var(--color-paper-3)] px-1 font-mono">OLLAMA_ORIGINS="{typeof window !== 'undefined' ? window.location.origin : '*'}" ollama serve</code>
                  </p>
                </div>
              )}

              {/* Quick-Test Connection Action */}
              <div className="pt-2 border-t border-[var(--color-border-hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleQuickTestConnection}
                  disabled={quickTestState.status === 'testing' || (selectedProvider !== 'ollama' && !apiKey.trim())}
                  className="btn-hallmark text-xs gap-1.5 focus:outline-none disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  {quickTestState.status === 'testing' ? 'Testing Connection...' : 'Quick-Test Connection (1-token echo)'}
                </button>

                {quickTestState.status === 'success' && (
                  <span className="text-xs font-mono text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {quickTestState.message}
                  </span>
                )}

                {quickTestState.status === 'error' && (
                  <span className="text-xs font-mono text-[var(--color-error)] bg-[var(--color-error)]/10 px-2.5 py-1 rounded border border-[var(--color-error)]/20">
                    ✕ {quickTestState.message}
                  </span>
                )}
              </div>

              {validationError && (
                <div className="p-3 text-xs bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 rounded-[var(--radius-sm)]">
                  {validationError}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-hairline)]">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn-hallmark text-xs gap-1 focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="btn-hallmark btn-hallmark-primary text-xs gap-2 focus:outline-none"
              >
                Continue to Personalization <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Personalization & Initial Persona Setup */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
                <span>Step 3 of 3 • Personalization</span>
                <span className="text-[var(--color-ink-muted)] font-normal">Thought Partner Setup</span>
              </div>
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Choose Default Persona & System Context</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Select your primary 1-on-1 dialogue partner and add optional context about yourself.
              </p>
            </div>

            <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-6">
              {/* Default Persona Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)]">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]">
                    <UserCheck className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Choose Default Thought Partner
                  </span>
                  <span>1-on-1 Chats</span>
                </div>
                <select
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none"
                >
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.isSystem || p.id.startsWith('persona-') ? '⚡' : '🎨'} {p.name} — {p.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Personal System Profile Textarea */}
              <div className="space-y-2 pt-2 border-t border-[var(--color-border-hairline)]">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-muted)]">
                  <User className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Personal System Profile (Optional)
                </div>
                <textarea
                  rows={3}
                  value={systemProfile}
                  onChange={(e) => setSystemProfile(e.target.value)}
                  placeholder="e.g. I am a founder building open source products. Include my background context when personas respond..."
                  className="w-full p-2.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none"
                />
              </div>

              {validationError && (
                <div className="p-3 text-xs bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 rounded-[var(--radius-sm)]">
                  {validationError}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-hairline)]">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn-hallmark text-xs gap-1 focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="button"
                onClick={handleValidateAndSave}
                disabled={isValidating}
                className="btn-hallmark btn-hallmark-primary text-xs gap-2 focus:outline-none disabled:opacity-40"
              >
                {isValidating ? 'Validating & Launching...' : 'Validate & Finish Setup'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Ft6 Letter Close Footer */}
      <footer className="border-t border-[var(--color-border-hairline)] pt-4 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-ink-faint)] font-mono">
        <div>Council of Minds — 100% Client-Side Open Source Architecture</div>
        <div>Store it locally, proxy it statelessly, make it beautiful.</div>
      </footer>
    </div>
  );
}
