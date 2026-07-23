import type { ApiKeys, Preferences } from '../schemas/settings';

/** Returns whether any provider can be used for generation after client hydration. */
export function hasConfiguredProvider(apiKeys: ApiKeys, preferences: Preferences): boolean {
  const hasCloudKey = Object.values(apiKeys).some((apiKey) => apiKey.trim().length > 0);
  const hasOllamaModel = Boolean(
    preferences.ollama?.enabled &&
    preferences.ollama.selectedModelId &&
    preferences.ollama.modelIds.includes(preferences.ollama.selectedModelId),
  );

  return hasCloudKey || hasOllamaModel;
}
