import { db } from '../index';
import type { TokenUsage } from '../../schemas';
import { memoryStore } from '../../stores/memory';

export class UsageRepository {
  async get(id: string): Promise<TokenUsage | undefined> {
    return db.tokenUsage.get(id);
  }

  async getForSession(sessionId: string): Promise<TokenUsage[]> {
    return db.tokenUsage.where({ sessionId }).toArray();
  }

  async getForPersona(personaId: string): Promise<TokenUsage[]> {
    return db.tokenUsage.where({ personaId }).toArray();
  }

  async save(usage: TokenUsage): Promise<string> {
    if (memoryStore.sessions.has(usage.sessionId)) {
      // Do not persist token usage for incognito sessions.
      return usage.id;
    }
    return db.tokenUsage.put(usage);
  }

  async delete(id: string): Promise<void> {
    return db.tokenUsage.delete(id);
  }
}

export const usageRepository = new UsageRepository();
