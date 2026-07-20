import { z } from 'zod';

export const SummarySchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  createdAt: z.number().int().positive(),
  content: z.string().min(1, 'Summary content is required'),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
});

export type Summary = z.infer<typeof SummarySchema>;
