import { z } from 'zod';

export const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  createdAt: z.number().int().positive(),
  role: MessageRoleSchema,
  content: z.string(),
  personaId: z.string().uuid().optional(),
  attachments: z.array(z.string().uuid()).optional(),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
