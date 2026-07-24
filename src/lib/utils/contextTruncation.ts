export const MODEL_TOKEN_LIMITS: Record<string, number> = {
  // OpenAI
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'o3-mini': 200000,
  'o1': 200000,
  'gpt-3.5-turbo': 16385,

  // Anthropic
  'claude-3-7-sonnet-20250219': 200000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-5-haiku-20241022': 200000,
  'claude-3-opus-20240229': 200000,

  // Gemini
  'gemini-2.5-flash': 1000000,
  'gemini-2.0-flash': 1000000,
  'gemini-1.5-pro': 2000000,
  'gemini-1.5-flash': 1000000,

  // Local / Ollama
  'ollama-local': 8192,
  'llama3': 8192,
  'mistral': 8192,
};

/**
 * Estimates token count using standard 4 characters per token heuristic.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export interface ChatMessagePayload {
  role: string;
  content: string;
  [key: string]: any;
}

/**
 * Truncates oldest middle messages if total estimated tokens exceed target model budget.
 * Always preserves systemPrompt and latest user message.
 */
export function truncateMessagesForModel(
  messages: ChatMessagePayload[],
  model: string,
  systemPrompt?: string,
  maxOutputTokens = 4096
): ChatMessagePayload[] {
  if (!messages || messages.length === 0) return [];

  const maxModelWindow = MODEL_TOKEN_LIMITS[model] || 32000;
  // Reserve ~15% safety margin + maxOutputTokens for model response
  const targetBudget = Math.floor(maxModelWindow * 0.85) - maxOutputTokens;

  let systemTokens = systemPrompt ? estimateTokenCount(systemPrompt) : 0;
  let currentTotalTokens = systemTokens + messages.reduce((acc, m) => acc + estimateTokenCount(m.content), 0);

  if (currentTotalTokens <= targetBudget || messages.length <= 2) {
    return messages;
  }

  // Preserve latest message
  const lastMessage = messages[messages.length - 1];
  let trimmedMiddle = [...messages.slice(0, messages.length - 1)];
  let prunedCount = 0;

  while (trimmedMiddle.length > 0) {
    const candidateTokens =
      systemTokens +
      estimateTokenCount(lastMessage.content) +
      trimmedMiddle.reduce((acc, m) => acc + estimateTokenCount(m.content), 0) +
      50; // buffer for notice marker

    if (candidateTokens <= targetBudget) {
      break;
    }

    // Drop oldest middle message
    trimmedMiddle.shift();
    prunedCount++;
  }

  if (prunedCount > 0) {
    const noticeMessage: ChatMessagePayload = {
      role: 'system',
      content: `[System Notice: ${prunedCount} earlier message(s) truncated to fit model context window limit.]`,
    };
    return [...trimmedMiddle, noticeMessage, lastMessage];
  }

  return [...trimmedMiddle, lastMessage];
}
