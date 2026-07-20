import { db } from '../index';
import type { Session, SessionMode, ParticipantSnapshot, SessionSettings } from '../../schemas';
import { memoryStore } from '../../stores/memory';
import { generateId } from '../../utils/uuid';
import { settingsStore } from '../../storage/settings';
import { settingsRepository } from './settings';

export class SessionRepository {
  async createSession(
    mode: SessionMode,
    participants: ParticipantSnapshot[],
    title: string,
    isIncognito: boolean = false,
    turnCap?: number
  ): Promise<Session> {
    const now = Date.now();
    const prefs = settingsStore.getPreferences();
    const globalSettings = settingsRepository.getSettings();
    
    let settings: SessionSettings | undefined = undefined;
    const globalWordLimit = globalSettings.defaultWordLimit || prefs.defaultWordLimit;
    
    const perPersona: Record<string, number> = {};
    for (const participant of participants) {
      if (participant.wordLimit) {
        perPersona[participant.personaId] = participant.wordLimit;
      }
    }
    
    if (globalWordLimit || Object.keys(perPersona).length > 0) {
      settings = {
        wordLimit: {
          ...(globalWordLimit ? { global: globalWordLimit } : {}),
          ...(Object.keys(perPersona).length > 0 ? { perPersona } : {}),
        }
      };
    }

    const session: Session = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      title,
      mode,
      state: 'active',
      isIncognito,
      participants,
      ...(turnCap !== undefined && { turnCap }),
      ...(settings !== undefined && { settings }),
    };

    if (isIncognito) {
      memoryStore.sessions.set(session.id, session);
    } else {
      await db.sessions.put(session);
    }
    
    return session;
  }

  async get(id: string): Promise<Session | undefined> {
    if (memoryStore.sessions.has(id)) {
      return memoryStore.sessions.get(id);
    }
    return db.sessions.get(id);
  }

  async getAllActive(): Promise<Session[]> {
    const dbSessions = await db.sessions.where('state').equals('active').reverse().sortBy('updatedAt');
    const memorySessions = Array.from(memoryStore.sessions.values())
      .filter(s => s.state === 'active')
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return [...memorySessions, ...dbSessions];
  }

  async getDurableActiveSessions(): Promise<Session[]> {
    return await db.sessions.where('state').equals('active').reverse().sortBy('updatedAt');
  }

  async getAllArchived(): Promise<Session[]> {
    const dbSessions = await db.sessions.where('state').equals('archived').reverse().sortBy('updatedAt');
    const memorySessions = Array.from(memoryStore.sessions.values())
      .filter(s => s.state === 'archived')
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return [...memorySessions, ...dbSessions];
  }

  async save(session: Session): Promise<string> {
    if (session.isIncognito) {
      memoryStore.sessions.set(session.id, session);
      return session.id;
    }
    return db.sessions.put(session);
  }

  async updateState(id: string, state: Session['state']): Promise<void> {
    const memSession = memoryStore.sessions.get(id);
    if (memSession) {
      memSession.state = state;
      memSession.updatedAt = Date.now();
      memoryStore.sessions.set(id, memSession);
      return;
    }

    const session = await db.sessions.get(id);
    if (session) {
      session.state = state;
      session.updatedAt = Date.now();
      await db.sessions.put(session);
    }
  }

  async updateSessionTitle(id: string, title: string): Promise<void> {
    const memSession = memoryStore.sessions.get(id);
    if (memSession) {
      memSession.title = title;
      memSession.updatedAt = Date.now();
      memoryStore.sessions.set(id, memSession);
      return;
    }

    const session = await db.sessions.get(id);
    if (session) {
      session.title = title;
      session.updatedAt = Date.now();
      await db.sessions.put(session);
    }
  }

  async updateSessionParticipant(sessionId: string, personaId: string, updates: Partial<ParticipantSnapshot>): Promise<void> {
    const memSession = memoryStore.sessions.get(sessionId);
    if (memSession) {
      memSession.participants = memSession.participants.map(p => 
        p.personaId === personaId ? { ...p, ...updates } : p
      );
      memSession.updatedAt = Date.now();
      memoryStore.sessions.set(sessionId, memSession);
      return;
    }

    const session = await db.sessions.get(sessionId);
    if (session) {
      session.participants = session.participants.map(p => 
        p.personaId === personaId ? { ...p, ...updates } : p
      );
      session.updatedAt = Date.now();
      await db.sessions.put(session);
    }
  }

  async updateSessionSettings(
    sessionId: string,
    updates: {
      title?: string;
      turnCap?: number;
      participants?: ParticipantSnapshot[];
      settings?: SessionSettings;
    }
  ): Promise<void> {
    const memSession = memoryStore.sessions.get(sessionId);
    if (memSession) {
      if (updates.title !== undefined) memSession.title = updates.title;
      if (updates.turnCap !== undefined) memSession.turnCap = updates.turnCap;
      if (updates.participants !== undefined) memSession.participants = updates.participants;
      if (updates.settings !== undefined) memSession.settings = updates.settings;
      memSession.updatedAt = Date.now();
      memoryStore.sessions.set(sessionId, memSession);
      return;
    }

    const session = await db.sessions.get(sessionId);
    if (session) {
      if (updates.title !== undefined) session.title = updates.title;
      if (updates.turnCap !== undefined) session.turnCap = updates.turnCap;
      if (updates.participants !== undefined) session.participants = updates.participants;
      if (updates.settings !== undefined) session.settings = updates.settings;
      session.updatedAt = Date.now();
      await db.sessions.put(session);
    }
  }

  async deleteWithCascading(id: string): Promise<void> {
    if (memoryStore.sessions.has(id)) {
      // Find all messages for the session
      const messageIds = Array.from(memoryStore.messages.values())
        .filter(m => m.sessionId === id)
        .map(m => m.id);
      
      // Delete attachments related to these messages
      if (messageIds.length > 0) {
        const attachmentIds = Array.from(memoryStore.attachments.values())
          .filter(a => a.messageId !== undefined && messageIds.includes(a.messageId))
          .map(a => a.id);
        attachmentIds.forEach(aId => memoryStore.attachments.delete(aId));
      }

      // Delete messages
      messageIds.forEach(mId => memoryStore.messages.delete(mId));

      // Finally, delete the session
      memoryStore.sessions.delete(id);
      return;
    }

    await db.transaction('rw', [db.sessions, db.messages, db.attachments, db.summaries, db.tokenUsage], async () => {
      // Find all messages for the session
      const messageIds = await db.messages.where({ sessionId: id }).primaryKeys();
      
      // Delete attachments related to these messages
      if (messageIds.length > 0) {
        await db.attachments.where('messageId').anyOf(messageIds).delete();
      }

      // Delete messages
      await db.messages.where({ sessionId: id }).delete();

      // Delete summaries
      await db.summaries.where({ sessionId: id }).delete();

      // Delete token usage
      await db.tokenUsage.where({ sessionId: id }).delete();

      // Finally, delete the session
      await db.sessions.delete(id);
    });
  }
}

export const sessionRepository = new SessionRepository();

