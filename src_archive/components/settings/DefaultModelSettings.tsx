"use client";

import * as React from 'react';
import { settingsStore } from '@/lib/storage/settings';
import { ProviderModelSelector } from '@/components/providers/ProviderModelSelector';

export function DefaultModelSettings() {
  const [providerId, setProviderId] = React.useState('');
  const [modelId, setModelId] = React.useState('');
  const [wordLimit, setWordLimit] = React.useState<number | ''>('');

  React.useEffect(() => {
    const prefs = settingsStore.getPreferences();
    if (prefs.defaultProviderId) setProviderId(prefs.defaultProviderId);
    if (prefs.defaultModelId) setModelId(prefs.defaultModelId);
    if (prefs.defaultWordLimit) setWordLimit(prefs.defaultWordLimit);
  }, []);

  const handleProviderChange = (newProviderId: string) => {
    setProviderId(newProviderId);
    if (!newProviderId) {
      saveSettings('', '', wordLimit);
    }
  };

  const handleModelChange = (newModelId: string) => {
    setModelId(newModelId);
    saveSettings(providerId, newModelId, wordLimit);
  };

  const handleWordLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = val === '' ? '' : parseInt(val, 10);
    setWordLimit(num);
    saveSettings(providerId, modelId, num);
  };

  const saveSettings = (newProvider: string, newModel: string, limit: number | '') => {
    const prefs = settingsStore.getPreferences();
    settingsStore.setPreferences({
      ...prefs,
      defaultProviderId: newProvider,
      defaultModelId: newModel,
      defaultWordLimit: limit === '' ? undefined : limit,
    });
  };

  return (
    <section aria-labelledby="default-model-setup-title" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm mt-6">
      <div>
        <h2 id="default-model-setup-title" className="text-xl font-semibold">Default Chat Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the default provider, model, and word limit to use when starting a new 1-on-1 chat or Council session.
        </p>
      </div>

      <div className="space-y-4 rounded-md border p-4 bg-muted/30 max-w-xl">
        <ProviderModelSelector 
          providerId={providerId}
          modelId={modelId}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
        />
        <div className="pt-2">
          <label htmlFor="default-word-limit" className="block text-sm font-medium mb-1">
            Default Word Limit (Optional)
          </label>
          <input
            id="default-word-limit"
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={wordLimit}
            onChange={handleWordLimitChange}
            className="w-full max-w-[200px] p-2 border rounded-md text-sm bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            If set, models will be instructed to keep their responses under this limit.
          </p>
        </div>
      </div>
    </section>
  );
}
