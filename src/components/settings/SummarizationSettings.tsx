"use client";

import * as React from 'react';
import { settingsStore } from '@/lib/storage/settings';
import type { ProviderId } from '@/lib/schemas/provider';

const providers = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'ollama', name: 'Ollama (local)' },
];

export function SummarizationSettings() {
  const [enabled, setEnabled] = React.useState(false);
  const [providerId, setProviderId] = React.useState<ProviderId>('openai');
  const [modelId, setModelId] = React.useState('');

  React.useEffect(() => {
    const prefs = settingsStore.getPreferences();
    if (prefs.summarization) {
      setEnabled(prefs.summarization.enabled);
      setProviderId((prefs.summarization.providerId as ProviderId) || 'openai');
      setModelId(prefs.summarization.modelId || '');
    }
  }, []);

  const saveSettings = (newEnabled: boolean, newProvider: ProviderId, newModel: string) => {
    const prefs = settingsStore.getPreferences();
    settingsStore.setPreferences({
      ...prefs,
      summarization: {
        enabled: newEnabled,
        providerId: newProvider,
        modelId: newModel,
      },
    });
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setEnabled(isChecked);
    saveSettings(isChecked, providerId, modelId);
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ProviderId;
    setProviderId(newProvider);
    saveSettings(enabled, newProvider, modelId);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newModel = e.target.value;
    setModelId(newModel);
    saveSettings(enabled, providerId, newModel);
  };

  return (
    <section aria-labelledby="summarization-setup-title" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm mt-6">
      <div>
        <h2 id="summarization-setup-title" className="text-xl font-semibold">Background Summarization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Automatically condense long conversations into summaries. This reduces token usage for very long sessions.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="enable-summarization"
          checked={enabled}
          onChange={handleToggle}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="enable-summarization" className="font-medium cursor-pointer">
          Enable background summarization
        </label>
      </div>

      {enabled && (
        <div className="space-y-4 rounded-md border p-4 bg-muted/30">
          <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
            <strong>Data egress disclosure:</strong> By enabling summarization, your older messages will be periodically transmitted to the selected provider to generate a condensed summary.
          </p>

          <div className="space-y-2">
            <label htmlFor="summarization-provider" className="block text-sm font-medium">Provider</label>
            <select
              id="summarization-provider"
              value={providerId}
              onChange={handleProviderChange}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="summarization-model" className="block text-sm font-medium">Model ID</label>
            <input
              id="summarization-model"
              type="text"
              value={modelId}
              onChange={handleModelChange}
              placeholder="e.g. gpt-4o-mini, claude-3-haiku-20240307"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              We recommend using a fast, inexpensive model for summarization.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
