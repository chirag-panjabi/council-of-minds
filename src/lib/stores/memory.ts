import type { Session, Message, Attachment } from '../schemas';

export class MemoryStore {
  sessions = new Map<string, Session>();
  messages = new Map<string, Message>();
  attachments = new Map<string, Attachment>();

  clear() {
    this.sessions.clear();
    this.messages.clear();
    this.attachments.clear();
  }
}

export const memoryStore = new MemoryStore();
