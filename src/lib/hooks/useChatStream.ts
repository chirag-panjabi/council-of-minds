import { useState, useEffect, useRef, useCallback } from 'react';
import { messageRepository } from '../db/repositories/message';
import { attachmentRepository } from '../db/repositories/attachment';
import { processStream } from '../providers/stream';
import { db } from '../db';
import { summaryService } from '../services/summary';
import type { Message, MessageRole } from '../schemas/message';
import { generateId } from '../utils/uuid';
import { settingsStore } from '../storage/settings';

export type AssistantState = 'idle' | 'generating' | 'completed' | 'failed' | 'cancelled';

interface UseChatStreamOptions {
  sessionId: string;
  personaId?: string;
  providerId?: string;
  modelId?: string;
  systemInstruction?: string;
}

export function useChatStream({
  sessionId,
  personaId,
  providerId,
  modelId,
  systemInstruction,
}: UseChatStreamOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const history = await messageRepository.getForSession(sessionId);
        if (isMounted.current) {
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    }
    loadMessages();
  }, [sessionId]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setAssistantState('cancelled');
    }
  }, []);

  const formatPayload = (history: Message[], provider: string, model: string, system?: string) => {
    // Basic mapping of our internal history to provider-specific formats
    const coreMessages = history.map(m => ({
      role: m.role,
      content: m.content
    }));

    if (provider === 'openai') {
      return {
        model,
        stream: true,
        messages: system ? [{ role: 'system', content: system }, ...coreMessages] : coreMessages,
      };
    } else if (provider === 'anthropic') {
      return {
        model,
        stream: true,
        max_tokens: 4096,
        system: system || undefined,
        messages: coreMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
      };
    } else if (provider === 'gemini') {
      const contents = coreMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      return {
        model,
        contents,
        systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      };
    } else if (provider === 'ollama') {
      return {
        model,
        stream: true,
        messages: system ? [{ role: 'system', content: system }, ...coreMessages] : coreMessages,
      };
    }
    throw new Error(`Unsupported provider: ${provider}`);
  };

  const getUrl = (provider: string) => {
    if (provider === 'ollama') {
      // In BYOK, Ollama might be hit directly, but for MVP let's assume we hit it via a generic route or local direct.
      // According to our plan, Ollama validation is direct, so maybe we hit `http://localhost:11434/api/chat`.
      return 'http://localhost:11434/api/chat';
    }
    return `/api/proxy/${provider}`;
  };

  const sendMessage = useCallback(async (content: string, attachments: File[] = []) => {
    if (assistantState === 'generating') return;
    if (!providerId || !modelId) {
      setErrorMessage('Provider or Model is not configured for this session.');
      setAssistantState('failed');
      return;
    }

    setErrorMessage(null);

    const userMessage: Message = {
      id: generateId(),
      sessionId,
      createdAt: Date.now(),
      role: 'user',
      content,
    };

    const triggerAssistantResponse = async (contextMessages: Message[]) => {
      const initialAssistantMessage: Message = {
        id: generateId(),
        sessionId,
        createdAt: Date.now() + 1,
        role: 'assistant',
        content: '',
        personaId,
        providerId,
        modelId,
      };

      // Optimistically update UI
      setMessages([...contextMessages, initialAssistantMessage]);
      setAssistantState('generating');

      abortControllerRef.current = new AbortController();

      try {
        const summaries = await db.summaries.where('sessionId').equals(sessionId).sortBy('createdAt');
        const latestSummary = summaries[summaries.length - 1];
        
        let finalMessages = contextMessages;
        if (latestSummary) {
          const recentMessages = contextMessages.filter(m => m.createdAt > latestSummary.createdAt);
          finalMessages = [...recentMessages];
          finalMessages.unshift({
            id: 'summary-context',
            sessionId,
            createdAt: 0,
            role: 'user',
            content: `<UNTRUSTED_CONVERSATION_SUMMARY>\n${latestSummary.content}\n</UNTRUSTED_CONVERSATION_SUMMARY>`
          });
        }

        const payload = formatPayload(finalMessages, providerId!, modelId!, systemInstruction);
        const url = getUrl(providerId!);

        const apiKeys = settingsStore.getApiKeys();
        const apiKey = providerId ? (apiKeys[providerId as keyof typeof apiKeys] || '') : '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (providerId !== 'ollama') {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} ${errorText}`);
        }

        let generatedText = '';

        await processStream(response, providerId!, (delta) => {
          generatedText += delta;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.id === initialAssistantMessage.id) {
              return [...prev.slice(0, -1), { ...last, content: generatedText }];
            }
            return prev;
          });
        });

        setAssistantState('completed');
        
        // Save the final assistant message
        try {
          await messageRepository.save({ ...initialAssistantMessage, content: generatedText });
        } catch (err) {
          console.error('Failed to save assistant message', err);
        }

        // Trigger background summarization
        summaryService.summarizeSession(sessionId).catch(console.error);

      } catch (err: any) {
        if (err.name === 'AbortError') {
          setAssistantState('cancelled');
          // Save the partial message
          setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.id === initialAssistantMessage.id) {
                messageRepository.save(last).catch(console.error);
              }
              return prev;
          });
        } else {
          console.error('Stream error:', err);
          setErrorMessage(err.message || 'An error occurred during generation.');
          setAssistantState('failed');
        }
      } finally {
        abortControllerRef.current = null;
      }
    };

    const updatedMessages = [...messages, userMessage];
    // UI update handled by triggerAssistantResponse
    
    // Save user message to DB
    try {
      await messageRepository.save(userMessage);

      // Save attachments if any
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          await attachmentRepository.save({
            id: generateId(),
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
      console.error('Failed to save user message or attachments', err);
    }

    await triggerAssistantResponse(updatedMessages);
  }, [messages, assistantState, providerId, modelId, sessionId, personaId, systemInstruction]);

  const retryMessage = useCallback(async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Copy the slice so we don't mutate the state array directly
    const previousMessages = messages.slice(0, messageIndex);
    const lastUserMessage = [...previousMessages].reverse().find(m => m.role === 'user');
    
    if (lastUserMessage) {
        setMessages(previousMessages);
        await messageRepository.truncateAfter(sessionId, messageId, true);
        
        // Re-run the assistant generation using the truncated context
        if (assistantState === 'generating') return;
        setErrorMessage(null);
        // Call the internal generation logic directly, bypassing user message creation
        const triggerAssistantResponse = async (contextMessages: Message[]) => {
          const initialAssistantMessage: Message = {
            id: generateId(),
            sessionId,
            createdAt: Date.now() + 1,
            role: 'assistant',
            content: '',
            personaId,
            providerId,
            modelId,
          };
          setMessages([...contextMessages, initialAssistantMessage]);
          setAssistantState('generating');
          abortControllerRef.current = new AbortController();
          try {
            const summaries = await db.summaries.where('sessionId').equals(sessionId).sortBy('createdAt');
            const latestSummary = summaries[summaries.length - 1];
            let finalMessages = contextMessages;
            if (latestSummary) {
              const recentMessages = contextMessages.filter(m => m.createdAt > latestSummary.createdAt);
              finalMessages = [...recentMessages];
              finalMessages.unshift({
                id: 'summary-context',
                sessionId,
                createdAt: 0,
                role: 'user',
                content: `<UNTRUSTED_CONVERSATION_SUMMARY>\n${latestSummary.content}\n</UNTRUSTED_CONVERSATION_SUMMARY>`
              });
            }
            const payload = formatPayload(finalMessages, providerId!, modelId!, systemInstruction);
            const url = getUrl(providerId!);
            
            const apiKeys = settingsStore.getApiKeys();
            const apiKey = providerId ? (apiKeys[providerId as keyof typeof apiKeys] || '') : '';
            
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (providerId !== 'ollama') headers['Authorization'] = `Bearer ${apiKey}`;
            const response = await fetch(url, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
              signal: abortControllerRef.current.signal,
            });
            if (!response.ok) throw new Error(`API Error: ${response.status} ${await response.text()}`);
            let generatedText = '';
            await processStream(response, providerId!, (delta) => {
              generatedText += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.id === initialAssistantMessage.id) {
                  return [...prev.slice(0, -1), { ...last, content: generatedText }];
                }
                return prev;
              });
            });
            setAssistantState('completed');
            try { await messageRepository.save({ ...initialAssistantMessage, content: generatedText }); } catch (err) {}
            summaryService.summarizeSession(sessionId).catch(console.error);
          } catch (err: any) {
            if (err.name === 'AbortError') {
              setAssistantState('cancelled');
              setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.id === initialAssistantMessage.id) {
                    messageRepository.save(last).catch(console.error);
                  }
                  return prev;
              });
            } else {
              setErrorMessage(err.message || 'An error occurred during generation.');
              setAssistantState('failed');
            }
          } finally {
            abortControllerRef.current = null;
          }
        };
        await triggerAssistantResponse(previousMessages);
    }
  }, [messages, assistantState, providerId, modelId, sessionId, personaId, systemInstruction]);

  const regenerateMessage = useCallback(async (messageId: string) => {
    // Regenerate uses the exact same logic as retry
    await retryMessage(messageId);
  }, [retryMessage]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    setMessages(messages.slice(0, messageIndex));
    await messageRepository.truncateAfter(sessionId, messageId, true);
    await sendMessage(newContent);
  }, [messages, sendMessage, sessionId]);

  return {
    messages,
    assistantState,
    errorMessage,
    sendMessage,
    cancelStream,
    retryMessage,
    regenerateMessage,
    editMessage
  };
}
