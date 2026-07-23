"use client";

import * as React from 'react';
import { settingsStore } from '@/lib/storage/settings';

export function AppearanceSettings() {
  const [theme, setTheme] = React.useState('system');
  const [density, setDensity] = React.useState('comfortable');
  const [typography, setTypography] = React.useState('base');

  React.useEffect(() => {
    const prefs = settingsStore.getPreferences();
    setTheme(prefs.theme || 'system');
    setDensity(prefs.density || 'comfortable');
    setTypography(prefs.typography || 'base');
  }, []);

  const saveSettings = (newTheme: string, newDensity: string, newTypography: string) => {
    const prefs = settingsStore.getPreferences();
    settingsStore.setPreferences({
      ...prefs,
      theme: newTheme as any,
      density: newDensity as any,
      typography: newTypography as any,
    });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
    saveSettings(e.target.value, density, typography);
  };

  const handleDensityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDensity(e.target.value);
    saveSettings(theme, e.target.value, typography);
  };

  const handleTypographyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypography(e.target.value);
    saveSettings(theme, density, e.target.value);
  };

  return (
    <section aria-labelledby="appearance-setup-title" className="space-y-6 rounded-xl border bg-card p-5 shadow-sm mt-6">
      <div>
        <h2 id="appearance-setup-title" className="text-xl font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the look and feel of the application.
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="theme" className="text-sm font-medium">Theme</label>
          <select
            id="theme"
            value={theme}
            onChange={handleThemeChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="system">System Default</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label htmlFor="density" className="text-sm font-medium">Density</label>
          <select
            id="density"
            value={density}
            onChange={handleDensityChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label htmlFor="typography" className="text-sm font-medium">Typography</label>
          <select
            id="typography"
            value={typography}
            onChange={handleTypographyChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="sm">Small</option>
            <option value="base">Base</option>
            <option value="lg">Large</option>
          </select>
        </div>
      </div>
    </section>
  );
}
