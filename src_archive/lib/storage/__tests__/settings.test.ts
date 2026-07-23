import { describe, it, expect, beforeEach } from 'vitest';
import { settingsStore } from '../settings';

describe('SettingsStore', () => {
  beforeEach(() => {
    // Clear the localStorage before each test
    window.localStorage.clear();
  });

  it('should use the framework-engine: prefix for keys', () => {
    settingsStore.setPreferences({ theme: 'dark', density: 'compact', typography: 'base' });
    
    // Check that it's actually in localStorage under the correct key
    const raw = window.localStorage.getItem('framework-engine:preferences');
    expect(raw).toBeDefined();
    
    const parsed = JSON.parse(raw!);
    expect(parsed.theme).toBe('dark');
    expect(parsed.density).toBe('compact');
  });

  it('should return default preferences if none exist', () => {
    const prefs = settingsStore.getPreferences();
    expect(prefs).toEqual({ theme: 'system', density: 'comfortable', typography: 'base' });
  });

  it('should return default preferences if corrupted data exists', () => {
    window.localStorage.setItem('framework-engine:preferences', 'invalid-json');
    const prefs = settingsStore.getPreferences();
    expect(prefs).toEqual({ theme: 'system', density: 'comfortable', typography: 'base' });
  });

  it('should save and retrieve api keys safely', () => {
    settingsStore.setApiKeys({ openai: 'sk-1234' });
    const keys = settingsStore.getApiKeys();
    expect(keys).toEqual({ openai: 'sk-1234' });
    
    settingsStore.deleteApiKeys();
    expect(settingsStore.getApiKeys()).toEqual({});
  });

  it('should save and retrieve onboarding state safely', () => {
    expect(settingsStore.getOnboarding().hasCompletedSetup).toBe(false);

    settingsStore.setOnboarding({ hasCompletedSetup: true });
    expect(settingsStore.getOnboarding().hasCompletedSetup).toBe(true);

    settingsStore.deleteOnboarding();
    expect(settingsStore.getOnboarding().hasCompletedSetup).toBe(false);
  });

  it('should save and retrieve drafts safely', () => {
    settingsStore.setDrafts({ session1: 'Hello world' });
    const drafts = settingsStore.getDrafts();
    expect(drafts).toEqual({ session1: 'Hello world' });

    settingsStore.deleteDrafts();
    expect(settingsStore.getDrafts()).toEqual({});
  });

  it('should expose a clearAll method that deletes only its specific keys', () => {
    window.localStorage.setItem('unrelated-key', 'data');
    window.localStorage.setItem('framework-engine:future-feature', 'test-data');
    settingsStore.setApiKeys({ openai: 'sk-123' });
    
    // Wipe all scoped keys
    settingsStore.clearAll();

    expect(window.localStorage.getItem('unrelated-key')).toBe('data');
    expect(window.localStorage.getItem('framework-engine:api-keys')).toBeNull();
    expect(window.localStorage.getItem('framework-engine:future-feature')).toBeNull();
  });
});
