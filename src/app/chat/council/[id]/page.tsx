'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { Persona } from '@/types';
import { Send, Square, Play, Sparkles, ChevronDown, ChevronRight, Brain, UserCheck, RefreshCw, Cpu, Download } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 05-workbench · theme: studio · nav: N5 · footer: Ft2 */

export default function CouncilChatPage() {
  const params = useParams();
  const chatId = params?.id as string;

  const chatSession = useLiveQuery(() => db.chats.get(chatId), [chatId]);
  const messages = useLiveQuery(() => db.messages.where('chatId').equals(chatId).sortBy('timestamp'), [chatId]) || [];
  const group = useLiveQuery(
    () => (chatSession?.groupId ? db.groups.get(chatSession.groupId) : undefined),
    [chatSession]
  );
  const personas = useLiveQuery(() => db.personas.toArray()) || [];

  const councilPersonas = personas.filter((p) => group?.personaIds.includes(p.id));

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoPilotActive, setAutoPilotActive] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleExportTranscript = () => {
    if (messages.length === 0) return;

    let mdContent = `# ${chatSession?.title || 'Council Debate Transcript'}\n\n`;
    mdContent += `**Roster Group:** ${group?.name || 'Council'}\n`;
    mdContent += `**Members:** ${councilPersonas.map((p) => p.name).join(', ')}\n`;
    mdContent += `**Date:** ${new Date(chatSession?.createdAt || Date.now()).toLocaleDateString()}\n\n---\n\n`;

    messages.forEach((msg) => {
      const msgPersona = personas.find((p) => p.id === msg.personaId);
      const sender = msg.role === 'user' ? 'You' : msg.role === 'synthesizer' ? 'Council Moderator (Synthesizer)' : msgPersona?.name || 'Council Member';
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
    a.download = `transcript-council-${group?.name.toLowerCase().replace(/\s+/g, '-') || 'debate'}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendUserMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');

    await db.messages.add({
      id: 'msg-' + Date.now(),
      chatId,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    });

    await db.chats.update(chatId, { updatedAt: Date.now() });
  };

  const handleRequestReplyFromPersona = async (targetPersona: Persona) => {
    if (isStreaming) return;

    setIsStreaming(true);
    const assistantMsgId = 'msg-' + Date.now();

    await db.messages.add({
      id: assistantMsgId,
      chatId,
      personaId: targetPersona.id,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    });

    try {
      const provider = 'openai';
      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const apiMessages = messages.map((m) => ({
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
          model: selectedModel || targetPersona.defaultModel || 'gpt-4o',
          systemPrompt: `You are participating in a Council Debate. ${targetPersona.systemPrompt}`,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

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

          await db.messages.update(assistantMsgId, {
            content: mainContent,
            reasoning: reasoningText,
          });
        }
      }
    } catch (err: any) {
      await db.messages.update(assistantMsgId, {
        content: `Error: ${err.message}`,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleRunAutoPilotRound = async () => {
    if (isStreaming || councilPersonas.length === 0) return;
    setAutoPilotActive(true);

    for (const p of councilPersonas) {
      await handleRequestReplyFromPersona(p);
    }

    setAutoPilotActive(false);
  };

  const handleSynthesize = async () => {
    if (isStreaming || councilPersonas.length === 0) return;

    setIsStreaming(true);
    const synthMsgId = 'msg-' + Date.now();

    await db.messages.add({
      id: synthMsgId,
      chatId,
      role: 'synthesizer',
      content: '',
      timestamp: Date.now(),
    });

    try {
      const provider = 'openai';
      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const synthPrompt = 'You are the Council Moderator. Synthesize all perspectives presented in this debate into a clear, balanced summary that highlights key trade-offs and actionable insights for the user.';

      const apiMessages = messages.map((m) => ({
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
          model: selectedModel || 'gpt-4o',
          systemPrompt: synthPrompt,
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

          await db.messages.update(synthMsgId, { content: fullContent });
        }
      }
    } catch (err: any) {
      await db.messages.update(synthMsgId, { content: `Synthesis Error: ${err.message}` });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Shell>
      <div className="flex flex-col h-screen bg-[var(--color-paper)]">
        {/* Header Bar with Council Model Selector & Export Transcript */}
        <header className="px-6 py-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-display text-lg text-[var(--color-ink)]">{group?.name || 'Council Debate'}</div>
            <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
              {councilPersonas.length} Active Council Members
            </div>
          </div>

          {/* Council Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Council Model Selector */}
            <div className="flex items-center gap-1.5 bg-[var(--color-paper)] border border-[var(--color-border)] px-2 py-1 rounded-[var(--radius-sm)]">
              <Cpu className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                aria-label="Select Council execution model"
                className="bg-transparent text-xs font-mono text-[var(--color-ink)] focus:outline-none cursor-pointer"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="ollama-local">Ollama Local</option>
              </select>
            </div>

            {/* Export Session Transcript Button */}
            <button
              onClick={handleExportTranscript}
              disabled={messages.length === 0}
              aria-label="Export Session Transcript as Markdown"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40"
              title="Export Session Transcript (.md)"
            >
              <Download className="w-3.5 h-3.5" /> Export (.md)
            </button>

            <button
              onClick={handleRunAutoPilotRound}
              disabled={isStreaming || autoPilotActive}
              aria-label="Run Auto-Pilot Round-Robin Debate"
              className="btn-hallmark text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoPilotActive ? 'animate-spin text-[var(--color-accent)]' : ''}`} />
              {autoPilotActive ? 'Debating...' : 'Auto-Pilot Round'}
            </button>

            <button
              onClick={handleSynthesize}
              disabled={isStreaming}
              aria-label="Synthesize Council Debate"
              className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" /> Synthesize Debate
            </button>
          </div>
        </header>

        {/* Moderator Strip — Roster Bar with Request Reply Triggers */}
        <div className="px-6 py-2 bg-[var(--color-paper-3)] border-b border-[var(--color-border-hairline)] flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-muted)] shrink-0">
            Request Reply:
          </span>
          {councilPersonas.map((p) => (
            <button
              key={p.id}
              onClick={() => handleRequestReplyFromPersona(p)}
              disabled={isStreaming}
              aria-label={`Request reply from ${p.name}`}
              className="px-2.5 py-1 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] hover:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />
              <span className="font-medium text-[var(--color-ink)]">@{p.name}</span>
            </button>
          ))}
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <Brain className="w-10 h-10 text-[var(--color-accent)] opacity-60" />
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Council Ready for Debate</h2>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                State your dilemma below to trigger a multi-perspective discussion among council members.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const msgPersona = personas.find((p) => p.id === msg.personaId);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl ${
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                        : msg.role === 'synthesizer'
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]'
                    }`}
                  >
                    {msg.role === 'user' ? 'U' : msg.role === 'synthesizer' ? 'S' : msgPersona?.name.charAt(0) || 'C'}
                  </div>

                  <div className={`space-y-2 flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                      {msg.role === 'user' ? 'You' : msg.role === 'synthesizer' ? 'Council Synthesizer' : msgPersona?.name} •{' '}
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {msg.reasoning && (
                      <div className="think-accordion my-2 text-left">
                        <button
                          type="button"
                          onClick={() => toggleReasoning(msg.id)}
                          aria-expanded={Boolean(expandedReasoningIds[msg.id])}
                          aria-label="Toggle thought process reasoning"
                          className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-mono text-[var(--color-think-ink)] hover:bg-black/5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
                        >
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Brain className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                            Thought Process
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
                          : msg.role === 'synthesizer'
                          ? 'bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] text-[var(--color-ink)] font-body'
                          : 'bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)] font-body'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendUserMessage} className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)]">
          <div className="max-w-3xl mx-auto relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendUserMessage();
                }
              }}
              placeholder="State a dilemma for the Council to debate..."
              rows={2}
              className="w-full pr-12 pl-4 py-3 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)] resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() && !isStreaming}
              aria-label="Send message to Council"
              className="absolute right-3 p-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
