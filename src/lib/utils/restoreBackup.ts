import JSZip from 'jszip';
import { db } from '@/lib/db';
import type { Persona, ChatSession, ChatMessage, PersonaGroup } from '@/types';
import type { BackupManifest } from '@/components/settings/RestorePreviewModal';

/**
 * Parses a backup file (.zip archive or .json file) and extracts entity data and manifest summary.
 */
export async function parseBackupFile(file: File): Promise<BackupManifest> {
  const isZip = file.name.endsWith('.zip') || file.type.includes('zip');

  if (isZip) {
    const zip = await JSZip.loadAsync(file);

    // Manifest JSON
    const manifestFile = zip.file('manifest.json');
    let manifestObj: any = {};
    if (manifestFile) {
      const manifestStr = await manifestFile.async('string');
      manifestObj = JSON.parse(manifestStr);
    }

    // Entity JSONs
    const readEntityJson = async (filename: string): Promise<any[]> => {
      const f = zip.file(filename);
      if (!f) return [];
      try {
        const str = await f.async('string');
        return JSON.parse(str);
      } catch {
        return [];
      }
    };

    const personas = await readEntityJson('personas.json');
    const chats = await readEntityJson('chats.json');
    const messages = await readEntityJson('messages.json');
    const groups = await readEntityJson('groups.json');
    const usage = await readEntityJson('usage.json');

    return {
      version: manifestObj.version || 'framework-engine.backup/v1',
      createdAt: manifestObj.createdAt || Date.now(),
      counts: {
        personas: personas.length,
        chats: chats.length,
        messages: messages.length,
        groups: groups.length,
        usage: usage.length,
      },
      data: { personas, chats, messages, groups, usage },
    };
  } else {
    // Raw JSON file fallback
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (parsed.data) {
      return {
        version: parsed.version || 'v1',
        createdAt: parsed.createdAt || Date.now(),
        counts: {
          personas: parsed.data.personas?.length || 0,
          chats: parsed.data.chats?.length || 0,
          messages: parsed.data.messages?.length || 0,
          groups: parsed.data.groups?.length || 0,
          usage: parsed.data.usage?.length || 0,
        },
        data: parsed.data,
      };
    } else {
      throw new Error('Invalid backup archive structure.');
    }
  }
}

/**
 * Executes database restore transaction to commit entities to IndexedDB based on user options.
 */
export async function executeBackupRestore(
  manifest: BackupManifest,
  options: {
    restorePersonas: boolean;
    restoreChats: boolean;
    restoreGroups?: boolean;
    conflictStrategy: 'replace' | 'duplicate' | 'skip';
  }
): Promise<{ personasRestored: number; chatsRestored: number; groupsRestored: number }> {
  let personasRestored = 0;
  let chatsRestored = 0;
  let groupsRestored = 0;

  if (!manifest || !manifest.data) return { personasRestored, chatsRestored, groupsRestored };

  const existingPersonas = await db.personas.toArray();
  const existingChats = await db.chats.toArray();
  const existingGroups = await db.groups.toArray();

  const existingPersonaIds = new Set(existingPersonas.map((p) => p.id));
  const existingChatIds = new Set(existingChats.map((c) => c.id));
  const existingGroupIds = new Set(existingGroups.map((g) => g.id));

  // 1. Restore Personas
  if (options.restorePersonas && manifest.data.personas) {
    for (const p of manifest.data.personas) {
      const exists = existingPersonaIds.has(p.id);
      if (exists && options.conflictStrategy === 'skip') continue;

      let toSave = { ...p };
      if (exists && options.conflictStrategy === 'duplicate') {
        toSave.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        toSave.name = `${p.name} (Imported)`;
      }

      await db.personas.put(toSave);
      personasRestored++;
    }
  }

  // 2. Restore Chats & Messages
  if (options.restoreChats && manifest.data.chats) {
    for (const c of manifest.data.chats) {
      const exists = existingChatIds.has(c.id);
      if (exists && options.conflictStrategy === 'skip') continue;

      let toSaveChat = { ...c };
      if (exists && options.conflictStrategy === 'duplicate') {
        const newChatId = 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        toSaveChat.id = newChatId;
        toSaveChat.title = `${c.title || 'Chat'} (Imported)`;

        // Remap messages to new chat ID
        if (manifest.data.messages) {
          const sessionMsgs = manifest.data.messages.filter((m) => m.chatId === c.id);
          for (const m of sessionMsgs) {
            await db.messages.put({
              ...m,
              id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              chatId: newChatId,
            });
          }
        }
      } else {
        // Direct put or replace
        if (manifest.data.messages) {
          const sessionMsgs = manifest.data.messages.filter((m) => m.chatId === c.id);
          for (const m of sessionMsgs) {
            await db.messages.put(m);
          }
        }
      }

      await db.chats.put(toSaveChat);
      chatsRestored++;
    }
  }

  // 3. Restore Groups
  if (options.restoreGroups && manifest.data.groups) {
    for (const g of manifest.data.groups) {
      const exists = existingGroupIds.has(g.id);
      if (exists && options.conflictStrategy === 'skip') continue;

      let toSaveGroup = { ...g };
      if (exists && options.conflictStrategy === 'duplicate') {
        toSaveGroup.id = 'group-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        toSaveGroup.name = `${g.name} (Imported)`;
      }

      await db.groups.put(toSaveGroup);
      groupsRestored++;
    }
  }

  // 4. Restore Usage
  if (manifest.data.usage) {
    for (const u of manifest.data.usage) {
      await db.usage.put(u);
    }
  }

  return { personasRestored, chatsRestored, groupsRestored };
}
