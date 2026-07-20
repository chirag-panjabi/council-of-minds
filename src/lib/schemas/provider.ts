import { z } from 'zod';

export const ProviderIdSchema = z.enum(['openai', 'anthropic', 'gemini', 'ollama']);
export type ProviderId = z.infer<typeof ProviderIdSchema>;

export const ProviderCapabilitySchema = z.object({
  id: ProviderIdSchema,
  name: z.string().min(1, 'Provider name is required'),
  capabilities: z.object({
    transport: z.enum(['cloud-proxy', 'local-direct']),
    modelDiscovery: z.enum(['hardcoded', 'api']),
    textStreaming: z.boolean(),
    imageInput: z.boolean(),
    attachmentExtraction: z.boolean(),
    outputTokenControl: z.boolean(),
    validationStrategy: z.string(),
    errorMapping: z.boolean(),
  }),
});

export type ProviderCapability = z.infer<typeof ProviderCapabilitySchema>;
