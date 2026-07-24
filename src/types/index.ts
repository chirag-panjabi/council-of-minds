export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface Persona {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  description: string;
  systemPrompt: string;
  defaultModel?: string;
  tags: string[];
  isArchived: boolean;
  voiceId?: string;
  createdAt: number;
}

export interface PersonaGroup {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  synthesizerPersonaId?: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  type: '1-on-1' | 'council';
  groupId?: string;
  personaId?: string;
  personaIds?: string[];
  synthesizerId?: string;
  modelOverride?: string;
  contextRetention?: 'stateless' | 'summary' | 'hybrid' | 'infinite';
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  personaId?: string; // Null if user message
  role: 'user' | 'assistant' | 'system' | 'synthesizer';
  content: string;
  reasoning?: string; // Separated raw reasoning tokens (<think>...</think>)
  timestamp: number;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  name: string;
  type: string;
  size: number;
  data: string; // Base64 url string or blob preview
  createdAt: number;
}

export interface UsageRecord {
  id: string;
  chatId: string;
  personaId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  timestamp: number;
}
