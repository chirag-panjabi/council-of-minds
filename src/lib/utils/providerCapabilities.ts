export type ModelProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

export interface ModelCapability {
  modelId: string;
  provider: ModelProvider;
  displayName: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsSystemPrompt: boolean;
  maxContextTokens: number;
  maxOutputTokens: number;
  recommendedUse: string;
}

export const KNOWN_CAPABILITIES: Record<string, Partial<ModelCapability>> = {
  // OpenAI
  'gpt-4o': {
    displayName: 'GPT-4o',
    provider: 'openai',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 128000,
    maxOutputTokens: 4096,
    recommendedUse: 'Flagship Multimodal & Code',
  },
  'gpt-4o-mini': {
    displayName: 'GPT-4o Mini',
    provider: 'openai',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 128000,
    maxOutputTokens: 4096,
    recommendedUse: 'Fast Low-Latency Dialogue',
  },
  'o3-mini': {
    displayName: 'o3-mini',
    provider: 'openai',
    supportsVision: false,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 200000,
    maxOutputTokens: 100000,
    recommendedUse: 'STEM & Complex Reasoning',
  },

  // Anthropic
  'claude-3-7-sonnet-20250219': {
    displayName: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    recommendedUse: 'Hybrid Reasoning & Coding',
  },
  'claude-3-5-sonnet-20241022': {
    displayName: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    recommendedUse: 'Complex Analysis & Writing',
  },
  'claude-3-5-haiku-20241022': {
    displayName: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    supportsVision: false,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 200000,
    maxOutputTokens: 8192,
    recommendedUse: 'High-Speed Processing',
  },

  // Gemini
  'gemini-2.5-flash': {
    displayName: 'Gemini 2.5 Flash',
    provider: 'gemini',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 1000000,
    maxOutputTokens: 8192,
    recommendedUse: '1M Token Multimodal Speed',
  },
  'gemini-2.0-flash': {
    displayName: 'Gemini 2.0 Flash',
    provider: 'gemini',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 1000000,
    maxOutputTokens: 8192,
    recommendedUse: '1M Context Live Stream',
  },
  'gemini-1.5-pro': {
    displayName: 'Gemini 1.5 Pro',
    provider: 'gemini',
    supportsVision: true,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 2000000,
    maxOutputTokens: 8192,
    recommendedUse: '2M Long-Context Deep Synthesis',
  },

  // Ollama
  'llama3:latest': {
    displayName: 'Llama 3 (Ollama)',
    provider: 'ollama',
    supportsVision: false,
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 8192,
    maxOutputTokens: 4096,
    recommendedUse: 'Local Private Inference',
  },
};

export function getModelCapability(modelId: string, provider: ModelProvider = 'openai'): ModelCapability {
  const known = KNOWN_CAPABILITIES[modelId];

  if (known) {
    return {
      modelId,
      provider: known.provider || provider,
      displayName: known.displayName || modelId,
      supportsVision: known.supportsVision ?? false,
      supportsStreaming: known.supportsStreaming ?? true,
      supportsSystemPrompt: known.supportsSystemPrompt ?? true,
      maxContextTokens: known.maxContextTokens || 32000,
      maxOutputTokens: known.maxOutputTokens || 4096,
      recommendedUse: known.recommendedUse || 'General Conversation',
    };
  }

  return {
    modelId,
    provider,
    displayName: modelId,
    supportsVision: modelId.toLowerCase().includes('vision') || modelId.toLowerCase().includes('4o'),
    supportsStreaming: true,
    supportsSystemPrompt: true,
    maxContextTokens: 32000,
    maxOutputTokens: 4096,
    recommendedUse: 'Custom Provider Model',
  };
}

export interface CouncilCostEstimate {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  isLocal: boolean;
}

export function calculateCouncilCostAndTokens(
  debaterCount: number,
  turnsCap: number,
  modelId: string,
  provider: ModelProvider = 'openai'
): CouncilCostEstimate {
  if (provider === 'ollama') {
    return {
      estimatedInputTokens: debaterCount * turnsCap * 600,
      estimatedOutputTokens: debaterCount * turnsCap * 350,
      totalTokens: debaterCount * turnsCap * 950,
      estimatedCostUsd: 0,
      isLocal: true,
    };
  }

  // Estimated per-turn token averages
  const estInput = Math.max(1, debaterCount) * Math.max(1, turnsCap) * 750;
  const estOutput = Math.max(1, debaterCount) * Math.max(1, turnsCap) * 350;
  const totalTokens = estInput + estOutput;

  // Rate per 1k tokens (input / output)
  let inputRatePer1k = 0.0025; // default gpt-4o ($2.50 / 1M)
  let outputRatePer1k = 0.01; // default gpt-4o ($10.00 / 1M)

  if (modelId.includes('mini') || modelId.includes('haiku') || modelId.includes('flash')) {
    inputRatePer1k = 0.00015;
    outputRatePer1k = 0.0006;
  } else if (modelId.includes('claude-3-7') || modelId.includes('claude-3-5-sonnet') || modelId.includes('gpt-4o')) {
    inputRatePer1k = 0.003;
    outputRatePer1k = 0.015;
  }

  const cost = (estInput / 1000) * inputRatePer1k + (estOutput / 1000) * outputRatePer1k;

  return {
    estimatedInputTokens: estInput,
    estimatedOutputTokens: estOutput,
    totalTokens,
    estimatedCostUsd: Number(cost.toFixed(4)),
    isLocal: false,
  };
}
