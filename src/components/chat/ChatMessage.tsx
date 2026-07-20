import React, { useState, useEffect } from 'react';
import { Bot, User, AlertCircle, RefreshCw, Edit2, Check, X, File as FileIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../lib/schemas/message';
import type { Attachment } from '../../lib/schemas/attachment';
import { attachmentRepository } from '../../lib/db/repositories/attachment';
import { personaRepository } from '../../lib/db/repositories/persona';
import type { LocalPersona } from '../../lib/schemas/persona';
import { cn } from '../../lib/utils';
import type { AssistantState } from '../../lib/hooks/useChatStream';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
  assistantState: AssistantState;
  onRetry?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void;
}

export function ChatMessage({ message, isLast, assistantState, onRetry, onEdit, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [persona, setPersona] = useState<LocalPersona | null>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        const loadedAttachments = await attachmentRepository.getForMessage(message.id);
        setAttachments(loadedAttachments);
        if (message.personaId) {
          const loadedPersona = await personaRepository.get(message.personaId);
          setPersona(loadedPersona || null);
        }
      } catch (err) {
        console.error('Failed to load data for message', err);
      }
    }
    loadData();
  }, [message.id, message.personaId]);
  
  // Only the last assistant message shows the active generating state
  const isGenerating = !isUser && isLast && assistantState === 'generating';
  const isFailed = !isUser && isLast && assistantState === 'failed';
  const isCancelled = !isUser && isLast && assistantState === 'cancelled';
  const isCompletedAssistant = !isUser && !isGenerating && !isFailed && !isCancelled;

  const handleEditSave = () => {
    if (editContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    if (window.confirm('Editing this message will create a new branch and discard subsequent messages. Are you sure?')) {
      onEdit?.(message.id, editContent);
      setIsEditing(false);
    }
  };

  const handleRegenerate = () => {
    if (window.confirm('Regenerating this message will create a new branch and discard subsequent messages. Are you sure?')) {
      onRegenerate?.(message.id);
    }
  };

  return (
    <div className={cn(
      "flex w-full py-4 px-4 sm:px-6 md:px-8 group",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex w-full max-w-[80%] space-x-3",
        isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className="flex-shrink-0 mt-auto mb-1">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600">
              {persona?.avatar ? (
                <img src={persona.avatar} alt={persona?.name || 'Persona'} className="w-full h-full object-cover" />
              ) : (
                <Bot size={18} />
              )}
            </div>
          )}
        </div>
        
        <div className={cn(
          "flex flex-col min-w-0 relative",
          isUser ? "items-end" : "items-start"
        )}>
          {/* Persona Name */}
          {!isUser && persona && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1">{persona.name}</div>
          )}

          {/* Bubble Content */}
          <div className={cn(
            "p-3 rounded-2xl relative max-w-full",
            isUser 
              ? "bg-blue-600 text-white rounded-br-sm shadow-sm" 
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700 shadow-sm"
          )}>
            {isEditing ? (
              <div className="flex flex-col space-y-2 min-w-[250px] w-full">
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={cn(
                    "w-full p-2 border rounded-md focus:outline-none focus:ring-2 min-h-[100px] resize-y",
                    isUser 
                      ? "bg-blue-700 border-blue-500 text-white placeholder-blue-300 focus:ring-white" 
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                  )}
                />
                <div className="flex space-x-2">
                  <button onClick={handleEditSave} className={cn(
                    "flex items-center px-3 py-1 rounded text-sm font-medium",
                    isUser ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"
                  )}>
                    <Check size={16} className="mr-1" /> Save
                  </button>
                  <button onClick={() => { setIsEditing(false); setEditContent(message.content); }} className={cn(
                    "flex items-center px-3 py-1 rounded text-sm font-medium",
                    isUser ? "bg-blue-800 text-white hover:bg-blue-900" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}>
                    <X size={16} className="mr-1" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!isEditing && attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map(att => {
                      const isImage = att.mimeType.startsWith('image/');
                      const dataUrl = att.data instanceof File || att.data instanceof Blob 
                        ? URL.createObjectURL(att.data) 
                        : (typeof att.data === 'string' ? att.data : null);

                      return (
                        <div key={att.id} className={cn(
                          "flex items-center border rounded-lg p-2 shadow-sm max-w-[200px]",
                          isUser ? "bg-blue-700 border-blue-500" : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                        )}>
                          {isImage && dataUrl ? (
                            <div className="w-8 h-8 mr-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              <img src={dataUrl} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <FileIcon size={24} className={cn("mr-2 flex-shrink-0", isUser ? "text-blue-200" : "text-gray-500")} />
                          )}
                          <span className={cn("text-xs truncate w-full", isUser ? "text-blue-50" : "text-gray-700 dark:text-gray-300")} title={att.name}>
                            {att.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className={cn(
                  "prose prose-sm md:prose-base max-w-none break-words",
                  isUser ? "prose-invert text-white" : "dark:prose-invert"
                )}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" aria-hidden="true" />
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Status indicators and action buttons */}
          <div className={cn(
            "flex items-center mt-1 space-x-2 text-xs",
            isUser ? "flex-row-reverse space-x-reverse text-gray-500" : "flex-row text-gray-500"
          )}>
            {isFailed && (
              <div className="flex items-center text-red-600 dark:text-red-400">
                <AlertCircle size={14} className="mr-1" />
                <span>Failed</span>
                {onRetry && (
                  <button onClick={() => onRetry(message.id)} className="ml-2 hover:underline">Retry</button>
                )}
              </div>
            )}
            
            {isCancelled && (
              <div className="flex items-center text-amber-600 dark:text-amber-500">
                <span>Cancelled</span>
                {onRetry && (
                  <button onClick={() => onRetry(message.id)} className="ml-2 hover:underline">Retry</button>
                )}
              </div>
            )}

            {!isEditing && (
              <div className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1",
                isUser ? "mr-2" : "ml-2"
              )}>
                {isUser && onEdit && (
                  <button onClick={() => setIsEditing(true)} className="p-1 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" title="Edit Message">
                    <Edit2 size={14} />
                  </button>
                )}
                {isCompletedAssistant && onRegenerate && (
                  <button onClick={handleRegenerate} className="p-1 hover:text-purple-600 dark:hover:text-purple-400 rounded transition-colors" title="Regenerate Response">
                    <RefreshCw size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
