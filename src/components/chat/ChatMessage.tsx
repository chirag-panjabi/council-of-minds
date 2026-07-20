import React, { useState, useEffect } from 'react';
import { Bot, User, AlertCircle, RefreshCw, Edit2, Check, X, File as FileIcon } from 'lucide-react';
import type { Message } from '../../lib/schemas/message';
import type { Attachment } from '../../lib/schemas/attachment';
import { attachmentRepository } from '../../lib/db/repositories/attachment';
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
  
  useEffect(() => {
    async function loadAttachments() {
      try {
        const loaded = await attachmentRepository.getForMessage(message.id);
        setAttachments(loaded);
      } catch (err) {
        console.error('Failed to load attachments', err);
      }
    }
    loadAttachments();
  }, [message.id]);
  
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
      isUser ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"
    )}>
      <div className="flex max-w-3xl mx-auto w-full space-x-4">
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg flex items-center justify-center">
              <User size={18} />
            </div>
          ) : (
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 rounded-lg flex items-center justify-center">
              <Bot size={18} />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 space-y-2 relative">
          {isEditing ? (
            <div className="flex flex-col space-y-2">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
              />
              <div className="flex space-x-2">
                <button onClick={handleEditSave} className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  <Check size={16} className="mr-1" /> Save
                </button>
                <button onClick={() => { setIsEditing(false); setEditContent(message.content); }} className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">
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
                      <div key={att.id} className="flex items-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm max-w-[200px]">
                        {isImage && dataUrl ? (
                          <div className="w-8 h-8 mr-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                            <img src={dataUrl} alt={att.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <FileIcon size={24} className="text-gray-500 mr-2 flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-full" title={att.name}>
                          {att.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none break-words whitespace-pre-wrap">
                {message.content}
                {isGenerating && (
                  <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" aria-hidden="true" />
                )}
              </div>
            </>
          )}
          
          {isFailed && (
            <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={16} className="mr-1" />
              <span>Message generation failed.</span>
              {onRetry && (
                <button 
                  onClick={() => onRetry(message.id)}
                  className="ml-4 flex items-center hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-1"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Retry
                </button>
              )}
            </div>
          )}
          
          {isCancelled && (
            <div className="flex items-center mt-2 text-sm text-amber-600 dark:text-amber-400">
              <span>Generation cancelled.</span>
              {onRetry && (
                <button 
                  onClick={() => onRetry(message.id)}
                  className="ml-4 flex items-center hover:underline focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-1"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Retry
                </button>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-md p-1 flex space-x-1">
              {isUser && onEdit && (
                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Edit Message">
                  <Edit2 size={14} />
                </button>
              )}
              {isCompletedAssistant && onRegenerate && (
                <button onClick={handleRegenerate} className="p-1 text-gray-500 hover:text-purple-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded" title="Regenerate Response">
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
