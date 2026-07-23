"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { hasConfiguredProvider } from '@/lib/providers/setup';
import { settingsStore } from '@/lib/storage/settings';
import { sessionRepository } from '@/lib/db/repositories/session';
import { MessageSquare, Users, BookOpen } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [checkedSetup, setCheckedSetup] = React.useState(false);
  const [hasProvider, setHasProvider] = React.useState(false);

  React.useEffect(() => {
    const onboarding = settingsStore.getOnboarding();
    const configured = hasConfiguredProvider(
      settingsStore.getApiKeys(),
      settingsStore.getPreferences(),
    );

    if (!configured && !onboarding.hasSkippedSetup) {
      router.replace('/onboarding');
      return;
    }

    setHasProvider(configured);
    setCheckedSetup(true);
  }, [router]);

  const recentSessions = useLiveQuery(() => sessionRepository.getDurableActiveSessions(), [], []);
  const topRecent = recentSessions.slice(0, 4);

  return (
    <div className="flex h-full flex-col gap-8 pb-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Think with a council of perspectives.</h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Your conversations and personas stay in your browser. Configure a provider when you&apos;re ready to generate.
          </p>
        </div>

        {checkedSetup && !hasProvider && (
          <aside aria-labelledby="setup-required-title" className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <h2 id="setup-required-title" className="font-semibold">Provider setup required for generation</h2>
            <p className="mt-1 text-sm text-muted-foreground">You can explore the workspace, but generation stays unavailable until a provider is configured.</p>
            <Link href="/settings" className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Open provider settings
            </Link>
          </aside>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/chat/1-on-1"
            className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group"
          >
            <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mt-2">Start 1-on-1</h3>
            <p className="text-sm text-muted-foreground">Chat with a single specialized persona.</p>
          </Link>

          <Link 
            href="/chat/council"
            className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm hover:border-secondary/50 transition-colors group"
          >
            <div className="rounded-full bg-secondary/10 w-12 h-12 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mt-2">Start Council</h3>
            <p className="text-sm text-muted-foreground">Synthesize perspectives from multiple personas.</p>
          </Link>

          <Link 
            href="/personas"
            className="flex flex-col gap-2 rounded-xl border bg-card p-6 shadow-sm hover:border-muted-foreground/50 transition-colors group"
          >
            <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mt-2">Persona Library</h3>
            <p className="text-sm text-muted-foreground">Browse and edit your local personas.</p>
          </Link>
        </div>

        {/* Recent Sessions */}
        {topRecent.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Recent Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topRecent.map(session => (
                <Link
                  key={session.id}
                  href={`/chat/${session.mode}/${session.id}`}
                  className="flex flex-col gap-1 rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {session.mode === 'council' ? (
                      <Users className="h-4 w-4 text-secondary" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {session.mode}
                    </span>
                  </div>
                  <h3 className="font-medium truncate">{session.title || 'Untitled Session'}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
