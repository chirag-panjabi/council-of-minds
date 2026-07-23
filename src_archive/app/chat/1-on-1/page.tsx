'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PersonaSelector } from '../../../components/personas/PersonaSelector';
import { ProviderModelSelector } from '../../../components/providers/ProviderModelSelector';
import { sessionRepository } from '../../../lib/db/repositories/session';
import { personaRepository } from '../../../lib/db/repositories/persona';
import { LocalPersona } from '../../../lib/schemas/persona';
import { generateAvatarSvg } from '../../../lib/utils/avatar';
import { User } from 'lucide-react';
import { settingsStore } from '../../../lib/storage/settings';

export default function SetupOneOnOnePage() {
  const router = useRouter();
  const [isPersonaSelectorOpen, setIsPersonaSelectorOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<LocalPersona | null>(null);
  const [isIncognito, setIsIncognito] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  
  const [providerId, setProviderId] = useState('');
  const [modelId, setModelId] = useState('');

  useEffect(() => {
    const prefs = settingsStore.getPreferences();
    if (prefs.defaultProviderId) setProviderId(prefs.defaultProviderId);
    if (prefs.defaultModelId) setModelId(prefs.defaultModelId);
  }, []);

  const handlePersonaSelect = async (selectedIds: string[], incognito: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const persona = await personaRepository.get(selectedIds[0]);
      if (persona) {
        setSelectedPersona(persona);
        setIsIncognito(incognito);
      }
    } catch (e) {
      console.error('Failed to load persona:', e);
    }
  };

  const handleStartChat = async () => {
    if (!selectedPersona) return;
    
    try {
      const session = await sessionRepository.createSession(
        '1-on-1',
        [{
          personaId: selectedPersona.id,
          name: selectedPersona.name,
          description: selectedPersona.description,
          instructions: selectedPersona.instructions,
          avatar: selectedPersona.avatar,
          role: 'debater',
          providerId: providerId || undefined,
          modelId: modelId || undefined,
          wordLimit: selectedPersona.defaultWordLimit
        }],
        sessionTitle.trim() || `Chat with ${selectedPersona.name}`,
        isIncognito
      );
      
      router.push(`/chat/1-on-1/${session.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to start chat session.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">1-on-1 Chat Setup</h1>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Select Persona</h2>
        
        {selectedPersona ? (
          <div className="flex items-start p-4 border rounded-lg bg-background shadow-sm gap-4">
            <img 
              src={selectedPersona.avatar || generateAvatarSvg(selectedPersona.name)} 
              alt={selectedPersona.name} 
              className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{selectedPersona.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedPersona.description}</p>
            </div>
            <button
              onClick={() => setIsPersonaSelectorOpen(true)}
              className="px-3 py-1.5 text-sm border rounded hover:bg-muted"
            >
              Change Persona
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/30 gap-4">
            <User className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">Select a persona to start a conversation.</p>
            <button
              onClick={() => setIsPersonaSelectorOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90"
            >
              Choose Persona
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
        <h2 className="text-xl font-semibold">Session Details</h2>
        <div className="max-w-md space-y-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="sessionTitle" className="text-sm font-medium">Session Title (Optional)</label>
            <input
              id="sessionTitle"
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder={selectedPersona ? `Chat with ${selectedPersona.name}` : 'Enter a custom title'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="incognito-toggle-page"
              checked={isIncognito}
              onChange={(e) => setIsIncognito(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-input focus:ring-primary"
            />
            <label htmlFor="incognito-toggle-page" className="text-sm font-medium cursor-pointer">
              Start in Incognito Mode
            </label>
          </div>
          <p className="text-xs text-muted-foreground pl-6">
            Incognito sessions do not save messages to your local history.
          </p>
        </div>
      </div>

      <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
        <h2 className="text-xl font-semibold">Model Configuration</h2>
        <div className="max-w-md">
          <ProviderModelSelector 
            providerId={providerId}
            modelId={modelId}
            onProviderChange={setProviderId}
            onModelChange={setModelId}
          />
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
          onClick={handleStartChat}
          disabled={!selectedPersona || !providerId || !modelId}
          className="px-6 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50 font-semibold"
        >
          Start Chat
        </button>
      </div>

      <PersonaSelector 
        isOpen={isPersonaSelectorOpen}
        onClose={() => setIsPersonaSelectorOpen(false)}
        mode="single"
        onSelect={handlePersonaSelect}
        initialSelectedIds={selectedPersona ? [selectedPersona.id] : []}
      />
    </div>
  );
}
