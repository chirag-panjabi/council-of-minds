import React from 'react';
import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { SetupParticipant } from '../../lib/hooks/useCouncilSetup';
import { ProviderModelSelector } from '../providers/ProviderModelSelector';

interface RosterQueueItemProps {
  participant: SetupParticipant;
  isFirst: boolean;
  isLast: boolean;
  onMoveEarlier: () => void;
  onMoveLater: () => void;
  onRemove: () => void;
  onModelChange: (providerId: string, modelId: string) => void;
  role: 'debater' | 'synthesizer';
}

export function RosterQueueItem({
  participant,
  isFirst,
  isLast,
  onMoveEarlier,
  onMoveLater,
  onRemove,
  onModelChange,
  role,
}: RosterQueueItemProps) {

  
  return (
    <div className="flex items-center gap-4 p-4 border rounded-md mb-2 bg-background shadow-sm">
      {role === 'debater' && (
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveEarlier}
            disabled={isFirst}
            aria-label="Move Earlier"
            className="p-1 rounded hover:bg-muted disabled:opacity-50"
          >
            <ArrowUp size={16} />
          </button>
          <button
            onClick={onMoveLater}
            disabled={isLast}
            aria-label="Move Later"
            className="p-1 rounded hover:bg-muted disabled:opacity-50"
          >
            <ArrowDown size={16} />
          </button>
        </div>
      )}

      <div className="flex-1">
        <h3 className="font-semibold">{participant.persona.name}</h3>
        <p className="text-sm text-muted-foreground">{participant.persona.description}</p>
      </div>

      <div className="flex flex-col gap-2 w-48">
        <ProviderModelSelector
          providerId={participant.providerId || ''}
          modelId={participant.modelId || ''}
          onProviderChange={(pId) => onModelChange(pId, participant.modelId || '')}
          onModelChange={(mId) => onModelChange(participant.providerId || '', mId)}
        />
      </div>

      <button
        onClick={onRemove}
        aria-label={`Remove ${participant.persona.name}`}
        className="p-2 text-destructive hover:bg-destructive/10 rounded"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
