import { z } from 'zod';

export const ApiKeysSchema = z.record(z.string(), z.string());
export type ApiKeys = z.infer<typeof ApiKeysSchema>;

export const PreferencesSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  density: z.enum(['comfortable', 'compact']).default('comfortable'),
  typography: z.enum(['sm', 'base', 'lg']).default('base'),
  defaultProviderId: z.string().optional(),
  defaultModelId: z.string().optional(),
  defaultWordLimit: z.number().int().positive().optional(),
  ollama: z.object({
    enabled: z.boolean(),
    baseUrl: z.string().min(1),
    modelIds: z.array(z.string().min(1)),
    selectedModelId: z.string().min(1).optional(),
  }).optional(),
  summarization: z.object({
    enabled: z.boolean().default(false),
    providerId: z.string().optional(),
    modelId: z.string().optional(),
  }).optional(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const OnboardingSchema = z.object({
  hasCompletedSetup: z.boolean().default(false),
  hasSkippedSetup: z.boolean().optional(),
});
export type Onboarding = z.infer<typeof OnboardingSchema>;

export const DraftsSchema = z.record(z.string(), z.string());
export type Drafts = z.infer<typeof DraftsSchema>;
