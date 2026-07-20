import { getProviderCapabilities, getAllProviders } from '../registry';
import { ProviderIdSchema } from '../../schemas/provider';

describe('Provider Capability Registry', () => {
  it('contains exactly the allowed providers: OpenAI, Anthropic, Gemini, Ollama', () => {
    const providers = getAllProviders();
    const providerIds = providers.map(p => p.id).sort();
    
    // This validates against the zod schema's allowed enum values too
    const expectedIds = ProviderIdSchema.options.slice().sort();
    
    expect(providerIds).toEqual(expectedIds);
    expect(providerIds).toEqual(['anthropic', 'gemini', 'ollama', 'openai']);
  });

  it('each provider specifies all required capabilities', () => {
    const providers = getAllProviders();
    
    providers.forEach(provider => {
      const caps = provider.capabilities;
      expect(caps).toHaveProperty('transport');
      expect(caps).toHaveProperty('modelDiscovery');
      expect(caps).toHaveProperty('textStreaming');
      expect(caps).toHaveProperty('imageInput');
      expect(caps).toHaveProperty('attachmentExtraction');
      expect(caps).toHaveProperty('outputTokenControl');
      expect(caps).toHaveProperty('validationStrategy');
      expect(caps).toHaveProperty('errorMapping');
    });
  });

  it('ollama is the only local-direct provider', () => {
    const providers = getAllProviders();
    
    providers.forEach(provider => {
      if (provider.id === 'ollama') {
        expect(provider.capabilities.transport).toBe('local-direct');
      } else {
        expect(provider.capabilities.transport).toBe('cloud-proxy');
      }
    });
  });

  it('retrieves capabilities by id correctly', () => {
    const caps = getProviderCapabilities('openai');
    expect(caps).toBeDefined();
    expect(caps.id).toBe('openai');
    expect(caps.name).toBe('OpenAI');
  });

  it('does not include deferred providers in getAllProviders', () => {
    const providers = getAllProviders();
    // Assuming deferred providers would have a specific flag or aren't in the registry at all
    // Since we only have the 4 allowed, we are inherently not returning deferred ones.
    expect(providers.length).toBe(4);
  });
});
