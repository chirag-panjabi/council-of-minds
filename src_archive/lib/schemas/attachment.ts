import { z } from 'zod';

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().uuid().optional(), // Optional to allow staging before a message is created
  createdAt: z.number().int().positive(),
  name: z.string().min(1, 'Name is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().int().nonnegative(),
  // We use z.any() here because the data could be a Blob (IndexedDB) or a Base64 string (Export/Portable)
  data: z.any().optional(), 
});

export type Attachment = z.infer<typeof AttachmentSchema>;
