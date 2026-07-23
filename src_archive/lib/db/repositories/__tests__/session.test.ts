import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../index';
import { sessionRepository } from '../session';
import { ParticipantSnapshot } from '../../../schemas';
import { memoryStore } from '../../../stores/memory';

describe('sessionRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    memoryStore.sessions.clear();
    memoryStore.messages.clear();
    memoryStore.attachments.clear();
  });

  it('should create and retrieve a normal session', async () => {
    const participants: ParticipantSnapshot[] = [
      {
        personaId: crypto.randomUUID(),
        name: 'Test Persona',
        instructions: 'Test instructions',
        role: 'debater'
      }
    ];

    const session = await sessionRepository.createSession('1-on-1', participants, 'Test Session', false);
    
    expect(session.id).toBeDefined();
    expect(session.isIncognito).toBe(false);
    expect(session.participants).toHaveLength(1);

    const retrieved = await sessionRepository.get(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe('Test Session');
  });

  it('should not persist incognito sessions to DB', async () => {
    const participants: ParticipantSnapshot[] = [
      {
        personaId: crypto.randomUUID(),
        name: 'Incognito Persona',
        instructions: 'Hidden instructions',
        role: 'debater'
      }
    ];

    const session = await sessionRepository.createSession('1-on-1', participants, 'Incognito Session', true);
    
    expect(session.id).toBeDefined();
    expect(session.isIncognito).toBe(true);

    const retrieved = await sessionRepository.get(session.id);
    expect(retrieved).toBeDefined();
    
    // Check db directly
    const dbRetrieved = await db.sessions.get(session.id);
    expect(dbRetrieved).toBeUndefined();
  });

  it('should update state to archived', async () => {
    const participants: ParticipantSnapshot[] = [
      {
        personaId: crypto.randomUUID(),
        name: 'Test',
        instructions: 'Test',
        role: 'debater'
      }
    ];
    const session = await sessionRepository.createSession('1-on-1', participants, 'To Archive', false);
    
    await sessionRepository.updateState(session.id, 'archived');
    
    const archived = await sessionRepository.getAllArchived();
    expect(archived).toHaveLength(1);
    expect(archived[0].id).toBe(session.id);
    
    const active = await sessionRepository.getAllActive();
    expect(active).toHaveLength(0);
  });

  it('should cascade delete messages, attachments, summaries, and usage', async () => {
    const participants: ParticipantSnapshot[] = [
      {
        personaId: crypto.randomUUID(),
        name: 'Test',
        instructions: 'Test',
        role: 'debater'
      }
    ];
    const session = await sessionRepository.createSession('1-on-1', participants, 'Cascade Test', false);
    
    // Add dummy related records
    const msgId = crypto.randomUUID();
    await db.messages.put({
      id: msgId,
      sessionId: session.id,
      role: 'user',
      content: 'Hello',
      createdAt: Date.now(),
    });

    await db.attachments.put({
      id: crypto.randomUUID(),
      messageId: msgId,
      name: 'file.txt',
      size: 100,
      mimeType: 'text/plain',
      createdAt: Date.now(),
    });

    await db.summaries.put({
      id: crypto.randomUUID(),
      sessionId: session.id,
      content: 'Summary',
      createdAt: Date.now(),
    });

    await db.tokenUsage.put({
      id: crypto.randomUUID(),
      sessionId: session.id,
      providerId: 'openai',
      modelId: 'gpt-4o',
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
      usageAvailable: true,
      createdAt: Date.now(),
    });

    // Delete session
    await sessionRepository.deleteWithCascading(session.id);

    // Verify all cascading records are deleted
    expect(await db.sessions.get(session.id)).toBeUndefined();
    expect(await db.messages.where({ sessionId: session.id }).toArray()).toHaveLength(0);
    expect(await db.attachments.where({ messageId: msgId }).toArray()).toHaveLength(0);
    expect(await db.summaries.where({ sessionId: session.id }).toArray()).toHaveLength(0);
    expect(await db.tokenUsage.where({ sessionId: session.id }).toArray()).toHaveLength(0);
  });

  it('should update state of an incognito session in memory only', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Update', true);
    expect(memoryStore.sessions.get(session.id)?.state).toBe('active');

    await sessionRepository.updateState(session.id, 'archived');

    // Should update in memory
    expect(memoryStore.sessions.get(session.id)?.state).toBe('archived');

    // Should not exist in DB
    const dbRetrieved = await db.sessions.get(session.id);
    expect(dbRetrieved).toBeUndefined();
  });

  it('should delete an incognito session from memory only', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Delete', true);
    expect(memoryStore.sessions.has(session.id)).toBe(true);

    await sessionRepository.deleteWithCascading(session.id);

    // Should be removed from memory
    expect(memoryStore.sessions.has(session.id)).toBe(false);

    // Check that it was never in the DB
    const dbRetrieved = await db.sessions.get(session.id);
    expect(dbRetrieved).toBeUndefined();
  });
});
