'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { ChatMessage, ChatSession, Persona } from '@/types';
import { Send, Square, Play, Sparkles, ChevronDown, ChevronRight, Brain, Users, Cpu, Download, Paperclip, EyeOff, UploadCloud, Plus, Sliders } from 'lucide-react';
import { AttachmentStaging, StagedFile } from '@/components/chat/AttachmentStaging';
import { PersonaSelectorModal } from '@/components/personas/PersonaSelectorModal';

/* Hallmark · genre: editorial · macrostructure: 05-workbench · theme: studio · nav: N5 · footer: Ft2 */

export default function CouncilChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const chatId = params?.id as string;
  const groupQueryParam = searchParams.get('group');
  const topicQueryParam = searchParams.get('topic');

  // Handle 'new' session initialization
  useEffect(() => {
    if (chatId === 'new') {
      const initNewCouncilSession = async () => {
        let targetGroupId: string | undefined = groupQueryParam || undefined;
        if (!targetGroupId) {
          const firstGroup = await db.groups.toCollection().first();
          targetGroupId = firstGroup?.id;
        }

        const group = targetGroupId ? await db.groups.get(targetGroupId) : undefined;
        const newChatId = 'council-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);

        const newSession: ChatSession = {
          id: newChatId,
          title: group ? `Debate: ${group.name}` : 'Council Debate Session',
          type: 'council',
          groupId: targetGroupId,
          personaIds: group?.personaIds || [],
          synthesizerId: group?.synthesizerPersonaId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await db.chats.add(newSession);

        let redirectUrl = `/chat/council/${newChatId}`;
        if (topicQueryParam) {
          redirectUrl += `?topic=${encodeURIComponent(topicQueryParam)}`;
        }
        router.replace(redirectUrl);
      };

      initNewCouncilSession();
    }
  }, [chatId, groupQueryParam, topicQueryParam, router]);

  const chatSession = useLiveQuery(() => (chatId && chatId !== 'new' ? db.chats.get(chatId) : undefined), [chatId]);
  const dbMessages = useLiveQuery(
    () => (chatId && chatId !== 'new' ? db.messages.where('chatId').equals(chatId).sortBy('timestamp') : []),
    [chatId]
  ) || [];

  const personaGroup = useLiveQuery(
    () => (chatSession?.groupId ? db.groups.get(chatSession.groupId) : undefined),
    [chatSession]
  );

  const allPersonas = useLiveQuery(() => db.personas.toArray()) || [];
  const [activeDebaterIds, setActiveDebaterIds] = useState<string[]>([]);

  useEffect(() => {
    const ids = chatSession?.personaIds || personaGroup?.personaIds || [];
    if (ids.length > 0) {
      setActiveDebaterIds(ids);
    }
  }, [chatSession, personaGroup]);

  const councilPersonas = allPersonas.filter((p) => activeDebaterIds.includes(p.id));
  const activeSynthId = chatSession?.synthesizerId || personaGroup?.synthesizerPersonaId;
  const synthesizerPersona = allPersonas.find((p) => p.id === activeSynthId);

  const [input, setInput] = useState('');

  // Pre-populate initial topic query param if present
  useEffect(() => {
    if (topicQueryParam && !input) {
      setInput(topicQueryParam);
    }
  }, [topicQueryParam]);

  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [autoPilotCap, setAutoPilotCap] = useState<number>(6);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState<number | null>(null);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});

  // Incognito Mode Memory State
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoMessages, setIncognitoMessages] = useState<ChatMessage[]>([]);

  // Persona Selector Modal for Dynamic Debater Addition
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Multimodal File Attachments Staging
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = isIncognito ? incognitoMessages : dbMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, isStreaming, activeSpeakerIndex]);

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleAddDebaters = (newPersonas: Persona[]) => {
    const newIds = newPersonas.map((p) => p.id);
    const combinedIds = Array.from(new Set([...activeDebaterIds, ...newIds]));
    setActiveDebaterIds(combinedIds);
    if (!isIncognito && chatId !== 'new') {
      db.chats.update(chatId, { personaIds: combinedIds, updatedAt: Date.now() });
    }
  };

  // Staging File Handlers
  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: StagedFile[] = [];

    fileArray.forEach((file) => {
      if (stagedFiles.length + validFiles.length >= 5) return;

      const isImage = file.type.startsWith('image/');
      const isText = file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv');
      const isPdf = file.name.endsWith('.pdf');

      if (!isImage && !isText && !isPdf) return;

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
    });

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

    let mdContent = `# ${chatSession?.title || 'Council Debate Transcript'}${isIncognito ? ' (Incognito Session)' : ''}\n\n`;
    mdContent += `**Council Debaters:** ${councilPersonas.map((p) => p.name).join(', ')}\n`;
    mdContent += `**Synthesizer:** ${synthesizerPersona?.name || 'Standard Synthesizer'}\n`;
    mdContent += `**Auto-Pilot Turn Cap:** ${autoPilotCap} turns\n`;
    mdContent += `**Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

    activeMessages.forEach((msg) => {
      const speakerPersona = allPersonas.find((p) => p.id === msg.personaId);
      const sender = msg.role === 'user' ? 'Moderator (You)' : speakerPersona?.name || 'Council Member';
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
    a.download = `transcript-council-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const executePersonaTurn = async (speaker: Persona, conversationHistory: ChatMessage[]) => {
    const assistantMsgId = 'msg-' + Date.now() + '-' + speaker.id;
    const assistantMessageObj: ChatMessage = {
      id: assistantMsgId,
      chatId,
      personaId: speaker.id,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    if (isIncognito) {
      setIncognitoMessages((prev) => [...prev, assistantMessageObj]);
    } else {
      await db.messages.add(assistantMessageObj);
    }

    try {
      const provider = 'openai';
      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const apiMessages = conversationHistory.map((m) => {
        const mSpeaker = allPersonas.find((p) => p.id === m.personaId);
        return {
          role: m.role,
          content: m.role === 'assistant' && mSpeaker ? `[${mSpeaker.name} (${mSpeaker.role})]: ${m.content}` : m.content,
        };
      });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-provider': provider,
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: selectedModel,
          systemPrompt: speaker.systemPrompt,
          messages: apiMessages,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullContent += chunk;

          let reasoningText = undefined;
          let mainContent = fullContent;

          const thinkMatch = fullContent.match(/<think>([\s\S]*?)<\/think>/);
          if (thinkMatch) {
            reasoningText = thinkMatch[1].trim();
            mainContent = fullContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
          }

          if (isIncognito) {
            setIncognitoMessages((prev) =>
              prev.map((m) => (m.id === assistantMsgId ? { ...m, content: mainContent, reasoning: reasoningText } : m))
            );
          } else {
            await db.messages.update(assistantMsgId, {
              content: mainContent,
              reasoning: reasoningText,
            });
          }
        }
      }

      return { ...assistantMessageObj, content: fullContent };
    } catch (err: any) {
      const errContent = `Error: ${err.message || 'Turn execution failed.'}`;
      if (isIncognito) {
        setIncognitoMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? { ...m, content: errContent } : m))
        );
      } else {
        await db.messages.update(assistantMsgId, { content: errContent });
      }
      return { ...assistantMessageObj, content: errContent };
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && stagedFiles.length === 0) || isStreaming || councilPersonas.length === 0 || chatId === 'new') return;

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

    let currentHistory = [...activeMessages, userMessageObj];
    const turnsToExecute = Math.min(councilPersonas.length, autoPilotCap);

    for (let i = 0; i < turnsToExecute; i++) {
      setActiveSpeakerIndex(i);
      const speaker = councilPersonas[i];
      const turnMsg = await executePersonaTurn(speaker, currentHistory);
      currentHistory.push(turnMsg);
    }

    setActiveSpeakerIndex(null);
    setIsStreaming(false);
  };

  const handleTriggerSinglePersona = async (speaker: Persona) => {
    if (isStreaming || chatId === 'new') return;
    setIsStreaming(true);
    await executePersonaTurn(speaker, activeMessages);
    setIsStreaming(false);
  };

  const handleSynthesize = async () => {
    if (isStreaming || activeMessages.length === 0 || chatId === 'new') return;
    const synth = synthesizerPersona || councilPersonas[0];
    if (!synth) return;

    setIsStreaming(true);

    const synthPromptMessage: ChatMessage = {
      id: 'msg-synth-prompt-' + Date.now(),
      chatId,
      role: 'user',
      content: 'System Command: Synthesize all previous persona perspectives into a unified consensus briefing with action points.',
      timestamp: Date.now(),
    };

    if (isIncognito) {
      setIncognitoMessages((prev) => [...prev, synthPromptMessage]);
    } else {
      await db.messages.add(synthPromptMessage);
    }

    await executePersonaTurn(synth, [...activeMessages, synthPromptMessage]);
    setIsStreaming(false);
  };

  return (
    <Shell>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col h-screen bg-[var(--color-paper)] relative"
      >
        {/* Persona Selector Modal for Adding Debaters */}
        <PersonaSelectorModal
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          mode="multi"
          title="Add Debaters to Council"
          selectedPersonaIds={activeDebaterIds}
          onSelectMultiplePersonas={handleAddDebaters}
        />

        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3 pointer-events-none">
            <UploadCloud className="w-12 h-12 text-[var(--color-accent)] animate-bounce" />
            <div className="font-display text-2xl">Drop files here to attach to Council</div>
            <div className="text-xs font-mono text-white/80">Supports PNG, JPEG, TXT, MD, CSV, PDF</div>
          </div>
        )}

        {/* Header Bar */}
        <header className="px-6 py-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] flex items-center justify-center font-display text-sm text-[var(--color-accent)] font-semibold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display text-lg text-[var(--color-ink)] flex items-center gap-2">
                {chatSession?.title || 'Council Debate Session'}
                {isIncognito && (
                  <span className="px-2 py-0.5 bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30 rounded text-[10px] font-mono font-semibold flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Incognito
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                {councilPersonas.length} Active Debaters • Synthesizer: {synthesizerPersona?.name || 'Default'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Pilot Turn Cap Selector (1 to 12 turns) */}
            <div
              className="flex items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-sm)]"
              title="Auto-Pilot Turn Limit Cap"
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <select
                value={autoPilotCap}
                onChange={(e) => setAutoPilotCap(Number(e.target.value))}
                aria-label="Select Auto-Pilot Turn Cap Limit"
                className="bg-transparent text-xs font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Cap: {num} turn{num === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector */}
            <div className="flex items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-sm)]">
              <Cpu className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                aria-label="Select Council execution model target"
                className="bg-transparent text-xs font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="ollama-local">Ollama Local</option>
              </select>
            </div>

            {/* Incognito Toggle */}
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

            {/* Export Session Transcript Button */}
            <button
              onClick={handleExportTranscript}
              disabled={activeMessages.length === 0}
              aria-label="Export Council Debate Transcript as Markdown"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
              title="Export Debate Transcript (.md)"
            >
              <Download className="w-3.5 h-3.5" /> Export (.md)
            </button>
          </div>
        </header>

        {/* Debater Roster Strip with + Add Agent Button */}
        <div className="px-6 py-2 bg-[var(--color-paper)] border-b border-[var(--color-border-hairline)] flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-muted)] shrink-0">Debaters:</span>
            {councilPersonas.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => handleTriggerSinglePersona(p)}
                disabled={isStreaming}
                aria-label={`Trigger reply from ${p.name}`}
                className={`px-2.5 py-1 rounded-full text-xs font-mono border flex items-center gap-1.5 transition-all shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] ${
                  activeSpeakerIndex === idx
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs animate-pulse'
                    : 'bg-[var(--color-paper-2)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-accent)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />
                <span>@{p.name}</span>
              </button>
            ))}

            <button
              onClick={() => setIsSelectorOpen(true)}
              aria-label="Add debater persona to Council"
              className="px-2.5 py-1 rounded-full text-xs font-mono border border-dashed border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] flex items-center gap-1 transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
              title="Add persona to active council"
            >
              <Plus className="w-3 h-3" /> Add Agent
            </button>
          </div>

          <button
            onClick={handleSynthesize}
            disabled={isStreaming || activeMessages.length === 0}
            aria-label="Synthesize Council Debate consensus"
            className="btn-hallmark text-xs gap-1.5 text-[var(--color-accent)] border-[var(--color-accent)]/30 hover:bg-[var(--color-accent-subtle)] shrink-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" /> Synthesize Consensus
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <Users className="w-10 h-10 text-[var(--color-accent)] opacity-60" />
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Initiate Council Debate</h2>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                Submit a dilemma to trigger sequential round-robin analysis across your active debater roster.
              </p>
            </div>
          ) : (
            activeMessages.map((msg) => {
              const speakerPersona = allPersonas.find((p) => p.id === msg.personaId);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                        : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]'
                    }`}
                  >
                    {msg.role === 'user' ? 'M' : speakerPersona?.name.charAt(0) || 'C'}
                  </div>

                  <div className={`space-y-2 flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                      {msg.role === 'user' ? 'Moderator (You)' : `${speakerPersona?.name} (${speakerPersona?.role})`} •{' '}
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {msg.reasoning && (
                      <div className="think-accordion my-2 text-left">
                        <button
                          type="button"
                          onClick={() => toggleReasoning(msg.id)}
                          aria-expanded={Boolean(expandedReasoningIds[msg.id])}
                          aria-label="Toggle debater reasoning process"
                          className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-mono text-[var(--color-think-ink)] hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Brain className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            Thought Process & Reasoning
                          </span>
                          {expandedReasoningIds[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {expandedReasoningIds[msg.id] && (
                          <div className="p-3 text-xs leading-relaxed border-t border-[var(--color-think-border)] whitespace-pre-wrap font-mono">
                            {msg.reasoning}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`p-4 rounded-[var(--radius-md)] text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[var(--color-ink)] text-[var(--color-paper)] inline-block text-left'
                          : 'bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)]'
                      }`}
                    >
                      {msg.content || (isStreaming && msg.role === 'assistant' ? 'Formulating perspective...' : '')}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Multimodal Attachment Staging Bar */}
        <AttachmentStaging stagedFiles={stagedFiles} onRemoveFile={handleRemoveStagedFile} />

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
                placeholder="Submit dilemma for Council debate... (Shift+Enter for new line)"
                rows={2}
                className="w-full pr-12 pl-4 py-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] resize-none"
              />
              <button
                type="submit"
                disabled={!input.trim() && stagedFiles.length === 0 && !isStreaming}
                aria-label={isStreaming ? 'Stop Council debate' : 'Launch Council debate'}
                className="absolute right-3 p-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isStreaming ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Shell>
  );
}
