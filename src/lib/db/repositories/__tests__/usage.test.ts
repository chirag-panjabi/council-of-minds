import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../index';
import { usageRepository } from '../usage';
import { sessionRepository } from '../session';
import { memoryStore } from '../../../stores/memory';

describe('usageRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    memoryStore.sessions.clear();
    memoryStore.messages.clear();
    memoryStore.attachments.clear();
  });

  it('should persist token usage for a standard session', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Standard Session', false);

    const usage = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      providerId: 'openai',
      modelId: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      usageAvailable: true,
      createdAt: Date.now(),
    };

    const savedId = await usageRepository.save(usage);
    expect(savedId).toBe(usage.id);

    const retrieved = await usageRepository.get(usage.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.totalTokens).toBe(150);
  });

  it('should not persist token usage for an incognito session', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Session', true);

    const usage = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      providerId: 'openai',
      modelId: 'gpt-4o',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      usageAvailable: true,
      createdAt: Date.now(),
    };

    const savedId = await usageRepository.save(usage);
    expect(savedId).toBe(usage.id);

    // Should NOT be in the DB
    const retrieved = await usageRepository.get(usage.id);
    expect(retrieved).toBeUndefined();
    
    // Check DB directly
    const dbRetrieved = await db.tokenUsage.get(usage.id);
    expect(dbRetrieved).toBeUndefined();
  });
});
