import React, { useState, useEffect } from 'react';
import { Settings, Download, Trash2, X, ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { ProviderModelSelector } from '../providers/ProviderModelSelector';
import { exportSessionAsJson } from '../../lib/utils/export';
import { sessionRepository } from '../../lib/db/repositories/session';
import { useRouter } from 'next/navigation';
import { Session, ParticipantSnapshot } from '../../lib/schemas';

interface CouncilSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSessionUpdate: (updatedSession: Session) => void;
}

export function CouncilSettingsModal({ isOpen, onClose, session, onSessionUpdate }: CouncilSettingsModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(session.title);
  const [turnCap, setTurnCap] = useState(session.turnCap || 6);
  const [participants, setParticipants] = useState<ParticipantSnapshot[]>([...session.participants]);
  
  const [globalWordLimit, setGlobalWordLimit] = useState<number | ''>(session.settings?.wordLimit?.global || '');
  const [perPersonaWordLimits, setPerPersonaWordLimits] = useState<Record<string, number>>(session.settings?.wordLimit?.perPersona || {});

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedPersonaId, setExpandedPersonaId] = useState<string | null>(null);

  useEffect(() => {
    setTitle(session.title);
    setTurnCap(session.turnCap || 6);
    setParticipants([...session.participants]);
    setGlobalWordLimit(session.settings?.wordLimit?.global || '');
    setPerPersonaWordLimits(session.settings?.wordLimit?.perPersona || {});
  }, [session, isOpen]);

  if (!isOpen) return null;

  const debaters = participants.filter(p => p.role === 'debater');
  const synthesizer = participants.find(p => p.role === 'synthesizer');

  const moveParticipant = (personaId: string, direction: 'up' | 'down') => {
    const newParticipants = [...participants];
    const index = newParticipants.findIndex(p => p.personaId === personaId);
    if (index === -1) return;

    let swapIndex = -1;
    if (direction === 'up') {
      for (let i = index - 1; i >= 0; i--) {
        if (newParticipants[i].role === 'debater') {
          swapIndex = i;
          break;
        }
      }
    } else {
      for (let i = index + 1; i < newParticipants.length; i++) {
        if (newParticipants[i].role === 'debater') {
          swapIndex = i;
          break;
        }
      }
    }

    if (swapIndex !== -1) {
      const temp = newParticipants[index];
      newParticipants[index] = newParticipants[swapIndex];
      newParticipants[swapIndex] = temp;
      setParticipants(newParticipants);
    }
  };

  const updateParticipantProviderModel = (personaId: string, providerId: string, modelId: string) => {
    setParticipants(prev => prev.map(p => 
      p.personaId === personaId ? { ...p, providerId, modelId } : p
    ));
  };

  const updatePersonaWordLimit = (personaId: string, limit: number | '') => {
    setPerPersonaWordLimits(prev => {
      const next = { ...prev };
      if (limit === '') {
        delete next[personaId];
      } else {
        next[personaId] = limit;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const newSettings = {
        ...session.settings,
        wordLimit: {
          ...session.settings?.wordLimit,
          global: globalWordLimit === '' ? undefined : globalWordLimit,
          perPersona: Object.keys(perPersonaWordLimits).length > 0 ? perPersonaWordLimits : undefined,
        }
      };

      const updates = {
        title,
        turnCap,
        participants,
        settings: newSettings
      };
      await sessionRepository.updateSessionSettings(session.id, updates);
      
      onSessionUpdate({
        ...session,
        ...updates
      });
      onClose();
    } catch (e) {
      console.error('Failed to save session settings', e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    const success = await exportSessionAsJson(session.id);
    if (!success) {
      alert('Failed to export session.');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await sessionRepository.deleteWithCascading(session.id);
        router.push('/chat/council');
      } catch (e) {
        console.error('Failed to delete session', e);
        alert('Failed to delete session.');
        setIsDeleting(false);
      }
    } else {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md border border-border my-auto">
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background rounded-t-lg z-10">
          <h2 className="text-xl font-semibold flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Council Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <label htmlFor="session-title" className="text-sm font-medium">
              Session Title
            </label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Enter session title"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="turn-cap" className="text-sm font-medium">
                Turn Cap
              </label>
              <span className="text-sm font-medium text-muted-foreground">{turnCap} turns</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Maximum number of auto-pilot turns (1-12).
            </p>
            <input
              id="turn-cap"
              type="range"
              min="1"
              max="12"
              step="1"
              value={turnCap}
              onChange={(e) => setTurnCap(parseInt(e.target.value, 10))}
              className="w-full accent-primary"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="global-word-limit" className="text-sm font-medium">
              Global Word Limit (Optional)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Apply a strict word limit to all AI responses in this council.
            </p>
            <input
              id="global-word-limit"
              type="number"
              min="1"
              placeholder="e.g. 100"
              value={globalWordLimit}
              onChange={(e) => setGlobalWordLimit(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-w-[200px]"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Council Roster</label>
              <p className="text-xs text-muted-foreground mb-2">
                Reorder debaters or override provider/model/word limit settings.
              </p>
            </div>
            
            <div className="border border-border rounded-md divide-y divide-border overflow-hidden">
              {debaters.map((debater, idx) => (
                <div key={debater.personaId} className="bg-background">
                  <div className="flex items-center p-2">
                    <button 
                      onClick={() => setExpandedPersonaId(expandedPersonaId === debater.personaId ? null : debater.personaId)}
                      className="p-1 mr-1 text-muted-foreground hover:text-foreground"
                    >
                      {expandedPersonaId === debater.personaId ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 text-sm font-medium truncate">{debater.name}</div>
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => moveParticipant(debater.personaId, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded-md disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => moveParticipant(debater.personaId, 'down')}
                        disabled={idx === debaters.length - 1}
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded-md disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedPersonaId === debater.personaId && (
                    <div className="p-3 bg-muted/30 border-t border-border space-y-3">
                      <ProviderModelSelector 
                        providerId={debater.providerId || ''}
                        modelId={debater.modelId || ''}
                        onProviderChange={(p) => updateParticipantProviderModel(debater.personaId, p, debater.modelId || '')}
                        onModelChange={(m) => updateParticipantProviderModel(debater.personaId, debater.providerId || '', m)}
                      />
                      <div className="pt-2 border-t border-border/50">
                        <label htmlFor={`word-limit-${debater.personaId}`} className="block text-xs font-medium mb-1">
                          Persona Word Limit (Overrides Global)
                        </label>
                        <input
                          id={`word-limit-${debater.personaId}`}
                          type="number"
                          min="1"
                          placeholder={debater.wordLimit ? `Default: ${debater.wordLimit}` : (globalWordLimit ? `Global: ${globalWordLimit}` : "e.g. 50")}
                          value={perPersonaWordLimits[debater.personaId] || ''}
                          onChange={(e) => updatePersonaWordLimit(debater.personaId, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full max-w-[150px] p-1.5 border rounded-md text-xs bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {synthesizer && (
                <div className="bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="flex items-center p-2">
                    <button 
                      onClick={() => setExpandedPersonaId(expandedPersonaId === synthesizer.personaId ? null : synthesizer.personaId)}
                      className="p-1 mr-1 text-purple-500 hover:text-purple-700 dark:hover:text-purple-300"
                    >
                      {expandedPersonaId === synthesizer.personaId ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                      {synthesizer.name} (Synthesizer)
                    </div>
                  </div>
                  {expandedPersonaId === synthesizer.personaId && (
                    <div className="p-3 bg-muted/30 border-t border-purple-200 dark:border-purple-800 space-y-3">
                      <ProviderModelSelector 
                        providerId={synthesizer.providerId || ''}
                        modelId={synthesizer.modelId || ''}
                        onProviderChange={(p) => updateParticipantProviderModel(synthesizer.personaId, p, synthesizer.modelId || '')}
                        onModelChange={(m) => updateParticipantProviderModel(synthesizer.personaId, synthesizer.providerId || '', m)}
                      />
                      <div className="pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
                        <label htmlFor={`word-limit-${synthesizer.personaId}`} className="block text-xs font-medium mb-1 text-purple-700 dark:text-purple-300">
                          Persona Word Limit (Overrides Global)
                        </label>
                        <input
                          id={`word-limit-${synthesizer.personaId}`}
                          type="number"
                          min="1"
                          placeholder={synthesizer.wordLimit ? `Default: ${synthesizer.wordLimit}` : (globalWordLimit ? `Global: ${globalWordLimit}` : "e.g. 50")}
                          value={perPersonaWordLimits[synthesizer.personaId] || ''}
                          onChange={(e) => updatePersonaWordLimit(synthesizer.personaId, e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          className="w-full max-w-[150px] p-1.5 border rounded-md text-xs bg-background border-purple-200 dark:border-purple-800 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-between space-x-2 border-t border-border">
             <button
                onClick={handleExport}
                className="flex items-center px-3 py-2 text-sm border border-border rounded-md hover:bg-muted font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/40 font-medium disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Session'}
              </button>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end space-x-2 sticky bottom-0 bg-background rounded-b-lg z-10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
