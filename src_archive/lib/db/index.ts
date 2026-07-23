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
      
      // Clean up duplicates caused by previous non-deterministic ID generation
      const newDefaultsByName = new Map(DEFAULT_PERSONAS.map(p => [p.name, p]));
      const toDelete = existing.filter(p => {
        const newDef = newDefaultsByName.get(p.name);
        return newDef && newDef.id !== p.id && newDef.instructions === p.instructions;
      });

      if (toDelete.length > 0) {
        await this.personas.bulkDelete(toDelete.map(p => p.id));
      }

      // Calculate missing personas using remaining ones
      const remainingIds = new Set(
        existing.filter(p => !toDelete.includes(p)).map(p => p.id)
      );
      
      const missing = DEFAULT_PERSONAS.filter((p) => !remainingIds.has(p.id));
      if (missing.length > 0) {
        await this.personas.bulkAdd(missing);
      }
    });
  }
}

export const db = new FrameworkDatabase();
