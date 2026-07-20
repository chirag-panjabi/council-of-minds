import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../index';
import { attachmentRepository } from '../attachment';
import { sessionRepository } from '../session';
import { messageRepository } from '../message';
import { memoryStore } from '../../../stores/memory';

describe('attachmentRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    memoryStore.sessions.clear();
    memoryStore.messages.clear();
    memoryStore.attachments.clear();
  });

  it('should save and retrieve attachments for a standard message', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Test Session', false);
    
    await messageRepository.save({
      id: 'msg-1',
      sessionId: session.id,
      role: 'user',
      content: 'Hello',
      createdAt: 1000
    });

    await attachmentRepository.save({
      id: 'att-1',
      messageId: 'msg-1',
      name: 'test.jpg',
      size: 1000,
      mimeType: 'image/jpeg',
      createdAt: 1000
    });

    const attachments = await attachmentRepository.getForMessage('msg-1');
    expect(attachments).toHaveLength(1);
    expect(attachments[0].name).toBe('test.jpg');

    // Verify it's in DB
    const dbAtt = await db.attachments.get('att-1');
    expect(dbAtt).toBeDefined();
    
    // Verify it's NOT in memoryStore
    expect(memoryStore.attachments.has('att-1')).toBe(false);
  });

  it('should save and retrieve attachments for an incognito message', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Session', true);
    
    await messageRepository.save({
      id: 'msg-2',
      sessionId: session.id,
      role: 'user',
      content: 'Hello Incognito',
      createdAt: 1000
    });

    await attachmentRepository.save({
      id: 'att-2',
      messageId: 'msg-2',
      name: 'incognito.pdf',
      size: 5000,
      mimeType: 'application/pdf',
      createdAt: 1000
    });

    const attachments = await attachmentRepository.getForMessage('msg-2');
    expect(attachments).toHaveLength(1);
    expect(attachments[0].name).toBe('incognito.pdf');

    // Verify it's NOT in DB
    const dbAtt = await db.attachments.get('att-2');
    expect(dbAtt).toBeUndefined();
    
    // Verify it IS in memoryStore
    expect(memoryStore.attachments.has('att-2')).toBe(true);
  });

  it('should delete standard attachments from DB', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Test Session', false);
    
    await messageRepository.save({
      id: 'msg-1',
      sessionId: session.id,
      role: 'user',
      content: 'Hello',
      createdAt: 1000
    });

    await attachmentRepository.save({
      id: 'att-1',
      messageId: 'msg-1',
      name: 'test.jpg',
      size: 1000,
      mimeType: 'image/jpeg',
      createdAt: 1000
    });
    
    let dbAtt = await db.attachments.get('att-1');
    expect(dbAtt).toBeDefined();

    await attachmentRepository.delete('att-1');
    
    dbAtt = await db.attachments.get('att-1');
    expect(dbAtt).toBeUndefined();
  });

  it('should delete incognito attachments from memoryStore', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Session', true);
    
    await messageRepository.save({
      id: 'msg-2',
      sessionId: session.id,
      role: 'user',
      content: 'Hello Incognito',
      createdAt: 1000
    });

    await attachmentRepository.save({
      id: 'att-2',
      messageId: 'msg-2',
      name: 'incognito.pdf',
      size: 5000,
      mimeType: 'application/pdf',
      createdAt: 1000
    });
    
    expect(memoryStore.attachments.has('att-2')).toBe(true);

    await attachmentRepository.delete('att-2');
    
    expect(memoryStore.attachments.has('att-2')).toBe(false);
  });

  it('should delete all incognito attachments for a message when message is deleted', async () => {
    const session = await sessionRepository.createSession('1-on-1', [], 'Incognito Session', true);
    
    await messageRepository.save({
      id: 'msg-3',
      sessionId: session.id,
      role: 'user',
      content: 'Multiple attachments incognito',
      createdAt: 1000
    });

    await attachmentRepository.save({
      id: 'att-3a',
      messageId: 'msg-3',
      name: 'doc1.pdf',
      size: 1000,
      mimeType: 'application/pdf',
      createdAt: 1000
    });

    await attachmentRepository.save({
      id: 'att-3b',
      messageId: 'msg-3',
      name: 'doc2.pdf',
      size: 2000,
      mimeType: 'application/pdf',
      createdAt: 1001
    });

    expect(memoryStore.attachments.has('att-3a')).toBe(true);
    expect(memoryStore.attachments.has('att-3b')).toBe(true);

    await messageRepository.delete('msg-3');
    
    expect(memoryStore.attachments.has('att-3a')).toBe(false);
    expect(memoryStore.attachments.has('att-3b')).toBe(false);

    // Verify nothing in DB
    const dbAtts = await db.attachments.where({ messageId: 'msg-3' }).toArray();
    expect(dbAtts).toHaveLength(0);
  });
});
