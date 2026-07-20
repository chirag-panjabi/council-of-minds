import { type ZodSchema } from 'zod';
import {
  ApiKeysSchema,
  PreferencesSchema,
  OnboardingSchema,
  DraftsSchema,
  type ApiKeys,
  type Preferences,
  type Onboarding,
  type Drafts,
} from '../schemas';

const PREFIX = 'framework-engine:';

const KEYS = {
  API_KEYS: 'api-keys',
  PREFERENCES: 'preferences',
  ONBOARDING: 'onboarding',
  DRAFTS: 'drafts',
} as const;

export class SettingsStore {
  private getStorage(): Storage | null {
    if (typeof window !== 'undefined') {
      try {
        if (window.localStorage) {
          // Accessing window.localStorage can throw a SecurityError if blocked
          return window.localStorage;
        }
      } catch (error) {
        // Fallback gracefully if localStorage is disabled or throws
        console.warn('LocalStorage is not accessible (storage may be disabled):', error);
      }
    }
    return null;
  }

  private getKey(key: string): string {
    return `${PREFIX}${key}`;
  }

  private getItem<T>(key: string, schema: ZodSchema<T>, defaultValue: T): T {
    const storage = this.getStorage();
    if (!storage) return defaultValue;

    const item = storage.getItem(this.getKey(key));
    if (!item) return defaultValue;

    try {
      const parsed = JSON.parse(item);
      const result = schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    const storage = this.getStorage();
    if (!storage) return;

    storage.setItem(this.getKey(key), JSON.stringify(value));
  }

  private removeItem(key: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(this.getKey(key));
  }

  // API Keys
  getApiKeys(): ApiKeys {
    return this.getItem<ApiKeys>(KEYS.API_KEYS, ApiKeysSchema, {});
  }

  setApiKeys(apiKeys: ApiKeys): void {
    this.setItem(KEYS.API_KEYS, apiKeys);
  }

  deleteApiKeys(): void {
    this.removeItem(KEYS.API_KEYS);
  }

  // Preferences
  getPreferences(): Preferences {
    return this.getItem<Preferences>(KEYS.PREFERENCES, PreferencesSchema, {
      theme: 'system',
      density: 'comfortable',
      typography: 'base',
    });
  }

  setPreferences(preferences: Preferences): void {
    this.setItem(KEYS.PREFERENCES, preferences);
  }

  deletePreferences(): void {
    this.removeItem(KEYS.PREFERENCES);
  }

  // Onboarding
  getOnboarding(): Onboarding {
    return this.getItem<Onboarding>(KEYS.ONBOARDING, OnboardingSchema, {
      hasCompletedSetup: false,
    });
  }

  setOnboarding(onboarding: Onboarding): void {
    this.setItem(KEYS.ONBOARDING, onboarding);
  }

  deleteOnboarding(): void {
    this.removeItem(KEYS.ONBOARDING);
  }

  // Drafts
  getDrafts(): Drafts {
    return this.getItem<Drafts>(KEYS.DRAFTS, DraftsSchema, {});
  }

  setDrafts(drafts: Drafts): void {
    this.setItem(KEYS.DRAFTS, drafts);
  }

  deleteDrafts(): void {
    this.removeItem(KEYS.DRAFTS);
  }

  // Wipe All
  clearAll(): void {
    const storage = this.getStorage();
    if (!storage) return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  }
}

export const settingsStore = new SettingsStore();
