import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, X, File as FileIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AssistantState } from '../../lib/hooks/useChatStream';
import type { ProviderCapability } from '../../lib/schemas/provider';

interface ChatComposerProps {
  onSend: (content: string, attachments: File[]) => void;
  onCancel: () => void;
  assistantState: AssistantState;
  disabled?: boolean;
  providerCapabilities?: ProviderCapability;
}

export function ChatComposer({ onSend, onCancel, assistantState, disabled, providerCapabilities }: ChatComposerProps) {
  const [content, setContent] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isGenerating = assistantState === 'generating';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if ((!trimmed && stagedAttachments.length === 0) || isGenerating || disabled) return;
    
    onSend(trimmed, stagedAttachments);
    setContent('');
    setStagedAttachments([]);
    setAttachmentError(null);
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    
    // Check total count limit
    if (stagedAttachments.length + files.length > 5) {
      setAttachmentError('Maximum of 5 attachments allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check size and type
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_SIZE) {
        setAttachmentError(`File ${file.name} exceeds the 10MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const isImage = file.type.startsWith('image/');
      if (isImage && !providerCapabilities?.capabilities?.imageInput) {
        setAttachmentError(`The selected provider does not support image attachments.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (!isImage && !providerCapabilities?.capabilities?.attachmentExtraction) {
        setAttachmentError(`The selected provider does not support document attachments.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      validFiles.push(file);
    }

    setStagedAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setStagedAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center">
      
      {attachmentError && (
        <div className="max-w-3xl w-full mb-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
          {attachmentError}
        </div>
      )}

      {stagedAttachments.length > 0 && (
        <div className="max-w-3xl w-full mb-3 flex flex-wrap gap-2">
          {stagedAttachments.map((file, i) => (
            <div key={i} className="relative group flex items-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 pr-8 shadow-sm max-w-[200px]">
              {file.type.startsWith('image/') ? (
                <div className="w-8 h-8 mr-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <FileIcon size={24} className="text-gray-500 mr-2 flex-shrink-0" />
              )}
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate w-full">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-3xl w-full relative flex items-end shadow-sm border border-gray-300 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf,text/plain,text/csv,text/markdown"
          disabled={disabled || isGenerating}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isGenerating}
          className="p-3 text-gray-400 hover:text-blue-500 disabled:opacity-50 focus:outline-none transition-colors"
          aria-label="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isGenerating}
          placeholder="Message..."
          className={cn(
            "w-full max-h-[200px] py-3 pl-2 pr-12 bg-transparent resize-none focus:outline-none",
            "text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          )}
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2">
          {isGenerating ? (
            <button
              onClick={onCancel}
              aria-label="Stop generating"
              className="p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={(!content.trim() && stagedAttachments.length === 0) || disabled}
              aria-label="Send message"
              className={cn(
                "p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                (content.trim() || stagedAttachments.length > 0) && !disabled
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="max-w-3xl mx-auto text-center mt-2 w-full">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          AI can make mistakes. Consider verifying important information.
        </p>
        {stagedAttachments.length > 0 && providerCapabilities && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            Files will be transmitted to {providerCapabilities.name}.
          </p>
        )}
      </div>
    </div>
  );
}
