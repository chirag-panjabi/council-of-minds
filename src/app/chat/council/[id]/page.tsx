'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldOff, AlertCircle, Play, Square, FastForward, CheckCircle, Settings } from 'lucide-react';
import { useSessionResolver } from '../../../../lib/hooks/useSessionResolver';
import { sessionRepository } from '../../../../lib/db/repositories/session';
import { useCouncilOrchestrator } from '../../../../lib/hooks/useCouncilOrchestrator';
import { ChatMessage } from '../../../../components/chat/ChatMessage';
import { ChatComposer } from '../../../../components/chat/ChatComposer';
import { AutoPilotConfirmModal } from '../../../../components/council/AutoPilotConfirmModal';
import { CouncilSettingsModal } from '../../../../components/council/CouncilSettingsModal';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CouncilChatPage(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const { session, isLoading } = useSessionResolver(params.id, 'council');
  const [activeSession, setActiveSession] = useState(session);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAutoPilotModalOpen, setIsAutoPilotModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (session && !activeSession) {
      setActiveSession(session);
    }
  }, [session, activeSession]);
  
  const {
    messages,
    councilState,
    errorMessage,
    autoPilot,
    turnCount,
    turnCap,
    activePersonaId,
    debaters,
    synthesizer,
    nextDebater,
    submitCentralPrompt,
    startNextTurn,
    setAutoPilot,
    cancelGeneration,
    synthesize,
  } = useCouncilOrchestrator(activeSession || {} as any);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, councilState]);

  if (isLoading) {
    return <div className="p-4 flex-1 flex items-center justify-center">Loading council session...</div>;
  }

  if (!activeSession) {
    return <div className="p-4 flex-1 flex items-center justify-center text-red-500">Session not found.</div>;
  }

  const handleToggleIncognito = async () => {
    const targetMode = activeSession.isIncognito ? 'Standard' : 'Incognito';
    if (!confirm(`Switching to ${targetMode} mode will start a new session. Continue?`)) {
      return;
    }
    const newSession = await sessionRepository.createSession(
      'council',
      activeSession.participants,
      `Council Session`,
      !activeSession.isIncognito
    );
    router.push(`/chat/council/${newSession.id}`);
  };

  const handleAutoPilotToggle = () => {
    if (autoPilot) {
      setAutoPilot(false);
    } else {
      setIsAutoPilotModalOpen(true);
    }
  };

  const isGenerating = councilState === 'generating';
  const isPaused = councilState === 'paused';
  const isReady = councilState === 'ready';
  const isCompleted = councilState === 'completed';

  return (
    <div className="flex h-full max-w-6xl mx-auto">
      {/* Sidebar Roster */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Council Roster</h2>
          <p className="text-xs text-gray-500 mt-1">Turns: {turnCount} / {turnCap}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Debaters</h3>
            <div className="space-y-2">
              {debaters?.map(d => (
                <div 
                  key={d.personaId}
                  className={`p-2 rounded-md border text-sm ${
                    activePersonaId === d.personaId 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                      : nextDebater?.personaId === d.personaId && !isGenerating
                      ? 'bg-white border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-600'
                      : 'bg-transparent border-transparent opacity-70'
                  }`}
                >
                  <div className="font-medium">{d.name}</div>
                  {activePersonaId === d.personaId && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 animate-pulse">Generating...</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {synthesizer && (
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Synthesizer</h3>
              <div 
                  className={`p-2 rounded-md border text-sm ${
                    activePersonaId === synthesizer.personaId 
                      ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800' 
                      : 'bg-transparent border-transparent opacity-70'
                  }`}
                >
                  <div className="font-medium">{synthesizer.name}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4 shrink-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold">{activeSession.title}</h1>
              <p className="text-sm text-gray-500">
                {activeSession.isIncognito ? 'Incognito Mode' : 'Standard Mode'}
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
                activeSession.isIncognito
                  ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700'
              }`}
            >
              {activeSession.isIncognito ? (
                <><Shield size={16} className="mr-2" /> Exit Incognito</>
              ) : (
                <><ShieldOff size={16} className="mr-2" /> Go Incognito</>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
              <p>Enter a central prompt to begin the Council debate.</p>
            </div>
          ) : (
            <div className="pb-4">
              {messages.map((msg, index) => {
                 // Map personaId to name for clarity
                 const participant = activeSession.participants.find(p => p.personaId === msg.personaId);
                 const namePrefix = participant ? `**[${participant.name}]**\n\n` : '';
                 const displayMessage = { ...msg, content: msg.role === 'assistant' ? namePrefix + msg.content : msg.content };

                 return (
                  <ChatMessage 
                    key={msg.id} 
                    message={displayMessage} 
                    isLast={index === messages.length - 1} 
                    assistantState={
                       isGenerating && index === messages.length - 1 ? 'generating' : 
                       councilState === 'cancelled' && index === messages.length - 1 ? 'cancelled' :
                       councilState === 'failed' && index === messages.length - 1 ? 'failed' : 'idle'
                    }
                  />
                 );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Controls and Composer */}
        <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          {errorMessage && (
             <div className="mb-3 max-w-3xl mx-auto p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center">
               <AlertCircle size={16} className="mr-2 shrink-0" />
               {errorMessage}
             </div>
          )}

          {(isReady || isPaused) && (
            <ChatComposer 
              onSend={submitCentralPrompt} 
              onCancel={() => {}} 
              assistantState={'idle'} 
            />
          )}

          {!isCompleted && (
            <div className="max-w-3xl mx-auto flex items-center justify-center space-x-4 py-2">
               {isGenerating ? (
                  <button 
                    onClick={cancelGeneration}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md font-medium text-sm"
                  >
                    <Square size={16} className="mr-2" /> Stop Generation
                  </button>
               ) : (
                  <>
                     <button 
                       onClick={startNextTurn}
                       disabled={turnCount >= turnCap || isCompleted || isReady}
                       className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 rounded-md font-medium text-sm shadow-sm"
                     >
                       <Play size={16} className="mr-2" /> 
                       {turnCount >= turnCap ? 'Turn Cap Reached' : 'Next Turn'}
                     </button>
                     <button 
                       onClick={handleAutoPilotToggle}
                       disabled={turnCount >= turnCap || isCompleted || isReady}
                       className={`flex items-center px-4 py-2 rounded-md font-medium text-sm border disabled:opacity-50 ${
                          autoPilot 
                            ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200'
                       }`}
                     >
                       <FastForward size={16} className="mr-2" /> 
                       {autoPilot ? 'Stop Auto-Pilot' : 'Auto-Pilot'}
                     </button>
                     
                     {synthesizer && (
                       <button 
                         onClick={synthesize}
                         disabled={isReady}
                         className="flex items-center px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 disabled:opacity-50 rounded-md font-medium text-sm"
                       >
                         <CheckCircle size={16} className="mr-2" /> Synthesize
                       </button>
                     )}
                  </>
               )}
            </div>
          )}
          
          {isCompleted && (
             <div className="text-center text-sm font-medium text-green-600 dark:text-green-500 py-4">
                Council Session Completed
             </div>
          )}
        </div>
      </div>

      <AutoPilotConfirmModal
        isOpen={isAutoPilotModalOpen}
        turnCap={turnCap}
        onConfirm={() => {
          setAutoPilot(true);
          setIsAutoPilotModalOpen(false);
        }}
        onCancel={() => setIsAutoPilotModalOpen(false)}
      />
      {activeSession && (
        <CouncilSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          session={activeSession}
          onSessionUpdate={setActiveSession}
        />
      )}
    </div>
  );
}
