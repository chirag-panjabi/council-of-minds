import { z } from 'zod';

export const TokenUsageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  messageId: z.string().uuid().optional(),
  personaId: z.string().uuid().optional(),
  createdAt: z.number().int().positive(),
  providerId: z.string().min(1, 'Provider ID is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  cachedInputTokens: z.number().int().nonnegative().optional(),
  reasoningTokens: z.number().int().nonnegative().optional(),
  usageAvailable: z.boolean().default(true),
  pricingCatalogVersion: z.string().optional(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;
