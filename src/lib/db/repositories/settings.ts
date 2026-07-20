export interface GlobalSettings {
  defaultWordLimit?: number;
}

const SETTINGS_KEY = 'council_of_minds_global_settings';

class SettingsRepository {
  getSettings(): GlobalSettings {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse global settings', e);
    }
    return {};
  }

  saveSettings(settings: GlobalSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save global settings', e);
    }
  }

  updateSettings(updates: Partial<GlobalSettings>): GlobalSettings {
    const current = this.getSettings();
    const next = { ...current, ...updates };
    this.saveSettings(next);
    return next;
  }
}

export const settingsRepository = new SettingsRepository();
