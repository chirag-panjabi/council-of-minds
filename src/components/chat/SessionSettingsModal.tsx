import React, { useState, useEffect } from 'react';
import { Settings, Download, Trash2, X, AlertCircle } from 'lucide-react';
import { ProviderModelSelector } from '../providers/ProviderModelSelector';
import { exportSessionAsJson } from '../../lib/utils/export';
import { sessionRepository } from '../../lib/db/repositories/session';
import { useRouter } from 'next/navigation';
import { Session, ParticipantSnapshot, SessionSettings } from '../../lib/schemas';

interface SessionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  participant: ParticipantSnapshot;
  onParticipantUpdate: (updates: Partial<ParticipantSnapshot>) => void;
}

export function SessionSettingsModal({ isOpen, onClose, session, participant, onParticipantUpdate }: SessionSettingsModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(session.title);
  const [providerId, setProviderId] = useState(participant.providerId || '');
  const [modelId, setModelId] = useState(participant.modelId || '');
  const [wordLimitOverride, setWordLimitOverride] = useState<number | ''>(session.settings?.wordLimit?.perPersona?.[participant.personaId] || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTitle(session.title);
    setProviderId(participant.providerId || '');
    setModelId(participant.modelId || '');
    setWordLimitOverride(session.settings?.wordLimit?.perPersona?.[participant.personaId] || '');
  }, [session, participant, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (title !== session.title) {
        await sessionRepository.updateSessionTitle(session.id, title);
      }
      
      const newWordLimit = wordLimitOverride === '' ? undefined : wordLimitOverride;
      const currentOverride = session.settings?.wordLimit?.perPersona?.[participant.personaId];
      
      if (newWordLimit !== currentOverride) {
        const newSettings: SessionSettings = {
          ...session.settings,
          wordLimit: {
            ...session.settings?.wordLimit,
            perPersona: {
              ...session.settings?.wordLimit?.perPersona,
              ...(newWordLimit !== undefined ? { [participant.personaId]: newWordLimit } : {})
            }
          }
        };
        
        // Remove the key if newWordLimit is undefined
        if (newWordLimit === undefined && newSettings.wordLimit?.perPersona) {
          delete newSettings.wordLimit.perPersona[participant.personaId];
          if (Object.keys(newSettings.wordLimit.perPersona).length === 0) {
            newSettings.wordLimit.perPersona = undefined;
          }
        }
        
        await sessionRepository.updateSessionSettings(session.id, { settings: newSettings });
      }
      
      if (providerId !== participant.providerId || modelId !== participant.modelId) {
        const updates = {
          providerId,
          modelId
        };
        await sessionRepository.updateSessionParticipant(session.id, participant.personaId, updates);
        onParticipantUpdate(updates);
      }
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
    // Ask for confirmation again to be safe
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        await sessionRepository.deleteWithCascading(session.id);
        router.push(session.mode === 'council' ? '/chat/council' : '/chat/1-on-1');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Session Settings
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
            <label className="text-sm font-medium">
              Provider & Model
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Changes apply to this session only.
            </p>
            <div className="border border-border rounded-md p-3 bg-muted/20">
              <ProviderModelSelector 
                providerId={providerId}
                modelId={modelId}
                onProviderChange={setProviderId}
                onModelChange={setModelId}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="session-word-limit" className="text-sm font-medium">
              Word Limit Override (Optional)
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Override the word limit for this persona in this session.
            </p>
            <input
              id="session-word-limit"
              type="number"
              min="1"
              placeholder={participant.wordLimit ? `Default: ${participant.wordLimit}` : (session.settings?.wordLimit?.global ? `Global: ${session.settings.wordLimit.global}` : "e.g. 100")}
              value={wordLimitOverride}
              onChange={(e) => setWordLimitOverride(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-w-[200px]"
            />
          </div>

          <div className="pt-2 flex justify-between space-x-2">
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

        <div className="p-4 border-t border-border flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !providerId || !modelId}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
