"use client";

import * as React from 'react';

import { validateCloudProvider, type CloudValidationResult } from '@/lib/providers/cloud-validation';
import {
  DEFAULT_OLLAMA_BASE_URL,
  testOllamaConnection,
  type OllamaConnectionResult,
  type OllamaModel,
} from '@/lib/providers/ollama';
import type { ProviderId } from '@/lib/schemas/provider';
import { settingsStore } from '@/lib/storage/settings';

type CloudProviderId = Exclude<ProviderId, 'ollama'>;
type ProviderChoice = CloudProviderId | 'ollama';

interface ProviderSetupFormProps {
  onConfigured?: () => void;
}

const cloudProviders: Array<{ id: CloudProviderId; name: string }> = [
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'gemini', name: 'Google Gemini' },
];

function cloudError(result: CloudValidationResult): string {
  switch (result.status) {
    case 'invalid_key':
      return 'The provider rejected this key. Check it and try again.';
    case 'quota_exceeded':
      return 'The provider reported a quota or rate-limit issue. Try again later or check the provider account.';
    case 'connectivity_error':
      return 'The validation request could not reach the provider. Check your connection and try again.';
    case 'provider_error':
      return 'The provider could not validate this key right now. Try again later.';
    case 'valid':
      return '';
  }
}

function ollamaError(result: Exclude<OllamaConnectionResult, { status: 'connected' }>): string {
  switch (result.status) {
    case 'invalid_url':
      return 'Use localhost, 127.0.0.1, or [::1] with the Ollama /api path.';
    case 'cors_blocked':
      return 'The browser blocked Ollama. Allow this application origin in OLLAMA_ORIGINS, restart Ollama, and try again.';
    case 'unavailable':
      return 'Ollama is unavailable. Start the local server and try again.';
    case 'no_models':
      return 'Ollama is running, but no installed models were found.';
    case 'invalid_response':
      return 'Ollama returned an unexpected model list. Update or restart the local server and try again.';
    case 'connection_blocked':
      return 'The browser could not reach Ollama. Confirm it is running and allows this application origin.';
  }
}

export function ProviderSetupForm({ onConfigured }: ProviderSetupFormProps) {
  const [provider, setProvider] = React.useState<ProviderChoice>('openai');
  const [apiKey, setApiKey] = React.useState('');
  const [showKey, setShowKey] = React.useState(false);
  const [savedKey, setSavedKey] = React.useState(false);
  const [replaceKey, setReplaceKey] = React.useState(false);
  const [cloudStatus, setCloudStatus] = React.useState<CloudValidationResult | null>(null);
  const [ollamaUrl, setOllamaUrl] = React.useState(DEFAULT_OLLAMA_BASE_URL);
  const [ollamaModels, setOllamaModels] = React.useState<OllamaModel[]>([]);
  const [selectedModelId, setSelectedModelId] = React.useState('');
  const [ollamaStatus, setOllamaStatus] = React.useState<OllamaConnectionResult | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  const isCloudProvider = provider !== 'ollama';

  React.useEffect(() => {
    if (!isCloudProvider) {
      const ollama = settingsStore.getPreferences().ollama;
      if (ollama) {
        setOllamaUrl(ollama.baseUrl);
        setOllamaModels(ollama.modelIds.map((name) => ({ name, model: name })));
        setSelectedModelId(ollama.selectedModelId ?? ollama.modelIds[0] ?? '');
      }
      return;
    }

    setSavedKey(Boolean(settingsStore.getApiKeys()[provider]));
    setReplaceKey(false);
    setApiKey('');
    setShowKey(false);
    setCloudStatus(null);
  }, [isCloudProvider, provider]);

  async function validateCloudKey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isCloudProvider || !apiKey.trim()) {
      setCloudStatus({ status: 'invalid_key', retryable: false });
      return;
    }

    setIsValidating(true);
    setCloudStatus(null);
    const result = await validateCloudProvider(provider, apiKey);
    setIsValidating(false);
    setCloudStatus(result);

    if (result.status === 'valid') {
      const existingKeys = settingsStore.getApiKeys();
      settingsStore.setApiKeys({ ...existingKeys, [provider]: apiKey });
      settingsStore.setOnboarding({ hasCompletedSetup: true, hasSkippedSetup: false });
      setSavedKey(true);
      setReplaceKey(false);
      setApiKey('');
      setShowKey(false);
      onConfigured?.();
    }
  }

  async function validateOllama(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsValidating(true);
    setOllamaStatus(null);
    const result = await testOllamaConnection(ollamaUrl);
    setIsValidating(false);
    setOllamaStatus(result);

    if (result.status === 'connected') {
      const models = result.models;
      const modelIds = models.map((model) => model.model);
      const selectedModel = modelIds.includes(selectedModelId) ? selectedModelId : modelIds[0];
      const preferences = settingsStore.getPreferences();
      settingsStore.setPreferences({
        ...preferences,
        ollama: {
          enabled: true,
          baseUrl: result.baseUrl,
          modelIds,
          selectedModelId: selectedModel,
        },
      });
      settingsStore.setOnboarding({ hasCompletedSetup: true, hasSkippedSetup: false });
      setOllamaModels(models);
      setSelectedModelId(selectedModel);
      onConfigured?.();
    }
  }

  function saveSelectedOllamaModel(nextModelId: string) {
    setSelectedModelId(nextModelId);
    const preferences = settingsStore.getPreferences();
    if (!preferences.ollama) {
      return;
    }

    settingsStore.setPreferences({
      ...preferences,
      ollama: { ...preferences.ollama, selectedModelId: nextModelId },
    });
  }

  return (
    <section aria-labelledby="provider-setup-title" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm">
      <div>
        <h2 id="provider-setup-title" className="text-xl font-semibold">Connect a provider</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure one provider to enable generation. You can still browse local data without one.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-medium">Provider</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...cloudProviders, { id: 'ollama' as const, name: 'Ollama (local)' }].map((choice) => (
            <label key={choice.id} className="flex cursor-pointer items-center gap-2 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="radio"
                name="provider"
                value={choice.id}
                checked={provider === choice.id}
                onChange={() => setProvider(choice.id)}
              />
              <span>{choice.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {isCloudProvider ? (
        <form className="space-y-4" onSubmit={validateCloudKey} noValidate>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Your key is stored in this browser under the Framework Engine namespace. Validation and future cloud requests transit this app&apos;s stateless proxy and then {cloudProviders.find((item) => item.id === provider)?.name}; neither is stored by the proxy.
          </p>

          {savedKey && !replaceKey ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
              <p className="text-sm">A key is saved for {cloudProviders.find((item) => item.id === provider)?.name}. Saved keys cannot be revealed or exported.</p>
              <button type="button" className="rounded-md border px-3 py-2 text-sm font-medium" onClick={() => setReplaceKey(true)}>
                Replace key
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="provider-api-key" className="font-medium">API key</label>
              <div className="flex gap-2">
                <input
                  id="provider-api-key"
                  name="provider-api-key"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  onBlur={() => setShowKey(false)}
                  aria-invalid={cloudStatus?.status === 'invalid_key'}
                  aria-describedby={cloudStatus?.status !== 'valid' && cloudStatus ? 'provider-key-status' : undefined}
                  className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2"
                  required
                />
                <button
                  type="button"
                  className="rounded-md border px-3 py-2 text-sm font-medium"
                  aria-label={showKey ? 'Hide API key' : 'Show API key temporarily'}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => setShowKey((current) => !current)}
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isValidating || (savedKey && !replaceKey)}
          >
            {isValidating ? 'Validating…' : 'Validate and save'}
          </button>

          {cloudStatus && (
            <p id="provider-key-status" role={cloudStatus.status === 'valid' ? 'status' : 'alert'} className="text-sm">
              {cloudStatus.status === 'valid' ? 'Key validated and saved in this browser.' : cloudError(cloudStatus)}
            </p>
          )}
        </form>
      ) : (
        <form className="space-y-4" onSubmit={validateOllama} noValidate>
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Ollama uses a direct browser-to-loopback connection. It does not use the cloud proxy. Your local server must allow this app&apos;s origin through CORS.
          </p>
          <div className="space-y-2">
            <label htmlFor="ollama-url" className="font-medium">Ollama loopback URL</label>
            <input
              id="ollama-url"
              type="url"
              value={ollamaUrl}
              onChange={(event) => setOllamaUrl(event.target.value)}
              aria-invalid={ollamaStatus?.status === 'invalid_url'}
              aria-describedby={ollamaStatus?.status !== 'connected' && ollamaStatus ? 'ollama-status' : undefined}
              className="w-full rounded-md border bg-background px-3 py-2"
              required
            />
          </div>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60" disabled={isValidating}>
            {isValidating ? 'Testing…' : 'Test connection'}
          </button>

          {ollamaModels.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="ollama-model" className="font-medium">Installed model</label>
              <select
                id="ollama-model"
                value={selectedModelId}
                onChange={(event) => saveSelectedOllamaModel(event.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                {ollamaModels.map((model) => <option key={model.model} value={model.model}>{model.name}</option>)}
              </select>
            </div>
          )}

          {ollamaStatus && (
            <p id="ollama-status" role={ollamaStatus.status === 'connected' ? 'status' : 'alert'} className="text-sm">
              {ollamaStatus.status === 'connected'
                ? `Connected directly to Ollama. ${ollamaStatus.models.length} installed model${ollamaStatus.models.length === 1 ? '' : 's'} found.`
                : ollamaError(ollamaStatus)}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
