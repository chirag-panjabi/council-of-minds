import { db } from '../index';
import type { Summary } from '../../schemas';

export class SummaryRepository {
  async get(id: string): Promise<Summary | undefined> {
    return db.summaries.get(id);
  }

  async getForSession(sessionId: string): Promise<Summary[]> {
    return db.summaries.where({ sessionId }).toArray();
  }

  async save(summary: Summary): Promise<string> {
    return db.summaries.put(summary);
  }

  async delete(id: string): Promise<void> {
    return db.summaries.delete(id);
  }
}

export const summaryRepository = new SummaryRepository();
