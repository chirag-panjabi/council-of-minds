import { z } from 'zod';
import { PersonaSchema } from './persona';
import { SessionSchema } from './session';
import { MessageSchema } from './message';
import { AttachmentSchema } from './attachment';
import { SummarySchema } from './summary';
import { TokenUsageSchema } from './usage';

export const BackupManifestSchema = z.object({
  version: z.literal('framework-engine.backup/v1'),
  exportDate: z.number().int().positive(),
  collections: z.object({
    personas: z.array(PersonaSchema),
    sessions: z.array(SessionSchema),
    messages: z.array(MessageSchema),
    attachments: z.array(AttachmentSchema),
    summaries: z.array(SummarySchema),
    usage: z.array(TokenUsageSchema),
  }),
});

export type BackupManifest = z.infer<typeof BackupManifestSchema>;
