import { z } from 'zod';

export const PersonaSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  instructions: z.string().min(1, 'Instructions are required').max(100000, 'Instructions are too long'),
  avatar: z.string().optional(), // Base64 or URL
  advancedRules: z.string().max(100000, 'Advanced rules are too long').optional(),
  tags: z.array(z.string()).optional(),
});

export type Persona = z.infer<typeof PersonaSchema>;

export const LocalPersonaSchema = PersonaSchema.extend({
  isFavorite: z.boolean().default(false),
  isArchived: z.boolean().default(false),
  lastUsedAt: z.number().int().positive().optional(),
  ui_color: z.string().optional(),
  recommended_model: z.string().optional(),
  is_council_member: z.boolean().optional(),
  welcome_message: z.string().optional(),
  price: z.number().optional(),
  defaultWordLimit: z.number().int().positive().optional(),
});

export type LocalPersona = z.infer<typeof LocalPersonaSchema>;

export const PortablePersonaSchema = z.object({
  version: z.literal('framework-engine.persona/v1'),
  persona: PersonaSchema.partial({
    description: true,
    avatar: true,
    advancedRules: true,
    tags: true,
  }),
  localConfig: z.object({
    ui_color: z.string().optional(),
    recommended_model: z.string().optional(),
    is_council_member: z.boolean().optional(),
    welcome_message: z.string().optional(),
    price: z.number().optional(),
    defaultWordLimit: z.number().int().positive().optional(),
    isFavorite: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    lastUsedAt: z.number().int().positive().optional(),
  }).optional(),
});

export type PortablePersona = z.infer<typeof PortablePersonaSchema>;
