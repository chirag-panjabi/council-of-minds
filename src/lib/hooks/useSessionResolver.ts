import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { sessionRepository } from '../db/repositories/session';
import type { Session, SessionMode } from '../schemas/session';

export function useSessionResolver(sessionId: string, expectedMode: SessionMode) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const data = await sessionRepository.get(sessionId);
        if (!isMounted) return;

        if (!data || data.mode !== expectedMode) {
          setIsNotFound(true);
        } else {
          setSession(data);
        }
      } catch (error) {
        if (isMounted) {
          setIsNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId, expectedMode]);

  if (isNotFound) {
    notFound();
  }

  return { session, isLoading };
}
