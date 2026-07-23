import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../index';
import { messageRepository } from '../message';
import { sessionRepository } from '../session';
import { memoryStore } from '../../../stores/memory';

describe('messageRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    memoryStore.sessions.clear();
    memoryStore.messages.clear();
    memoryStore.attachments.clear();
  });

  it('should save and retrieve messages for a standard session', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Test Session', false);
    
    await messageRepository.save({
      id: 'msg-1',
      sessionId: session.id,
      role: 'user',
      content: 'Hello',
      createdAt: 1000,
      
    });

    const messages = await messageRepository.getForSession(session.id);
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello');

    // Verify it's in DB
    const dbMsg = await db.messages.get('msg-1');
    expect(dbMsg).toBeDefined();
  });

  it('should save and retrieve messages for an incognito session', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Session', true);
    
    await messageRepository.save({
      id: 'msg-2',
      sessionId: session.id,
      role: 'user',
      content: 'Hello Incognito',
      createdAt: 1000,
      
    });

    const messages = await messageRepository.getForSession(session.id);
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello Incognito');

    // Verify it's NOT in DB
    const dbMsg = await db.messages.get('msg-2');
    expect(dbMsg).toBeUndefined();
  });

  it('should truncateAfter and delete subsequent messages and derived data', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Test Session', false);
    
    await messageRepository.saveMany([
      { id: 'msg-1', sessionId: session.id, role: 'user', content: 'M1', createdAt: 1000,  },
      { id: 'msg-2', sessionId: session.id, role: 'assistant', content: 'M2', createdAt: 2000,  },
      { id: 'msg-3', sessionId: session.id, role: 'user', content: 'M3', createdAt: 3000,  },
      { id: 'msg-4', sessionId: session.id, role: 'assistant', content: 'M4', createdAt: 4000,  }
    ]);

    // Add some attachments
    await db.attachments.put({ id: 'att-1', messageId: 'msg-1', name: 'f1', size: 100, mimeType: 'text/plain', createdAt: Date.now() });
    await db.attachments.put({ id: 'att-3', messageId: 'msg-3', name: 'f3', size: 100, mimeType: 'text/plain', createdAt: Date.now() });

    // Truncate from msg-3 (inclusive)
    await messageRepository.truncateAfter(session.id, 'msg-3', true);

    const messages = await messageRepository.getForSession(session.id);
    expect(messages).toHaveLength(2);
    expect(messages.map(m => m.id)).toEqual(['msg-1', 'msg-2']);

    // Check attachments
    const att1 = await db.attachments.get('att-1');
    expect(att1).toBeDefined();

    const att3 = await db.attachments.get('att-3');
    expect(att3).toBeUndefined();
  });

  it('should truncateAfter (exclusive) correctly', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Test Session', false);
    
    await messageRepository.saveMany([
      { id: 'msg-1', sessionId: session.id, role: 'user', content: 'M1', createdAt: 1000,  },
      { id: 'msg-2', sessionId: session.id, role: 'assistant', content: 'M2', createdAt: 2000,  },
      { id: 'msg-3', sessionId: session.id, role: 'user', content: 'M3', createdAt: 3000,  },
      { id: 'msg-4', sessionId: session.id, role: 'assistant', content: 'M4', createdAt: 4000,  }
    ]);

    // Truncate from msg-3 (exclusive) -> msg-3 is kept, msg-4 is deleted
    await messageRepository.truncateAfter(session.id, 'msg-3', false);

    const messages = await messageRepository.getForSession(session.id);
    expect(messages).toHaveLength(3);
    expect(messages.map(m => m.id)).toEqual(['msg-1', 'msg-2', 'msg-3']);
  });
});
