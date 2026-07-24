import type { ChatMessage } from '@/types';

export type ContextRetentionStrategy = 'stateless' | 'summary' | 'hybrid' | 'infinite';

export interface RetentionResult {
  systemPrompt: string;
  messages: ChatMessage[];
}

/**
 * Builds the message history and system prompt directive based on the selected context retention strategy.
 */
export function buildMessagesForRetention(
  messages: ChatMessage[],
  strategy: ContextRetentionStrategy = 'hybrid',
  baseSystemPrompt: string = ''
): RetentionResult {
  if (messages.length === 0) {
    return { systemPrompt: baseSystemPrompt, messages: [] };
  }

  switch (strategy) {
    case 'stateless': {
      // Send ONLY the latest user message or current turn prompt
      return {
        systemPrompt: baseSystemPrompt,
        messages: messages.slice(-1),
      };
    }

    case 'summary': {
      // Keep only recent 6 turns
      return {
        systemPrompt: baseSystemPrompt,
        messages: messages.slice(-6),
      };
    }

    case 'hybrid': {
      // If conversation exceeds 6 messages, synthesize older history into system prompt summary block
      if (messages.length <= 6) {
        return {
          systemPrompt: baseSystemPrompt,
          messages,
        };
      }

      const olderMessages = messages.slice(0, messages.length - 6);
      const recentMessages = messages.slice(-6);

      const summaryText = olderMessages
        .map((m) => {
          const roleLabel = m.role === 'user' ? 'User' : 'Debater';
          return `- ${roleLabel}: ${m.content.slice(0, 150).replace(/\n/g, ' ')}`;
        })
        .join('\n');

      const updatedSystemPrompt = `${baseSystemPrompt}\n\n--- PRIOR CONVERSATION RECAP (HYBRID CONTEXT) ---\n${summaryText}\n-----------------------------------------------`;

      return {
        systemPrompt: updatedSystemPrompt,
        messages: recentMessages,
      };
    }

    case 'infinite':
    default: {
      // Preserve full conversation history (relying on model context window truncation)
      return {
        systemPrompt: baseSystemPrompt,
        messages,
      };
    }
  }
}
