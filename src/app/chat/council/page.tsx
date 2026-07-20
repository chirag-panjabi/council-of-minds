'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCouncilSetup } from '../../../lib/hooks/useCouncilSetup';
import { RosterQueueItem } from '../../../components/council/RosterQueueItem';
import { PersonaSelector } from '../../../components/personas/PersonaSelector';
import { personaRepository } from '../../../lib/db/repositories/persona';
import { sessionRepository } from '../../../lib/db/repositories/session';
import { messageRepository } from '../../../lib/db/repositories/message';
import { generateId } from '../../../lib/utils/uuid';
import { LocalPersona } from '../../../lib/schemas';
import { ParticipantSnapshot } from '../../../lib/schemas/session';

export default function CouncilSetupPage() {
  const router = useRouter();
  const setup = useCouncilSetup();
  const [availablePersonas, setAvailablePersonas] = useState<LocalPersona[]>([]);
  const [isDebaterSelectorOpen, setIsDebaterSelectorOpen] = useState(false);
  const [isSynthesizerSelectorOpen, setIsSynthesizerSelectorOpen] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [title, setTitle] = useState('New Council Session');

  useEffect(() => {
    personaRepository.getAll().then((personas) => setAvailablePersonas(personas));
  }, []);

  const handleStartCouncil = async () => {
    if (setup.debaters.length < 2) return;

    const participants: ParticipantSnapshot[] = setup.debaters.map((d) => ({
      personaId: d.persona.id,
      name: d.persona.name,
      description: d.persona.description,
      instructions: d.persona.instructions,
      avatar: d.persona.avatar,
      providerId: d.providerId,
      modelId: d.modelId,
      role: 'debater',
      wordLimit: d.persona.defaultWordLimit,
    }));

    if (setup.synthesizer) {
      participants.push({
        personaId: setup.synthesizer.persona.id,
        name: setup.synthesizer.persona.name,
        description: setup.synthesizer.persona.description,
        instructions: setup.synthesizer.persona.instructions,
        avatar: setup.synthesizer.persona.avatar,
        providerId: setup.synthesizer.providerId,
        modelId: setup.synthesizer.modelId,
        role: 'synthesizer',
        wordLimit: setup.synthesizer.persona.defaultWordLimit,
      });
    }

    const session = await sessionRepository.createSession(
      'council',
      participants,
      title,
      isIncognito,
      setup.turnCap
    );


    router.push(`/chat/council/${session.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Council Setup</h1>

      <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
        <h2 className="text-xl font-semibold">Session Details</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Session Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="incognito"
            checked={isIncognito}
            onChange={(e) => setIsIncognito(e.target.checked)}
          />
          <label htmlFor="incognito" className="text-sm">Incognito Mode</label>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Debaters</h2>
        <div className="space-y-2">
          {setup.debaters.map((d, i) => (
            <RosterQueueItem
              key={d.persona.id}
              participant={d}
              isFirst={i === 0}
              isLast={i === setup.debaters.length - 1}
              onMoveEarlier={() => setup.moveDebater(d.persona.id, 'earlier')}
              onMoveLater={() => setup.moveDebater(d.persona.id, 'later')}
              onRemove={() => setup.removeDebater(d.persona.id)}
              onModelChange={(pId, mId) => setup.updateDebaterModel(d.persona.id, pId, mId)}
              role="debater"
            />
          ))}
          {setup.debaters.length === 0 && (
            <p className="text-muted-foreground text-sm">No debaters added. A minimum of 2 is required.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDebaterSelectorOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            Select Debaters
          </button>
        </div>

        <PersonaSelector
          isOpen={isDebaterSelectorOpen}
          onClose={() => setIsDebaterSelectorOpen(false)}
          mode="council-debaters"
          initialSelectedIds={setup.debaters.map(d => d.persona.id)}
          onSelect={(selectedIds) => {
            setup.debaters.forEach(d => {
              if (!selectedIds.includes(d.persona.id)) {
                setup.removeDebater(d.persona.id);
              }
            });
            for (const id of selectedIds) {
              if (!setup.debaters.some(d => d.persona.id === id)) {
                const persona = availablePersonas.find(p => p.id === id);
                if (persona) setup.addDebater(persona);
              }
            }
          }}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Synthesizer (Optional)</h2>
          {!setup.synthesizer && (
            <button
              onClick={() => setIsSynthesizerSelectorOpen(true)}
              className="px-4 py-2 border border-primary text-primary rounded text-sm hover:bg-muted"
            >
              Select Synthesizer
            </button>
          )}
        </div>
        
        {setup.synthesizer && (
          <RosterQueueItem
            participant={setup.synthesizer}
            isFirst={true}
            isLast={true}
            onMoveEarlier={() => {}}
            onMoveLater={() => {}}
            onRemove={() => setup.setSynthesizerPersona(null)}
            onModelChange={setup.updateSynthesizerModel}
            role="synthesizer"
          />
        )}

        <PersonaSelector
          isOpen={isSynthesizerSelectorOpen}
          onClose={() => setIsSynthesizerSelectorOpen(false)}
          mode="council-synthesizer"
          initialSelectedIds={setup.synthesizer ? [setup.synthesizer.persona.id] : []}
          onSelect={(selectedIds) => {
            if (selectedIds.length > 0) {
              const persona = availablePersonas.find(p => p.id === selectedIds[0]);
              setup.setSynthesizerPersona(persona || null);
            } else {
              setup.setSynthesizerPersona(null);
            }
          }}
        />
      </div>

      <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
        <h2 className="text-xl font-semibold">Execution Settings</h2>
        <div className="flex flex-col gap-2 max-w-sm">
          <label htmlFor="turnCap" className="text-sm font-medium">Turn Cap (1-12)</label>
          <input
            id="turnCap"
            type="number"
            min="1"
            max="12"
            value={setup.turnCap}
            onChange={(e) => setup.setTurnCap(Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
            className="p-2 border rounded"
            aria-label="Turn Cap"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of turns the council will generate automatically. Estimated impact: up to {setup.turnCap} generation requests.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t flex justify-end gap-4">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 border rounded hover:bg-muted"
        >
          Cancel
        </button>
        <button
          onClick={handleStartCouncil}
          disabled={setup.debaters.length < 2}
          className="px-6 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 font-semibold"
        >
          Start Council
        </button>
      </div>
    </div>
  );
}
