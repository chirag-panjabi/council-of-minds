import { ProviderCapability, ProviderId } from '../schemas/provider';

const providers: Record<ProviderId, ProviderCapability> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    capabilities: {
      transport: 'cloud-proxy',
      modelDiscovery: 'api',
      textStreaming: true,
      imageInput: true,
      attachmentExtraction: false,
      outputTokenControl: true,
      validationStrategy: 'openai',
      errorMapping: true,
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    capabilities: {
      transport: 'cloud-proxy',
      modelDiscovery: 'hardcoded',
      textStreaming: true,
      imageInput: true,
      attachmentExtraction: false,
      outputTokenControl: true,
      validationStrategy: 'anthropic',
      errorMapping: true,
    },
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    capabilities: {
      transport: 'cloud-proxy',
      modelDiscovery: 'api',
      textStreaming: true,
      imageInput: true,
      attachmentExtraction: false,
      outputTokenControl: true,
      validationStrategy: 'gemini',
      errorMapping: true,
    },
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    capabilities: {
      transport: 'local-direct',
      modelDiscovery: 'api',
      textStreaming: true,
      imageInput: false,
      attachmentExtraction: false,
      outputTokenControl: false,
      validationStrategy: 'ollama',
      errorMapping: true,
    },
  },
};

/**
 * Get capabilities for a specific provider by ID.
 * @param id The provider identifier
 * @returns The provider capability configuration
 */
export function getProviderCapabilities(id: ProviderId): ProviderCapability {
  return providers[id];
}

/**
 * Get all available providers in the registry.
 * @returns Array of provider capabilities
 */
export function getAllProviders(): ProviderCapability[] {
  return Object.values(providers);
}
