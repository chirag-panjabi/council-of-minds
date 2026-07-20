"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ProviderSetupForm } from '@/components/providers/ProviderSetupForm';
import { settingsStore } from '@/lib/storage/settings';

export default function OnboardingPage() {
  const router = useRouter();

  function skipSetup() {
    settingsStore.setOnboarding({ hasCompletedSetup: false, hasSkippedSetup: true });
    router.replace('/');
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6 py-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">First-time setup</p>
        <h1 className="text-3xl font-bold tracking-tight">Choose how Framework Engine reaches a model</h1>
        <p className="text-muted-foreground">
          Cloud requests transit this app&apos;s stateless proxy and the selected provider. Ollama requests go directly from this browser to your configured localhost endpoint.
        </p>
        <p className="text-sm text-muted-foreground">
          Read the <a className="underline underline-offset-4" href="https://github.com/chirag-panjabi/council-of-minds/blob/main/docs/PRIVACY_AND_SAFETY.md" target="_blank" rel="noreferrer">Privacy, Security, and Safety contract</a> before continuing.
        </p>
      </header>

      <ProviderSetupForm onConfigured={() => router.replace('/')} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Skip for now to explore non-generation screens. You can configure a provider later.</p>
        <button type="button" className="rounded-md border px-3 py-2 text-sm font-medium" onClick={skipSetup}>
          Skip setup
        </button>
      </div>

      <Link href="/" className="text-sm underline underline-offset-4">Return to the workspace</Link>
    </section>
  );
}
