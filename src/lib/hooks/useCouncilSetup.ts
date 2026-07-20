import { useState, useCallback, useEffect } from 'react';
import { LocalPersona } from '../schemas/persona';
import { settingsStore } from '../storage/settings';

export interface SetupParticipant {
  persona: LocalPersona;
  providerId?: string;
  modelId?: string;
}

export function useCouncilSetup() {
  const [debaters, setDebaters] = useState<SetupParticipant[]>([]);
  const [synthesizer, setSynthesizer] = useState<SetupParticipant | null>(null);
  const [turnCap, setTurnCap] = useState<number>(6);

  const [defaultProviderId, setDefaultProviderId] = useState<string | undefined>();
  const [defaultModelId, setDefaultModelId] = useState<string | undefined>();

  useEffect(() => {
    const prefs = settingsStore.getPreferences();
    setDefaultProviderId(prefs.defaultProviderId);
    setDefaultModelId(prefs.defaultModelId);
  }, []);


  const addDebater = useCallback((persona: LocalPersona) => {
    setDebaters((prev) => {
      if (prev.find((d) => d.persona.id === persona.id)) return prev;
      return [...prev, { persona, providerId: defaultProviderId, modelId: defaultModelId }];
    });
  }, [defaultProviderId, defaultModelId]);

  const removeDebater = useCallback((personaId: string) => {
    setDebaters((prev) => prev.filter((d) => d.persona.id !== personaId));
  }, []);

  const moveDebater = useCallback((personaId: string, direction: 'earlier' | 'later') => {
    setDebaters((prev) => {
      const idx = prev.findIndex((d) => d.persona.id === personaId);
      if (idx === -1) return prev;
      if (direction === 'earlier' && idx > 0) {
        const next = [...prev];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        return next;
      }
      if (direction === 'later' && idx < prev.length - 1) {
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        return next;
      }
      return prev;
    });
  }, []);

  const updateDebaterModel = useCallback((personaId: string, providerId: string, modelId: string) => {
    setDebaters((prev) =>
      prev.map((d) =>
        d.persona.id === personaId ? { ...d, providerId, modelId } : d
      )
    );
  }, []);

  const updateSynthesizerModel = useCallback((providerId: string, modelId: string) => {
    setSynthesizer((prev) => (prev ? { ...prev, providerId, modelId } : null));
  }, []);

  const setSynthesizerPersona = useCallback((persona: LocalPersona | null) => {
    setSynthesizer(persona ? { persona, providerId: defaultProviderId, modelId: defaultModelId } : null);
  }, [defaultProviderId, defaultModelId]);

  return {
    debaters,
    synthesizer,
    turnCap,
    setTurnCap,
    addDebater,
    removeDebater,
    moveDebater,
    updateDebaterModel,
    setSynthesizerPersona,
    updateSynthesizerModel,

  };
}
