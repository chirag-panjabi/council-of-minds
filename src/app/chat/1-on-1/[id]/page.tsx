'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { ChatMessage, Persona } from '@/types';
import { Send, Square, ChevronDown, ChevronRight, User, Brain, Paperclip } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 05-workbench · theme: studio · nav: N5 · footer: Ft2 */

export default function OneOnOneChatPage() {
  const params = useParams();
  const chatId = params?.id as string;

  const chatSession = useLiveQuery(() => db.chats.get(chatId), [chatId]);
  const messages = useLiveQuery(() => db.messages.where('chatId').equals(chatId).sortBy('timestamp'), [chatId]) || [];
  const persona = useLiveQuery(
    () => (chatSession?.personaId ? db.personas.get(chatSession.personaId) : undefined),
    [chatSession]
  );

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoningIds((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming || !persona) return;

    const userContent = input.trim();
    setInput('');

    // Save user message to Dexie
    const userMsgId = 'msg-' + Date.now();
    await db.messages.add({
      id: userMsgId,
      chatId,
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
    });

    // Update chat session timestamp
    await db.chats.update(chatId, { updatedAt: Date.now() });

    // Prepare streaming assistant response
    setIsStreaming(true);
    const assistantMsgId = 'msg-' + (Date.now() + 1);

    await db.messages.add({
      id: assistantMsgId,
      chatId,
      personaId: persona.id,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
    });

    try {
      const provider = 'openai';
      const apiKey = localStorage.getItem(`framework-engine:api-key:${provider}`) || '';

      const apiMessages = [...messages, { role: 'user', content: userContent }].map((m) => ({
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
          model: persona.defaultModel || 'gpt-4o',
          systemPrompt: persona.systemPrompt,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
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

          // Check if chunk contains reasoning tokens <think>...</think>
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
        content: `Error: ${err.message || 'Failed to generate response.'}`,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Shell>
      <div className="flex flex-col h-screen bg-[var(--color-paper)]">
        {/* Header Bar */}
        <header className="px-6 py-3 border-b border-[var(--color-border-hairline)] bg-[var(--color-paper-2)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] flex items-center justify-center font-display text-sm text-[var(--color-accent)] font-semibold">
              {persona?.name.charAt(0) || 'P'}
            </div>
            <div>
              <div className="font-display text-lg text-[var(--color-ink)]">{persona?.name || '1-on-1 Session'}</div>
              <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">{persona?.role} • Model: {persona?.defaultModel}</div>
            </div>
          </div>

          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
            1-on-1 Workbench
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3">
              <Brain className="w-10 h-10 text-[var(--color-accent)] opacity-60" />
              <h2 className="font-display text-2xl text-[var(--color-ink)]">Begin Dialogue with {persona?.name}</h2>
              <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
                State your dilemma, question, or scenario below to receive structured analytical reflection.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
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
                  {msg.role === 'user' ? 'U' : persona?.name.charAt(0) || 'A'}
                </div>

                <div className={`space-y-2 flex-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {/* Persona Label */}
                  <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                    {msg.role === 'user' ? 'You' : persona?.name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Expandable Reasoning Accordion (<think> tokens) */}
                  {msg.reasoning && (
                    <div className="think-accordion my-2 text-left">
                      <button
                        type="button"
                        onClick={() => toggleReasoning(msg.id)}
                        aria-expanded={Boolean(expandedReasoningIds[msg.id])}
                        aria-label="Toggle persona reasoning process"
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

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-[var(--radius-md)] text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-ink)] text-[var(--color-paper)] inline-block text-left'
                        : 'bg-[var(--color-paper-2)] border border-[var(--color-border)] text-[var(--color-ink)]'
                    }`}
                  >
                    {msg.content || (isStreaming && msg.role === 'assistant' ? 'Contemplating response...' : '')}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Morphing Send/Stop Button */}
        <form onSubmit={handleSend} className="p-4 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper-2)]">
          <div className="max-w-3xl mx-auto relative flex items-center">
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
              type="submit"
              disabled={!input.trim() && !isStreaming}
              aria-label={isStreaming ? 'Stop generation' : 'Send message'}
              className="absolute right-3 p-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isStreaming ? <Square className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
