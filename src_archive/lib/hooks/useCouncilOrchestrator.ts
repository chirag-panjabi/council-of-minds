import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { messageRepository } from '../db/repositories/message';
import { attachmentRepository } from '../db/repositories/attachment';
import { processStream } from '../providers/stream';
import { db } from '../db';
import { summaryService } from '../services/summary';
import { generateId } from '../utils/uuid';
import { settingsStore } from '../storage/settings';
import type { Message } from '../schemas/message';
import type { Session } from '../schemas/session';

export type CouncilState = 'setup' | 'ready' | 'generating' | 'paused' | 'completed' | 'failed' | 'cancelled';

export function useCouncilOrchestrator(session: Session) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [councilState, setCouncilState] = useState<CouncilState>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoPilot, setAutoPilot] = useState<boolean>(false);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [debaterIndex, setDebaterIndex] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  
  // Track state refs for inside loops
  const stateRef = useRef({ autoPilot, councilState });
  useEffect(() => {
    stateRef.current = { autoPilot, councilState };
  }, [autoPilot, councilState]);

  const debaters = useMemo(() => session?.participants?.filter(p => p.role === 'debater') || [], [session?.participants]);
  const synthesizer = useMemo(() => session?.participants?.find(p => p.role === 'synthesizer'), [session?.participants]);
  const turnCap = Math.min(12, Math.max(1, session?.turnCap ?? 6));

  const turnCount = messages.filter(m => m.role === 'assistant' && debaters.some(d => d.personaId === m.personaId)).length;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Initial load
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!session?.id) return;
      try {
        const history = await messageRepository.getForSession(session.id);
        if (!ignore && isMounted.current) {
          setMessages(history);
          const debaterTurns = history.filter(m => m.role === 'assistant' && debaters.some(d => d.personaId === m.personaId));
          const hasSynth = history.some(m => m.role === 'assistant' && m.personaId === synthesizer?.personaId);
          if (hasSynth) {
             setCouncilState('completed');
             setAutoPilot(false);
          } else if (history.length > 0) {
             setCouncilState('paused');
             setAutoPilot(false);
          }
          if (debaterTurns.length > 0) {
             // Find last debater who spoke
             const lastPersonaId = debaterTurns[debaterTurns.length - 1].personaId;
             const idx = debaters.findIndex(d => d.personaId === lastPersonaId);
             if (idx !== -1) {
                setDebaterIndex((idx + 1) % debaters.length);
             }
          }
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    }
    load();
    return () => { ignore = true; };
  }, [session?.id, debaters, synthesizer?.personaId]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setCouncilState('cancelled');
      setAutoPilot(false);
      setActivePersonaId(null);
    }
  }, []);

  const getProviderKey = (providerId: string) => {
    const apiKeys = settingsStore.getApiKeys();
    return apiKeys[providerId as keyof typeof apiKeys] || '';
  };

  const executeGeneration = async (personaId: string, customMessages: Message[], isSynthesis = false) => {
    const participant = session.participants.find(p => p.personaId === personaId);
    if (!participant || !participant.providerId || !participant.modelId) {
       setErrorMessage('Participant provider/model not configured.');
       setCouncilState('failed');
       return;
    }

    setErrorMessage(null);
    setActivePersonaId(personaId);
    setCouncilState('generating');

    const assistantMessage: Message = {
      id: generateId(),
      sessionId: session.id,
      createdAt: Date.now(),
      role: 'assistant',
      content: '',
      personaId: participant.personaId,
      providerId: participant.providerId,
      modelId: participant.modelId,
    };

    setMessages(prev => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      const summaries = await db.summaries.where('sessionId').equals(session.id).sortBy('createdAt');
      const latestSummary = summaries[summaries.length - 1];
      
      let relevantMessages = customMessages;
      let summaryText = '';
      if (latestSummary) {
        // Exclude messages older than the summary
        relevantMessages = customMessages.filter(m => m.createdAt > latestSummary.createdAt);
        summaryText = `<UNTRUSTED_CONVERSATION_SUMMARY>\n${latestSummary.content}\n</UNTRUSTED_CONVERSATION_SUMMARY>\n\n`;
      }

      let transcript = summaryText;
      for (const msg of relevantMessages) {
        const part = session.participants.find(p => p.personaId === msg.personaId);
        const name = part ? part.name : (msg.role === 'user' ? 'User' : 'Assistant');
        transcript += `[${name}]\n${msg.content}\n\n`;
      }
      
      transcript += `Please provide your response as ${participant.name}.`;
      
      const finalMessages = [{ role: 'user', content: transcript }];

      let payload: any;
      const provider = participant.providerId;
      
      let system = participant.instructions;
      const wordLimits = session.settings?.wordLimit;
      
      const sessionPersonaOverride = wordLimits?.perPersona?.[participant.personaId];
      const snapshotWordLimit = participant.wordLimit;
      const sessionGlobalLimit = wordLimits?.global;
      
      const effectiveWordLimit = sessionPersonaOverride || snapshotWordLimit || sessionGlobalLimit;
      
      if (effectiveWordLimit) {
        system += `\n\nPlease keep your response to approximately ${effectiveWordLimit} words or fewer.`;
      }

      if (provider === 'openai' || provider === 'ollama') {
        payload = {
          model: participant.modelId,
          stream: true,
          messages: system ? [{ role: 'system', content: system }, ...finalMessages] : finalMessages,
        };
      } else if (provider === 'anthropic') {
        payload = {
          model: participant.modelId,
          stream: true,
          max_tokens: 4096,
          system: system || undefined,
          messages: finalMessages,
        };
      } else if (provider === 'gemini') {
        payload = {
          model: participant.modelId,
          contents: [{ role: 'user', parts: [{ text: transcript }] }],
          systemInstruction: system ? { parts: [{ text: system }] } : undefined,
        };
      }

      const url = provider === 'ollama' ? 'http://localhost:11434/api/chat' : `/api/proxy/${provider}`;
      const apiKey = getProviderKey(provider);
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (provider !== 'ollama') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${await response.text()}`);
      }

      let generatedText = '';
      await processStream(response, provider, (delta) => {
        generatedText += delta;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.id === assistantMessage.id) {
            return [...prev.slice(0, -1), { ...last, content: generatedText }];
          }
          return prev;
        });
      });

      if (isMounted.current) {
         setCouncilState(isSynthesis ? 'completed' : 'paused');
         setActivePersonaId(null);
      }

      await messageRepository.save({ ...assistantMessage, content: generatedText });
      
      // Trigger background summarization
      summaryService.summarizeSession(session.id).catch(console.error);
      
      return true; // Success

    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (isMounted.current) {
          setCouncilState('cancelled');
          setAutoPilot(false);
          setActivePersonaId(null);
        }
        // Save partial message
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.id === assistantMessage.id) {
            messageRepository.save(last).catch(console.error);
          }
          return prev;
        });
      } else {
        console.error('Stream error:', err);
        if (isMounted.current) {
          setErrorMessage(err.message || 'An error occurred during generation.');
          setCouncilState('failed');
          setAutoPilot(false);
          setActivePersonaId(null);
        }
      }
      return false; // Failed
    } finally {
      abortControllerRef.current = null;
    }
  };

  const runTurn = async (personaId: string) => {
      const latestMessages = await messageRepository.getForSession(session.id);
      return await executeGeneration(personaId, latestMessages, false);
  };

  const startNextTurn = useCallback(async () => {
    if (stateRef.current.councilState === 'generating') return;
    if (turnCount >= turnCap) {
        setCouncilState('paused');
        setAutoPilot(false);
        return;
    }

    const nextPersona = debaters[debaterIndex];
    const success = await runTurn(nextPersona.personaId);
    
    if (success && isMounted.current) {
       setDebaterIndex(prev => (prev + 1) % debaters.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debaters, debaterIndex, turnCount, turnCap]);

  // Handle auto-pilot loop
  useEffect(() => {
    if (autoPilot && councilState === 'paused' && turnCount < turnCap) {
        const timer = setTimeout(() => {
           startNextTurn();
        }, 1000);
        return () => clearTimeout(timer);
    }
    if (autoPilot && turnCount >= turnCap) {
        setAutoPilot(false);
    }
  }, [autoPilot, councilState, turnCount, turnCap, startNextTurn]);

  const requestPersonaTurn = useCallback(async (personaId: string) => {
    if (councilState === 'generating') return;
    if (turnCount >= turnCap) return;
    setAutoPilot(false); 
    
    const success = await runTurn(personaId);
    if (success && isMounted.current) {
       const idx = debaters.findIndex(d => d.personaId === personaId);
       if (idx !== -1) {
          setDebaterIndex((idx + 1) % debaters.length);
       }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [councilState, turnCount, turnCap, debaters]);

  const synthesize = useCallback(async () => {
    if (councilState === 'generating' || !synthesizer) return;
    setAutoPilot(false);
    
    const latestMessages = await messageRepository.getForSession(session.id);
    await executeGeneration(synthesizer.personaId, latestMessages, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [councilState, synthesizer, session.id]);

  const submitCentralPrompt = useCallback(async (content: string, attachments: File[] = []) => {
    if (councilState === 'generating') return;

    const userMessage: Message = {
      id: generateId(),
      sessionId: session.id,
      createdAt: Date.now(),
      role: 'user',
      content,
    };

    setMessages(prev => [...prev, userMessage]);
    
    try {
      await messageRepository.save(userMessage);
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          await attachmentRepository.save({
            id: crypto.randomUUID(),
            messageId: userMessage.id,
            createdAt: Date.now(),
            name: file.name,
            mimeType: file.type,
            size: file.size,
            data: file,
          });
        }
      }
    } catch (err) {
      console.error('Failed to save central prompt', err);
    }

    // Check for direct mentions
    const mentionedDebaters = debaters.filter(d => content.includes(`@${d.name}`));
    if (mentionedDebaters.length === 1) {
      setCouncilState('ready'); // Ready state allows requestPersonaTurn to run
      requestPersonaTurn(mentionedDebaters[0].personaId);
    } else {
      setCouncilState('ready');
      startNextTurn();
    }
  }, [councilState, session.id, debaters, requestPersonaTurn, startNextTurn]);

  return {
    messages,
    councilState,
    errorMessage,
    autoPilot,
    turnCount,
    turnCap,
    activePersonaId,
    debaters,
    synthesizer,
    nextDebater: debaters[debaterIndex],
    
    submitCentralPrompt,
    startNextTurn,
    setAutoPilot,
    requestPersonaTurn,
    cancelGeneration,
    synthesize,
  };
}
