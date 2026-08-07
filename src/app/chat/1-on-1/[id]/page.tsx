'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { ChatMessage, ChatSession, Persona } from '@/types';
import { Send, Square, ChevronDown, ChevronRight, Brain, Cpu, Download, Paperclip, EyeOff, UploadCloud, Layers, UserCheck, Search } from 'lucide-react';
import { AttachmentStaging, StagedFile, validateAttachmentFiles } from '@/components/chat/AttachmentStaging';
import { PersonaSelectorModal } from '@/components/personas/PersonaSelectorModal';
import { DynamicModelSelector, ModelProvider } from '@/components/ui/DynamicModelSelector';
import { ChatMessageItem } from '@/components/chat/ChatMessageItem';
import { EgressDisclosureModal } from '@/components/chat/EgressDisclosureModal';
import { ImageLightboxModal } from '@/components/chat/ImageLightboxModal';
import { getModelCapability } from '@/lib/utils/providerCapabilities';
import { buildMessagesForRetention } from '@/lib/utils/contextRetention';
import { assembleSystemPrompt } from '@/lib/utils/systemPromptAssembler';
import { InSessionSearchOverlay } from '@/components/chat/InSessionSearchOverlay';

/* Hallmark · genre: editorial · macrostructure: 05-workbench · theme: studio · nav: N5 · footer: Ft2 */

export default function OneOnOneChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const chatId = params?.id as string;
  const personaQueryParam = searchParams.get('persona');

  // Handle 'new' session initialization
  useEffect(() => {
    if (chatId === 'new') {
      const initNewSession = async () => {
        let targetPersonaId = personaQueryParam;
        if (!targetPersonaId) {
          const savedDefaultId = typeof window !== 'undefined' ? localStorage.getItem('framework-engine:default-persona-id') : null;
          if (savedDefaultId && (await db.personas.get(savedDefaultId))) {
            targetPersonaId = savedDefaultId;
          } else {
            const firstPersona = await db.personas.toCollection().first();
            targetPersonaId = firstPersona?.id || 'persona-1';
          }
        }

        const targetPersona = await db.personas.get(targetPersonaId);
        const newChatId = 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

        const newSession: ChatSession = {
          id: newChatId,
          title: targetPersona ? `Dialogue with ${targetPersona.name}` : '1-on-1 Dialogue Session',
          type: '1-on-1',
          personaId: targetPersonaId,
          contextRetention: 'hybrid',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await db.chats.add(newSession);
        router.replace(`/chat/1-on-1/${newChatId}`);
      };

      initNewSession();
    }
  }, [chatId, personaQueryParam, router]);

  const chatSession = useLiveQuery(() => (chatId && chatId !== 'new' ? db.chats.get(chatId) : undefined), [chatId]);
  const dbMessages = useLiveQuery(
    () => (chatId && chatId !== 'new' ? db.messages.where('chatId').equals(chatId).sortBy('timestamp') : []),
    [chatId]
  ) || [];

  const [activePersonaId, setActivePersonaId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (chatSession?.personaId) {
      setActivePersonaId(chatSession.personaId);
    } else if (personaQueryParam) {
      setActivePersonaId(personaQueryParam);
    }
  }, [chatSession, personaQueryParam]);

  const persona = useLiveQuery(
    () => (activePersonaId ? db.personas.get(activePersonaId) : undefined),
    [activePersonaId]
  );

  useEffect(() => {
    if (chatSession?.model) {
      setSelectedModel(chatSession.model);
    } else if (persona?.recommendedModel) {
      setSelectedModel(persona.recommendedModel);
    }

    if (chatSession?.provider) {
      setSelectedProvider(chatSession.provider);
    } else if (persona?.recommendedModel) {
      const inferredProvider: ModelProvider = persona.recommendedModel.startsWith('openrouter') || persona.recommendedModel.includes('/')
        ? 'openrouter'
        : persona.recommendedModel.startsWith('gemini')
        ? 'gemini'
        : persona.recommendedModel.startsWith('claude')
        ? 'anthropic'
        : persona.recommendedModel.startsWith('ollama') || persona.recommendedModel.includes(':') || persona.recommendedModel.includes('llama')
        ? 'ollama'
        : 'openai';
      setSelectedProvider(inferredProvider);
    }

    if (chatSession?.contextRetention) {
      setContextRetention(chatSession.contextRetention);
    }
  }, [chatSession, persona?.id, persona?.recommendedModel]);

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('framework-engine:default-model') || 'gpt-4o';
    }
    return 'gpt-4o';
  });
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('framework-engine:default-provider') as ModelProvider) || 'openai';
    }
    return 'openai';
  });
  const [contextRetention, setContextRetention] = useState<'stateless' | 'summary' | 'hybrid' | 'infinite'>(
    chatSession?.contextRetention || 'hybrid'
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});

  // Incognito Mode Memory State
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoMessages, setIncognitoMessages] = useState<ChatMessage[]>([]);

  // Persona Selector Modal State for Mid-Chat Swapping
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Multimodal File Attachments Staging
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [isEgressModalOpen, setIsEgressModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopOrPause = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeMessages = isIncognito ? incognitoMessages : dbMessages;
  const filteredMessages = searchQuery.trim()
    ? activeMessages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeMessages;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedModel = localStorage.getItem('framework-engine:default-model');
      const savedProvider = localStorage.getItem('framework-engine:default-provider') as ModelProvider;

      if (savedModel && savedProvider) {
        setSelectedModel(savedModel);
        setSelectedProvider(savedProvider);
      }
    }
  }, [persona?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isStreaming]);

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSwapPersona = (newPersona: Persona) => {
    setActivePersonaId(newPersona.id);
    if (!isIncognito && chatId !== 'new') {
      db.chats.update(chatId, { personaId: newPersona.id, updatedAt: Date.now() });
    }
  };

  const handleChangeContextRetention = (retention: 'stateless' | 'summary' | 'hybrid' | 'infinite') => {
    setContextRetention(retention);
    if (!isIncognito && chatId !== 'new') {
      db.chats.update(chatId, { contextRetention: retention });
    }
  };

  const handleEditMessage = async (msgId: string, newContent: string) => {
    if (isIncognito) {
      setIncognitoMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: newContent } : m)));
    } else {
      await db.messages.update(msgId, { content: newContent });
    }
  };

  const handleRegenerateMessage = async (msgId: string) => {
    if (!persona || isStreaming) return;
    handleSend();
  };

  // Staging File Handlers with Validation (Gap 16.3) & Vision Check (Gap 16.5)
  const handleFileSelect = (files: FileList | File[]) => {
    setAttachmentError(null);
    const fileArray = Array.from(files);
    const validFiles: StagedFile[] = [];
    let currentTotalSize = stagedFiles.reduce((acc, f) => acc + f.size, 0);

    for (const file of fileArray) {
      const isImage = file.type.startsWith('image/');
      const isText = file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.name.endsWith('.json');
      const isPdf = file.name.endsWith('.pdf');

      if (!isImage && !isText && !isPdf) {
        setAttachmentError(`Unsupported file format "${file.name}". Allowed: Images, TXT, MD, CSV, JSON, PDF.`);
        continue;
      }

      const val = validateAttachmentFiles(stagedFiles.length + validFiles.length, currentTotalSize, file);
      if (!val.valid) {
        setAttachmentError(val.error || 'Attachment validation failed.');
        break;
      }

      const staged: StagedFile = {
        id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        file,
        name: file.name,
        size: file.size,
        type: isImage ? 'image' : isPdf ? 'pdf' : 'text',
      };

      if (isImage) {
        staged.previewUrl = URL.createObjectURL(file);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = (e) => {
          staged.textContent = e.target?.result as string;
        };
        reader.readAsText(file);
      }

      validFiles.push(staged);
      currentTotalSize += file.size;
    }

    // Vision model compatibility check (Gap 16.5)
    const hasNewImage = validFiles.some((f) => f.type === 'image');
    if (hasNewImage && !getModelCapability(selectedModel).supportsVision) {
      setAttachmentError(`⚠️ Warning: Selected model "${selectedModel}" may not support image processing. Switch to gpt-4o, claude-3-5-sonnet, or gemini-2.5-flash for vision analysis.`);
    }

    setStagedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveStagedFile = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleExportTranscript = () => {
    if (activeMessages.length === 0) return;

    let mdContent = `# ${chatSession?.title || '1-on-1 Dialogue Transcript'}${isIncognito ? ' (Incognito Session)' : ''}\n\n`;
    mdContent += `**Persona:** ${persona?.name || 'Unknown'} (${persona?.role || ''})\n`;
    mdContent += `**Context Strategy:** ${contextRetention.toUpperCase()}\n`;
    mdContent += `**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

    activeMessages.forEach((msg) => {
      const sender = msg.role === 'user' ? 'You' : persona?.name || 'Assistant';
      mdContent += `### ${sender} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
      if (msg.reasoning) {
        mdContent += `> **Thought Process:**\n> ${msg.reasoning.replace(/\n/g, '\n> ')}\n\n`;
      }
      mdContent += `${msg.content}\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-1on1-${persona?.name.toLowerCase().replace(/\s+/g, '-') || 'session'}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && stagedFiles.length === 0) || isStreaming || !persona || chatId === 'new') return;

    const provider = selectedProvider || (selectedModel.startsWith('gemini') ? 'gemini' : selectedModel.startsWith('claude') ? 'anthropic' : selectedModel.startsWith('ollama') ? 'ollama' : 'openai');
    const hasAcknowledgedEgress = typeof window !== 'undefined' && localStorage.getItem('framework-engine:has_acknowledged_egress') === 'true';

    if (provider !== 'ollama' && !hasAcknowledgedEgress) {
      setIsEgressModalOpen(true);
      return;
    }

    let userContent = input.trim();

    stagedFiles.forEach((sf) => {
      if (sf.textContent) {
        userContent += `\n\n[Attached File: ${sf.name}]\n${sf.textContent}`;
      }
    });

    const userMsgId = 'msg-' + Date.now();
    const userMessageObj: ChatMessage = {
      id: userMsgId,
      chatId,
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    };

    if (isIncognito) {
      setIncognitoMessages((prev) => [...prev, userMessageObj]);
    } else {
      await db.messages.add(userMessageObj);
      await db.chats.update(chatId, { updatedAt: Date.now() });
    }

    setInput('');
    setStagedFiles([]);
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const assistantMessageObj: ChatMessage = {
      id: assistantMsgId,
      chatId,
      personaId: persona.id,
      role: 'assistant',
      content: '',
      model: selectedModel,
      timestamp: Date.now() + 1,
    };

    if (isIncognito) {
      setIncognitoMessages((prev) => [...prev, assistantMessageObj]);
    } else {
      await db.messages.add(assistantMessageObj);
    }

    try {
      const provider = selectedProvider || (selectedModel.startsWith('gemini') ? 'gemini' : selectedModel.startsWith('claude') ? 'anthropic' : selectedModel.startsWith('ollama') ? 'ollama' : 'openai');
      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const fullHistory = [...activeMessages, userMessageObj];
      const savedUserName = typeof window !== 'undefined' ? localStorage.getItem('framework-engine:user_name') || undefined : undefined;
      const assembledPrompt = assembleSystemPrompt({
        persona,
        userName: savedUserName,
        sessionTopic: chatSession?.title,
      });
      const { systemPrompt: activeSystemPrompt, messages: retentionMessages } = buildMessagesForRetention(
        fullHistory,
        contextRetention,
        assembledPrompt
      );

      const apiMessages = retentionMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: selectedModel,
          systemPrompt: activeSystemPrompt,
          messages: apiMessages,
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let streamBuffer = '';
      let promptTokens = 0;
      let completionTokens = 0;
      let cachedTokens = 0;
      let reasoningTokens = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split('\n');
          streamBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const chunkText = parsed.text || parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
                if (chunkText) {
                  fullContent += chunkText;
                }
                if (parsed.usage) {
                  promptTokens = parsed.usage.promptTokens || promptTokens;
                  completionTokens = parsed.usage.completionTokens || completionTokens;
                  cachedTokens = parsed.usage.cachedTokens || cachedTokens;
                  reasoningTokens = parsed.usage.reasoningTokens || reasoningTokens;
                }
              } catch {}
            }
          }

          let reasoningText = undefined;
          let mainContent = fullContent;

          const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
          if (thinkMatch) {
            reasoningText = thinkMatch[1].trim();
            mainContent = fullContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
          }

          const displayContent = mainContent.trim() || 'Thinking...';

          if (isIncognito) {
            setIncognitoMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: displayContent, reasoning: reasoningText } : m))
            );
          } else {
            await db.messages.update(assistantMsgId, {
              content: displayContent,
              reasoning: reasoningText,
            });
          }
        }

        const finalCleanContent = fullContent.trim() || '⚠️ No content generated by model turn.';
        if (isIncognito) {
          setIncognitoMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: finalCleanContent } : m))
          );
        } else {
          await db.messages.update(assistantMsgId, { content: finalCleanContent });
        }

        // Record BYOK analytics telemetry to IndexedDB (zero persistence if Incognito)
        if (!isIncognito && (promptTokens > 0 || completionTokens > 0)) {
          await db.usage.add({
            id: 'u-' + Date.now(),
            chatId,
            personaId: persona.id,
            model: selectedModel,
            promptTokens,
            completionTokens,
            cachedTokens,
            timestamp: Date.now(),
          } as any);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }

      let rawText = err.message || 'Failed to generate response.';
      let userFriendlySummary = 'API Request Failed';

      if (rawText.includes('429') || rawText.includes('Quota exceeded') || rawText.includes('RESOURCE_EXHAUSTED')) {
        userFriendlySummary = 'Provider Quota / Rate Limit Exceeded (HTTP 429). Your API request limit has been reached for this model.';
      } else if (rawText.includes('401') || rawText.includes('Missing API Key') || rawText.includes('Invalid Key')) {
        userFriendlySummary = 'Authentication Failed (HTTP 401). Invalid or missing API key for selected provider.';
      } else {
        userFriendlySummary = `Upstream API Transport Error: ${rawText.slice(0, 150)}`;
      }

      if (isIncognito) {
        setIncognitoMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: userFriendlySummary, isError: true, errorDetails: rawText } : m))
        );
      } else {
        await db.messages.update(assistantMsgId, {
          content: userFriendlySummary,
          isError: true,
          errorDetails: rawText,
        });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Shell>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col h-screen bg-[var(--color-paper)] relative"
      >
        {/* Persona Selector Modal for Mid-Chat Persona Swapping */}
        <PersonaSelectorModal
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          mode="single"
          title="Swap Persona Mid-Dialogue"
          selectedPersonaIds={persona ? [persona.id] : []}
          onSelectPersona={handleSwapPersona}
        />

        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 pointer-events-none">
            <UploadCloud className="w-12 h-12 text-[var(--color-accent)] animate-bounce" />
            <div className="font-display text-2xl">Drop files here to attach</div>
            <div className="text-xs font-mono text-white/80">Supports PNG, JPEG, TXT, MD, CSV, PDF</div>
          </div>
        )}

        {/* Header Bar */}
        <header className="px-6 py-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setIsSelectorOpen(true)}
            aria-label="Click to swap active persona"
            className="flex items-center gap-3 group text-left focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded p-1 transition-colors hover:bg-[var(--color-paper)]"
            title="Click to swap persona mid-dialogue"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] flex items-center justify-center font-display text-sm text-[var(--color-accent)] font-semibold shrink-0 group-hover:scale-105 transition-transform">
              {persona?.name.charAt(0) || 'P'}
            </div>
            <div>
              <div className="font-display text-lg text-[var(--color-ink)] flex items-center gap-2">
                <span>{persona?.name || '1-on-1 Session'}</span>
                <UserCheck className="w-3.5 h-3.5 text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                {isIncognito && (
                  <span className="px-2 py-0.5 bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30 rounded text-[10px] font-mono font-semibold flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Incognito
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">{persona?.role || 'Initializing...'} (Click to swap)</div>
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Context Retention Strategy Selector */}
            <div
              className="flex items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-sm)]"
              title="Context Retention Strategy"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <select
                value={contextRetention}
                onChange={(e) => handleChangeContextRetention(e.target.value as any)}
                aria-label="Select context retention strategy"
                className="bg-transparent text-xs font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer uppercase"
              >
                <option value="hybrid">Context: Hybrid</option>
                <option value="infinite">Context: Infinite</option>
                <option value="summary">Context: Summary</option>
                <option value="stateless">Context: Stateless</option>
              </select>
            </div>

            {/* Dynamic Real-Time Provider & Model Selector */}
            <DynamicModelSelector
              value={selectedModel}
              onChange={async (newModelId, newProvider) => {
                setSelectedModel(newModelId);
                setSelectedProvider(newProvider);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('framework-engine:default-model', newModelId);
                  localStorage.setItem('framework-engine:default-provider', newProvider);
                }
                if (chatId && chatId !== 'new') {
                  await db.chats.update(chatId, { model: newModelId, provider: newProvider });
                }
              }}
            />

            {/* Incognito Mode Toggle */}
            <button
              onClick={() => {
                setIsIncognito(!isIncognito);
                if (!isIncognito && incognitoMessages.length === 0) {
                  setIncognitoMessages([...dbMessages]);
                }
              }}
              aria-label="Toggle Incognito Conversation Mode"
              className={`btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                isIncognito ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border-[var(--color-warning)]/40 font-semibold' : ''
              }`}
              title="Toggle Memory-Only Incognito Mode"
            >
              <EyeOff className="w-3.5 h-3.5" />
              {isIncognito ? 'Incognito On' : 'Incognito'}
            </button>

            {/* Search Toggle Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle Conversation Search"
              className={`btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                isSearchOpen ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)]' : ''
              }`}
              title="Search conversation (Cmd+F / Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Export Session Transcript Button */}
            <button
              onClick={handleExportTranscript}
              disabled={activeMessages.length === 0}
              aria-label="Export Session Transcript as Markdown"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
              title="Export Session Transcript (.md)"
            >
              <Download className="w-3.5 h-3.5" /> Export (.md)
            </button>
          </div>
        </header>

        {/* In-Session Search Overlay */}
        <InSessionSearchOverlay
          isOpen={isSearchOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          matchCount={filteredMessages.length}
        />

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-4xl mx-auto w-full">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <Brain className="w-10 h-10 text-[var(--color-accent)] opacity-60" />
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Begin Dialogue with {persona?.name || 'Persona'}</h2>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                State your dilemma, question, or scenario below to receive structured analytical reflection.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                persona={persona || undefined}
                isIncognito={isIncognito}
                onEdit={handleEditMessage}
                onRegenerate={handleRegenerateMessage}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Full-window Drag & Drop Overlay (Gap 16.1) */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center border-4 border-dashed border-[var(--color-accent)] text-white font-mono text-sm space-y-3 animate-in fade-in duration-150">
            <UploadCloud className="w-12 h-12 text-[var(--color-accent)] animate-bounce" />
            <span className="font-display text-2xl text-white">Drop files here to attach to chat</span>
            <span className="text-xs text-white/70">Images (max 5MB), TXT/MD/CSV/JSON/PDF (max 1MB, total max 10MB)</span>
          </div>
        )}

        {/* Header toolbar */}
        {/* Attachment Error / Compatibility Warning Toast (Gap 16.3 & 16.5) */}
        {attachmentError && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-500 text-xs font-mono flex items-center justify-between">
            <span>{attachmentError}</span>
            <button onClick={() => setAttachmentError(null)} className="text-amber-500 hover:text-white text-xs px-1">✕</button>
          </div>
        )}

        {/* Multimodal Attachment Staging Bar */}
        <AttachmentStaging
          stagedFiles={stagedFiles}
          onRemoveFile={handleRemoveStagedFile}
          onPreviewImage={(src, alt) => setLightboxImage({ src, alt })}
        />

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)]">
          <div className="max-w-3xl mx-auto relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] transition-colors shrink-0"
              title="Attach File (Images, TXT, MD, CSV, PDF)"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              accept="image/png,image/jpeg,image/webp,.txt,.md,.csv,.pdf"
              multiple
              className="hidden"
            />

            <div className="flex-1 relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask ${persona?.name || 'persona'} to analyze your dilemma... (Shift+Enter for new line)`}
                rows={2}
                className="w-full pr-12 pl-4 py-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] resize-none"
              />
              <button
                type={isStreaming ? 'button' : 'submit'}
                onClick={(e) => {
                  if (isStreaming) {
                    e.preventDefault();
                    handleStopOrPause();
                  }
                }}
                disabled={!input.trim() && stagedFiles.length === 0 && !isStreaming}
                aria-label={isStreaming ? 'Stop generation' : 'Send message'}
                className="absolute right-3 p-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      <EgressDisclosureModal
        isOpen={isEgressModalOpen}
        providerName={(selectedProvider || selectedModel).toUpperCase()}
        onConfirm={() => {
          localStorage.setItem('framework-engine:has_acknowledged_egress', 'true');
          setIsEgressModalOpen(false);
          handleSend();
        }}
        onCancel={() => setIsEgressModalOpen(false)}
      />

      <ImageLightboxModal
        isOpen={!!lightboxImage}
        src={lightboxImage?.src}
        alt={lightboxImage?.alt}
        onClose={() => setLightboxImage(null)}
      />
    </Shell>
  );
}
