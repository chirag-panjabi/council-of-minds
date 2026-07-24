'use client';

import { useState } from 'react';
import type { ChatMessage, Persona } from '@/types';
import { Copy, Check, RotateCcw, Edit2, Brain, ChevronDown, ChevronRight, Sparkles, AlertTriangle, Key, Terminal } from 'lucide-react';

interface ChatMessageItemProps {
  message: ChatMessage;
  persona?: Persona;
  isIncognito?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
}

interface ParsedApiError {
  title: string;
  description: string;
  rawPayload: string;
}

function parseApiError(content: string, details?: string): ParsedApiError {
  const combined = `${content} ${details || ''}`;
  let jsonObj: any = null;

  // Try extracting JSON object
  const match = combined.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      jsonObj = JSON.parse(match[0]);
    } catch {}
  }

  let formattedRaw = details || content;
  if (jsonObj) {
    try {
      formattedRaw = JSON.stringify(jsonObj, null, 2);
    } catch {}
  }

  // 1. Quota / Rate Limit (HTTP 429)
  if (combined.includes('429') || combined.includes('Quota exceeded') || combined.includes('RESOURCE_EXHAUSTED')) {
    let cleanMsg = 'Your provider free-tier request limit has been reached for this model.';
    if (jsonObj?.error?.message) {
      let rawMsg = jsonObj.error.message;
      if (rawMsg.includes('\n')) rawMsg = rawMsg.split('\n')[0];
      rawMsg = rawMsg.replace(/Quota exceeded for metric:[\s\S]*/, '').trim();
      if (rawMsg) cleanMsg = rawMsg;
    }
    return {
      title: 'Provider Quota Exceeded (HTTP 429)',
      description: cleanMsg,
      rawPayload: formattedRaw,
    };
  }

  // 2. Auth Failure (HTTP 401)
  if (combined.includes('401') || combined.includes('Missing API Key') || combined.includes('Invalid Key')) {
    return {
      title: 'Authentication Failed (HTTP 401)',
      description: 'Invalid or missing API key. Please check your provider key configuration in Settings.',
      rawPayload: formattedRaw,
    };
  }

  // 3. General Transport Error
  let cleanDesc = content.replace(/^Error:\s*/, '');
  if (cleanDesc.includes('{')) {
    cleanDesc = 'An unexpected error occurred while communicating with the model provider API.';
  }

  return {
    title: 'Upstream Transport Error',
    description: cleanDesc,
    rawPayload: formattedRaw,
  };
}

export function ChatMessageItem({
  message,
  persona,
  isIncognito,
  onEdit,
  onRegenerate,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';
  const isErrorState = message.isError || message.content.startsWith('Error:');
  const timestampStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  if (isErrorState) {
    const errorInfo = parseApiError(message.content, message.errorDetails);

    return (
      <div className="w-full max-w-3xl my-4 p-4 bg-[var(--color-paper-2)] border-l-4 border-[var(--color-warning)] border-y border-r border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-3 shadow-xs font-body">
        {/* Error Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--color-warning)] font-mono text-[10px] font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[var(--color-warning)]" />
            <span>System Event • Provider API Error</span>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-ink-muted)]">{timestampStr}</span>
        </div>

        {/* Clean Human Title & Description */}
        <div className="space-y-1">
          <h4 className="font-display text-sm font-semibold text-[var(--color-ink)]">
            {errorInfo.title}
          </h4>
          <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed font-body">
            {errorInfo.description}
          </p>
        </div>

        {/* Technical Diagnostics Accordion */}
        <div className="border border-[var(--color-border-hairline)] rounded overflow-hidden bg-[var(--color-paper)]">
          <button
            type="button"
            onClick={() => setShowReasoning(!showReasoning)}
            className="w-full px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-[var(--color-warning)]" />
              <span>Technical Diagnostics Payload</span>
            </div>
            {showReasoning ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {showReasoning && (
            <pre className="p-3 text-[10px] font-mono text-[var(--color-ink-muted)] whitespace-pre-wrap overflow-x-auto border-t border-[var(--color-border-hairline)] bg-black/5 leading-relaxed max-h-60">
              {errorInfo.rawPayload}
            </pre>
          )}
        </div>

        {/* 1-Click Action Recovery Chips */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <a
            href="/settings"
            className="flex items-center gap-1 px-2.5 py-1 bg-[var(--color-paper)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded text-[10px] font-mono text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors"
          >
            <Key className="w-3 h-3 text-[var(--color-accent)]" />
            <span>Manage API Keys</span>
          </a>

          {onRegenerate && (
            <button
              onClick={() => onRegenerate(message.id)}
              className="flex items-center gap-1 px-2.5 py-1 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90 rounded text-[10px] font-mono font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry Turn</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Helper to render markdown formatting cleanly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentCodeBlock: string[] | null = null;
    let codeLanguage = '';

    lines.forEach((line, idx) => {
      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (currentCodeBlock !== null) {
          // Close code block
          const codeContent = currentCodeBlock.join('\n');
          elements.push(
            <CodeBlock key={`code-${idx}`} code={codeContent} language={codeLanguage} />
          );
          currentCodeBlock = null;
          codeLanguage = '';
        } else {
          // Open code block
          currentCodeBlock = [];
          codeLanguage = line.trim().slice(3).trim();
        }
        return;
      }

      if (currentCodeBlock !== null) {
        currentCodeBlock.push(line);
        return;
      }

      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={`empty-${idx}`} className="h-2" />);
        return;
      }

      // Headings
      if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${idx}`} className="font-display text-sm text-[var(--color-ink)] font-semibold mt-3 mb-1">
            {formatInlineText(trimmed.slice(5))}
          </h4>
        );
      } else if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${idx}`} className="font-display text-base text-[var(--color-ink)] font-semibold mt-4 mb-1.5 border-b border-[var(--color-border-hairline)] pb-1">
            {formatInlineText(trimmed.slice(4))}
          </h3>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${idx}`} className="font-display text-lg text-[var(--color-ink)] font-bold mt-5 mb-2 border-b border-[var(--color-border-hairline)] pb-1">
            {formatInlineText(trimmed.slice(3))}
          </h2>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${idx}`} className="font-display text-xl text-[var(--color-ink)] font-bold mt-6 mb-2">
            {formatInlineText(trimmed.slice(2))}
          </h1>
        );
      } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <div key={`li-${idx}`} className="flex items-start gap-2 my-1 pl-2 text-sm text-[var(--color-ink)]">
            <span className="text-[var(--color-accent)] mt-1">•</span>
            <span>{formatInlineText(trimmed.slice(2))}</span>
          </div>
        );
      } else {
        elements.push(
          <p key={`p-${idx}`} className="text-sm leading-relaxed text-[var(--color-ink)] my-1.5">
            {formatInlineText(line)}
          </p>
        );
      }
    });

    if (currentCodeBlock) {
      const remainingCode = (currentCodeBlock as string[]).join('\n');
      elements.push(
        <CodeBlock key={`code-end`} code={remainingCode} language={codeLanguage} />
      );
    }

    return elements;
  };

  // Helper for inline formatting and stripping raw asterisks artifacts
  const formatInlineText = (text: string) => {
    let clean = text.replace(/\*\*\*(.*?)\*\*\*/g, '<b><i>$1</i></b>');
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    clean = clean.replace(/\*(.*?)\*/g, '<i>$1</i>');
    clean = clean.replace(/`([^`]+)`/g, '<code class="font-mono text-xs bg-[var(--color-paper-3)] border border-[var(--color-border-hairline)] px-1.5 py-0.5 rounded">$1</code>');

    return <span dangerouslySetInnerHTML={{ __html: clean }} />;
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-4 group">
        <div className="flex items-center gap-2 mb-1 pr-1 font-mono text-[10px] text-[var(--color-ink-muted)]">
          <span>YOU</span>
          <span>•</span>
          <span>{timestampStr}</span>
        </div>
        <div className="max-w-[75%] bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] rounded-tr-xs p-4 text-[var(--color-ink)] shadow-xs relative">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded p-2 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
              />
              <div className="flex items-center justify-end gap-2 text-xs font-mono">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded bg-[var(--color-paper)] border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-2.5 py-1 rounded bg-[var(--color-accent)] text-white font-medium"
                >
                  Save & Resubmit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
          )}

          {/* Action Toolbar on Hover */}
          {!isEditing && onEdit && (
            <div className="absolute -bottom-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-paper)] border border-[var(--color-border)] rounded px-1.5 py-0.5 flex items-center gap-1 shadow-xs">
              <button
                onClick={() => setIsEditing(true)}
                title="Edit message"
                className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Response (Persona)
  return (
    <div className="flex flex-col items-start my-6 group">
      {/* Persona Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/40 flex items-center justify-center font-display text-sm text-[var(--color-accent)] font-semibold shrink-0">
          {persona?.name.charAt(0) || 'A'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-base text-[var(--color-ink)] font-semibold">
              {persona?.name || 'Assistant'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-ink-muted)]">
            <span>{persona?.role || 'AI Persona'}</span>
            <span>•</span>
            <span>{timestampStr}</span>
          </div>
        </div>
      </div>

      {/* Persona Content Box with Left Accent Line */}
      <div className="w-full pl-4 border-l-2 border-[var(--color-accent)] space-y-3">
        {/* Reasoning Accordion (<think> tokens) */}
        {message.reasoning && (
          <div className="bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] overflow-hidden">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full px-3 py-2 flex items-center justify-between text-xs font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-[var(--color-accent)] animate-pulse" />
                <span>Thought Process</span>
              </div>
              {showReasoning ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showReasoning && (
              <div className="p-3 border-t border-[var(--color-border-hairline)] bg-[var(--color-paper)] text-xs font-mono text-[var(--color-ink-muted)] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {message.reasoning}
              </div>
            )}
          </div>
        )}

        {/* Message Main Body */}
        <div className="text-sm text-[var(--color-ink)] space-y-2">
          {renderFormattedText(message.content)}
        </div>

        {/* Action Toolbar on Hover */}
        <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy response"
            className="flex items-center gap-1 px-2 py-1 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onRegenerate && (
            <button
              onClick={() => onRegenerate(message.id)}
              title="Regenerate response"
              className="flex items-center gap-1 px-2 py-1 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-border)] rounded text-[10px] font-mono text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Code Block Sub-component with Copy Button
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-paper-2)]">
      <div className="px-3 py-1.5 bg-[var(--color-paper-3)] border-b border-[var(--color-border-hairline)] flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-[var(--color-success)]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-[var(--color-ink)] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
