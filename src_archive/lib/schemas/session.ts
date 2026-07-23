import { z } from 'zod';

export const SessionStateSchema = z.enum(['active', 'archived']);
export type SessionState = z.infer<typeof SessionStateSchema>;

export const SessionModeSchema = z.enum(['1-on-1', 'council']);
export type SessionMode = z.infer<typeof SessionModeSchema>;

export const ParticipantRoleSchema = z.enum(['debater', 'synthesizer']);
export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;

export const ParticipantSnapshotSchema = z.object({
  personaId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string(),
  avatar: z.string().optional(),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  role: ParticipantRoleSchema.default('debater'),
  wordLimit: z.number().int().positive().optional(),
});
export type ParticipantSnapshot = z.infer<typeof ParticipantSnapshotSchema>;

export const WordLimitSettingsSchema = z.object({
  global: z.number().int().positive().optional(),
  perPersona: z.record(z.string().uuid(), z.number().int().positive()).optional(),
});
export type WordLimitSettings = z.infer<typeof WordLimitSettingsSchema>;

export const SessionSettingsSchema = z.object({
  wordLimit: WordLimitSettingsSchema.optional(),
});
export type SessionSettings = z.infer<typeof SessionSettingsSchema>;


export const SessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  mode: SessionModeSchema,
  state: SessionStateSchema.default('active'),
  isIncognito: z.boolean().default(false),
  participants: z.array(ParticipantSnapshotSchema).min(1, 'At least one participant is required'),
  turnCap: z.number().int().min(1).max(12).optional(),
  settings: SessionSettingsSchema.optional(),
});

export type Session = z.infer<typeof SessionSchema>;
