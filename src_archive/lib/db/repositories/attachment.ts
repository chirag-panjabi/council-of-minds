import { db } from '../index';
import type { Attachment } from '../../schemas';
import { memoryStore } from '../../stores/memory';

export class AttachmentRepository {
  async get(id: string): Promise<Attachment | undefined> {
    if (memoryStore.attachments.has(id)) {
      return memoryStore.attachments.get(id);
    }
    return db.attachments.get(id);
  }

  async getForMessage(messageId: string): Promise<Attachment[]> {
    if (memoryStore.messages.has(messageId)) {
      return Array.from(memoryStore.attachments.values())
        .filter(a => a.messageId === messageId)
        .sort((a, b) => a.createdAt - b.createdAt);
    }
    return db.attachments.where({ messageId }).sortBy('createdAt');
  }

  async save(attachment: Attachment): Promise<string> {
    if (attachment.messageId && memoryStore.messages.has(attachment.messageId)) {
      memoryStore.attachments.set(attachment.id, attachment);
      return attachment.id;
    }
    return db.attachments.put(attachment);
  }

  async delete(id: string): Promise<void> {
    if (memoryStore.attachments.has(id)) {
      memoryStore.attachments.delete(id);
      return;
    }
    return db.attachments.delete(id);
  }
}

export const attachmentRepository = new AttachmentRepository();
