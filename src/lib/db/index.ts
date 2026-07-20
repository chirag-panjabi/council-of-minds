import Dexie, { type Table } from 'dexie';
import type {
  LocalPersona,
  Session,
  Message,
  Attachment,
  Summary,
  TokenUsage,
} from '../schemas';
import type { UserProfile } from '../schemas/profile';

import { DEFAULT_PERSONAS } from './fixtures/personas';

export class FrameworkDatabase extends Dexie {
  personas!: Table<LocalPersona, string>;
  sessions!: Table<Session, string>;
  messages!: Table<Message, string>;
  attachments!: Table<Attachment, string>;
  summaries!: Table<Summary, string>;
  tokenUsage!: Table<TokenUsage, string>;
  profiles!: Table<UserProfile, string>;

  constructor() {
    super('FrameworkEngineDB');

    this.version(1).stores({
      personas: 'id, name, createdAt, lastUsedAt',
    });

    this.version(2).stores({
      personas: 'id, name, createdAt, lastUsedAt',
      sessions: 'id, mode, state, updatedAt',
      messages: 'id, sessionId, createdAt',
      attachments: 'id, messageId',
      summaries: 'id, sessionId',
      tokenUsage: 'id, sessionId, personaId',
    });

    this.version(3).stores({
      personas: 'id, name, createdAt, lastUsedAt',
      sessions: 'id, mode, state, updatedAt',
      messages: 'id, sessionId, createdAt',
      attachments: 'id, messageId',
      summaries: 'id, sessionId',
      tokenUsage: 'id, sessionId, personaId',
      profiles: 'id',
    });

    this.on('populate', () => {
      this.personas.bulkAdd(DEFAULT_PERSONAS);
    });

    this.on('ready', async () => {
      const existing = await this.personas.toArray();
      const existingIds = new Set(existing.map((p) => p.id));
      const missing = DEFAULT_PERSONAS.filter((p) => !existingIds.has(p.id));
      if (missing.length > 0) {
        await this.personas.bulkAdd(missing);
      }
    });
  }
}

export const db = new FrameworkDatabase();
