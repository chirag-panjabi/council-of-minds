import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string(),
  preferredName: z.string().optional(),
  contextualProfile: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
