"use client";

import { ProviderSetupForm } from '@/components/providers/ProviderSetupForm';
import { SummarizationSettings } from '@/components/settings/SummarizationSettings';
import { DataManagementSettings } from '@/components/settings/DataManagementSettings';
import { DefaultModelSettings } from '@/components/settings/DefaultModelSettings';
import { PersonalProfileSettings } from '@/components/settings/PersonalProfileSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { AboutSettings } from '@/components/settings/AboutSettings';

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-3xl space-y-6 py-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Settings</p>
        <h1 className="text-3xl font-bold tracking-tight">Providers and privacy</h1>
        <p className="text-muted-foreground">Manage provider credentials and your direct local Ollama connection. Saved cloud keys remain masked and are not exportable.</p>
      </header>
      <ProviderSetupForm />
      <DefaultModelSettings />
      <PersonalProfileSettings />
      <SummarizationSettings />
      <AppearanceSettings />
      <DataManagementSettings />
      <AboutSettings />
    </section>
  );
}
