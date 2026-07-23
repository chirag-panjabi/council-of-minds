import { db } from '../index';
import type { Message } from '../../schemas';
import { memoryStore } from '../../stores/memory';

export class MessageRepository {
  async get(id: string): Promise<Message | undefined> {
    if (memoryStore.messages.has(id)) {
      return memoryStore.messages.get(id);
    }
    return db.messages.get(id);
  }

  async getForSession(sessionId: string): Promise<Message[]> {
    if (memoryStore.sessions.has(sessionId)) {
      return Array.from(memoryStore.messages.values())
        .filter(m => m.sessionId === sessionId)
        .sort((a, b) => a.createdAt - b.createdAt);
    }
    return db.messages.where({ sessionId }).sortBy('createdAt');
  }

  async save(message: Message): Promise<string> {
    if (memoryStore.sessions.has(message.sessionId)) {
      memoryStore.messages.set(message.id, message);
      return message.id;
    }
    return db.messages.put(message);
  }

  async saveMany(messages: Message[]): Promise<void> {
    const memMessages: Message[] = [];
    const dbMessages: Message[] = [];

    for (const msg of messages) {
      if (memoryStore.sessions.has(msg.sessionId)) {
        memMessages.push(msg);
      } else {
        dbMessages.push(msg);
      }
    }

    for (const msg of memMessages) {
      memoryStore.messages.set(msg.id, msg);
    }

    if (dbMessages.length > 0) {
      await db.messages.bulkPut(dbMessages);
    }
  }

  async delete(id: string): Promise<void> {
    if (memoryStore.messages.has(id)) {
      const msg = memoryStore.messages.get(id);
      if (msg) {
        // delete related attachments in memory
        const attachmentIds = Array.from(memoryStore.attachments.values())
          .filter(a => a.messageId === id)
          .map(a => a.id);
        attachmentIds.forEach(aId => memoryStore.attachments.delete(aId));
        memoryStore.messages.delete(id);
      }
      return;
    }

    await db.transaction('rw', [db.messages, db.attachments], async () => {
      // Delete attachments related to this message
      await db.attachments.where({ messageId: id }).delete();

      // Delete the message
      await db.messages.delete(id);
    });
  }

  async deleteForSession(sessionId: string): Promise<void> {
    if (memoryStore.sessions.has(sessionId)) {
      const messageIds = Array.from(memoryStore.messages.values())
        .filter(m => m.sessionId === sessionId)
        .map(m => m.id);
        
      const attachmentIds = Array.from(memoryStore.attachments.values())
        .filter(a => a.messageId !== undefined && messageIds.includes(a.messageId))
        .map(a => a.id);
        
      attachmentIds.forEach(aId => memoryStore.attachments.delete(aId));
      messageIds.forEach(mId => memoryStore.messages.delete(mId));
      return;
    }

    await db.transaction('rw', [db.messages, db.attachments], async () => {
      const messageIds = await db.messages.where({ sessionId }).primaryKeys();
      
      if (messageIds.length > 0) {
        await db.attachments.where('messageId').anyOf(messageIds).delete();
      }

      await db.messages.where({ sessionId }).delete();
    });
  }

  async truncateAfter(sessionId: string, messageId: string, inclusive: boolean): Promise<void> {
    const messages = await this.getForSession(sessionId);
    const targetIndex = messages.findIndex(m => m.id === messageId);
    
    if (targetIndex === -1) return;

    const messagesToDelete = messages.slice(inclusive ? targetIndex : targetIndex + 1);
    const idsToDelete = messagesToDelete.map(m => m.id);

    if (memoryStore.sessions.has(sessionId)) {
      const attachmentIds = Array.from(memoryStore.attachments.values())
        .filter(a => a.messageId !== undefined && idsToDelete.includes(a.messageId))
        .map(a => a.id);
        
      attachmentIds.forEach(aId => memoryStore.attachments.delete(aId));
      idsToDelete.forEach(mId => memoryStore.messages.delete(mId));
      return;
    }

    await db.transaction('rw', [db.messages, db.attachments, db.summaries, db.tokenUsage], async () => {
      if (idsToDelete.length > 0) {
        await db.attachments.where('messageId').anyOf(idsToDelete).delete();
        await db.messages.bulkDelete(idsToDelete);
      }
    });
  }
}

export const messageRepository = new MessageRepository();
