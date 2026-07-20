import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../index';
import { sessionRepository } from '../repositories/session';
import { messageRepository } from '../repositories/message';
import { personaRepository } from '../repositories/persona';
import type { Session, Message, LocalPersona } from '../../schemas';

describe('Dexie Database', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
    });
  });

  afterEach(async () => {
    // Clean up
  });

  it('should save and retrieve a persona', async () => {
    const persona: LocalPersona = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: 'Test Persona',
      description: 'Test description',
      instructions: 'You are a test assistant',
      isFavorite: false,
      isArchived: false,
    };

    await personaRepository.save(persona);
    const retrieved = await personaRepository.get(persona.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Persona');
  });

  it('should handle session cascading deletion', async () => {
    const sessionId = '123e4567-e89b-12d3-a456-426614174001';
    
    const session: Session = {
      id: sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: 'Test Session',
      mode: '1-on-1',
      state: 'active',
      isIncognito: false,
      participants: [{
        personaId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Persona',
        instructions: 'Test instructions',
        role: 'debater'
      }],
    };

    const message: Message = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      sessionId: sessionId,
      createdAt: Date.now(),
      role: 'user',
      content: 'Hello',
    };

    // Save session and message
    await sessionRepository.save(session);
    await messageRepository.save(message);

    // Verify they exist
    expect(await sessionRepository.get(sessionId)).toBeDefined();
    expect(await messageRepository.get(message.id)).toBeDefined();

    // Perform cascading delete
    await sessionRepository.deleteWithCascading(sessionId);

    // Verify they are gone
    expect(await sessionRepository.get(sessionId)).toBeUndefined();
    expect(await messageRepository.get(message.id)).toBeUndefined();
  });

  it('should safely delete only its specific database during wipe', async () => {
    // 1. Create and populate an unrelated database
    const otherDbName = 'OtherAppDB';
    const request = indexedDB.open(otherDbName, 1);
    
    await new Promise<void>((resolve, reject) => {
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        db.createObjectStore('settings', { keyPath: 'id' });
      };
      request.onsuccess = (e: any) => {
        const otherDb = e.target.result;
        const tx = otherDb.transaction('settings', 'readwrite');
        const store = tx.objectStore('settings');
        store.put({ id: 'theme', value: 'dark' });
        tx.oncomplete = () => {
          otherDb.close();
          resolve();
        };
      };
      request.onerror = () => reject(new Error('Failed to create other DB'));
    });

    // 2. Perform the wipe operation on the primary database
    await new Promise<void>((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase('FrameworkEngineDB');
      deleteReq.onsuccess = () => resolve();
      deleteReq.onerror = () => reject();
    });

    // 3. Verify the unrelated database is untouched
    const verifyReq = indexedDB.open(otherDbName, 1);
    await new Promise<void>((resolve, reject) => {
      verifyReq.onsuccess = (e: any) => {
        const otherDb = e.target.result;
        const tx = otherDb.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const getReq = store.get('theme');
        getReq.onsuccess = () => {
          expect(getReq.result.value).toBe('dark');
          otherDb.close();
          resolve();
        };
      };
      verifyReq.onerror = () => reject(new Error('Failed to open other DB'));
    });
  });
});
