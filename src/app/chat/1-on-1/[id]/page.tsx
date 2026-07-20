'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, AlertCircle, Shield, ShieldOff, Settings } from 'lucide-react';
import { useSessionResolver } from '../../../../lib/hooks/useSessionResolver';
import { sessionRepository } from '../../../../lib/db/repositories/session';
import { generateAvatarSvg } from '../../../../lib/utils/avatar';
import { useChatStream } from '../../../../lib/hooks/useChatStream';
import { ChatMessage } from '../../../../components/chat/ChatMessage';
import { ChatComposer } from '../../../../components/chat/ChatComposer';
import { SessionSettingsModal } from '../../../../components/chat/SessionSettingsModal';
import { getProviderCapabilities } from '../../../../lib/providers/registry';

interface PageProps {
  params: { id: string };
}

export default function OneOnOneChatPage(props: PageProps) {
  const params = props.params;
  const router = useRouter();
  const { session, isLoading } = useSessionResolver(params.id, '1-on-1');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const initialParticipant = session?.participants[0];
  const [activeParticipant, setActiveParticipant] = useState(initialParticipant);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (session?.participants[0] && !activeParticipant) {
      setActiveParticipant(session.participants[0]);
    }
  }, [session, activeParticipant]);

  const wordLimits = session?.settings?.wordLimit;
  const sessionPersonaOverride = activeParticipant ? wordLimits?.perPersona?.[activeParticipant.personaId] : undefined;
  const snapshotWordLimit = activeParticipant?.wordLimit;
  const sessionGlobalLimit = wordLimits?.global;
  
  const effectiveWordLimit = sessionPersonaOverride || snapshotWordLimit || sessionGlobalLimit;
  
  const wordLimitConstraint = effectiveWordLimit 
    ? `\n\nPlease keep your response to approximately ${effectiveWordLimit} words or fewer.` 
    : '';

  const {
    messages,
    assistantState,
    errorMessage,
    sendMessage,
    cancelStream,
    retryMessage,
    regenerateMessage,
    editMessage
  } = useChatStream({
    sessionId: session?.id || '',
    personaId: activeParticipant?.personaId || '',
    providerId: activeParticipant?.providerId || '',
    modelId: activeParticipant?.modelId || '',
    systemInstruction: (activeParticipant?.instructions || '') + wordLimitConstraint,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantState]);

  if (isLoading) {
    return <div className="p-4 flex-1 flex items-center justify-center">Loading chat session...</div>;
  }

  if (!session) {
    return <div className="p-4 flex-1 flex items-center justify-center text-red-500">Session not found.</div>;
  }

  const avatarSrc = activeParticipant?.avatar || (activeParticipant ? generateAvatarSvg(activeParticipant.name) : '');

  const handleChangePersona = () => {
    if (confirm('Starting a new chat with a different persona will end this session. Are you sure?')) {
      router.push('/chat/1-on-1');
    }
  };

  const providerCapabilities = activeParticipant?.providerId ? getProviderCapabilities(activeParticipant.providerId as any) : undefined;

  const handleToggleIncognito = async () => {
    const targetMode = session?.isIncognito ? 'Standard' : 'Incognito';
    if (!confirm(`Switching to ${targetMode} mode will start a new session. Continue?`)) {
      return;
    }

    if (session && activeParticipant) {
      const newSession = await sessionRepository.createSession(
        '1-on-1',
        [activeParticipant],
        `Chat with ${activeParticipant.name}`,
        !session.isIncognito
      );
      router.push(`/chat/1-on-1/${newSession.id}`);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4 shrink-0">
        <div className="flex items-center space-x-4">
          {avatarSrc && (
            <img 
              src={avatarSrc} 
              alt={activeParticipant?.name || 'Persona'} 
              className="w-12 h-12 rounded-lg object-cover bg-gray-200"
            />
          )}
          <div>
            <h1 className="text-xl font-bold">{activeParticipant?.name || 'Unknown Persona'}</h1>
            <p className="text-sm text-gray-500">
              {session.isIncognito ? 'Incognito Mode' : 'Standard Mode'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center px-3 py-2 rounded-md transition-colors font-medium text-sm border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700"
            title="Session Settings"
          >
            <Settings size={16} className="mr-2" /> Settings
          </button>
          <button
            onClick={handleToggleIncognito}
            className={`flex items-center px-3 py-2 rounded-md transition-colors font-medium text-sm border ${
              session?.isIncognito
                ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700'
            }`}
            title={session?.isIncognito ? 'Switch to Standard Mode' : 'Switch to Incognito Mode'}
          >
            {session?.isIncognito ? (
              <><Shield size={16} className="mr-2" /> Exit Incognito</>
            ) : (
              <><ShieldOff size={16} className="mr-2" /> Go Incognito</>
            )}
          </button>
          <button
            onClick={handleChangePersona}
            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-md transition-colors font-medium text-sm"
          >
            Change Persona
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
              <Bot size={32} className="text-gray-400" />
            </div>
            <p>Start a conversation with {activeParticipant?.name || 'this persona'}.</p>
          </div>
        ) : (
          <div className="pb-4">
            {messages.map((msg, index) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                isLast={index === messages.length - 1} 
                assistantState={assistantState}
                onRetry={retryMessage}
                onRegenerate={regenerateMessage}
                onEdit={editMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        {errorMessage && (
           <div className="mb-3 max-w-3xl mx-auto p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm flex items-center">
             <AlertCircle size={16} className="mr-2 shrink-0" />
             {errorMessage}
           </div>
        )}
        <ChatComposer 
          onSend={sendMessage} 
          onCancel={cancelStream} 
          assistantState={assistantState} 
          providerCapabilities={providerCapabilities}
        />
      </div>

      {activeParticipant && (
        <SessionSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          session={session}
          participant={activeParticipant}
          onParticipantUpdate={(updates) => setActiveParticipant({ ...activeParticipant, ...updates })}
        />
      )}
    </div>
  );
}
