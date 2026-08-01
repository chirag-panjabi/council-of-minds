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

    // Check if onboarding was skipped or completed
    const hasSkipped = localStorage.getItem('framework-engine:has_skipped_onboarding') === 'true';
    const hasCompleted = localStorage.getItem('framework-engine:has_completed_onboarding') === 'true';

    // Check if any provider key is saved across all naming conventions
    const hasOpenAI = Boolean(
      localStorage.getItem('framework-engine:api-key:openai') ||
      localStorage.getItem('framework-engine:openai-key')
    );
    const hasAnthropic = Boolean(
      localStorage.getItem('framework-engine:api-key:anthropic') ||
      localStorage.getItem('framework-engine:anthropic-key')
    );
    const hasGemini = Boolean(
      localStorage.getItem('framework-engine:api-key:gemini') ||
      localStorage.getItem('framework-engine:gemini-key')
    );
    const hasOpenRouter = Boolean(
      localStorage.getItem('framework-engine:openrouter-key')
    );
    const hasOllama = Boolean(
      localStorage.getItem('framework-engine:ollama-enabled') === 'true'
    );

    const isConfigured = hasOpenAI || hasAnthropic || hasGemini || hasOpenRouter || hasOllama;

    // Public pages that bypass onboarding redirect
    const isPublicPage = pathname === '/onboarding' || pathname === '/privacy';

    // If not configured, not skipped, and not completed, redirect unconfigured session to /onboarding
    if (!isConfigured && !hasSkipped && !hasCompleted && !isPublicPage) {
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
