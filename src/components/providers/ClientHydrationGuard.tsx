'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function ClientHydrationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    if (typeof window === 'undefined') return;

    // Check if onboarding was skipped
    const hasSkipped = localStorage.getItem('framework-engine:has_skipped_onboarding') === 'true';

    // Check if any provider key is saved
    const hasOpenAI = Boolean(localStorage.getItem('framework-engine:api-key:openai'));
    const hasAnthropic = Boolean(localStorage.getItem('framework-engine:api-key:anthropic'));
    const hasGemini = Boolean(localStorage.getItem('framework-engine:api-key:gemini'));
    const hasOllama = Boolean(localStorage.getItem('framework-engine:ollama-enabled') === 'true');

    const isConfigured = hasOpenAI || hasAnthropic || hasGemini || hasOllama;

    // If not configured and onboarding not skipped, redirect unconfigured session to /onboarding
    if (!isConfigured && !hasSkipped && pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [pathname, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink-muted)] font-mono text-sm">
        <span>Initializing local engine environment...</span>
      </div>
    );
  }

  return <>{children}</>;
}
