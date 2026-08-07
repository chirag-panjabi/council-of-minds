export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter' | 'mock';

export interface PersonaRevision {
  id: string;
  version: number;
  systemPrompt: string;
  role: string;
  description: string;
  recommendedModel?: string;
  updatedAt: number;
  changeNote?: string;
}

export interface PersonaRule {
  id: string;
  category: 'Tone' | 'Style' | 'Taboo' | 'Formatting' | string;
  content: string;
  enabled?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  description: string;
  systemPrompt: string;
  advancedRules?: PersonaRule[];
  recommendedModel?: string;
  tags: string[];
  isArchived: boolean;
  isSystem?: boolean;
  isCustom?: boolean;
  isFavorite?: boolean;
  welcomeMessage?: string;
  uiColor?: string;
  voiceId?: string;
  version?: number;
  revisionHistory?: PersonaRevision[];
  createdAt: number;
  updatedAt?: number;
}

export interface PersonaGroup {
  id: string;
  name: string;
  description: string;
  personaIds: string[];
  chairmanPersonaId?: string;
  skepticPersonaId?: string;
  synthesizerPersonaId?: string;
  roleAssignments?: Record<string, 'chairman' | 'skeptic' | 'synthesizer' | 'member'>;
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
  turnExecutionMode?: 'round_robin' | 'dynamic_moderator' | 'free_dialectic';
  autoPilotCap?: number;
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
  model?: string;
  timestamp: number;
  isError?: boolean;
  errorDetails?: string; // Collapsible raw diagnostic JSON or stack trace
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
