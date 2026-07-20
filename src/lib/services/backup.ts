import { db } from '../db';
import { settingsStore } from '../storage/settings';
import { BackupManifestSchema, type BackupManifest } from '../schemas';
import { blobToBase64, base64ToBlob } from '../utils/base64';
import type { Attachment } from '../schemas';

const BACKUP_VERSION = 'framework-engine.backup/v1' as const;

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Collect all durable records from IndexedDB and produce a BackupManifest.
 * Attachment Blob data is converted to Base64 strings for JSON portability.
 * API keys and Incognito data are never included.
 */
export async function exportBackup(): Promise<BackupManifest> {
  const [personas, sessions, messages, rawAttachments, summaries, usage] =
    await Promise.all([
      db.personas.toArray(),
      db.sessions.toArray(),
      db.messages.toArray(),
      db.attachments.toArray(),
      db.summaries.toArray(),
      db.tokenUsage.toArray(),
    ]);

  // Filter out any Incognito sessions that might have accidentally leaked into Dexie
  const validSessions = sessions.filter((s) => !s.isIncognito);
  const validSessionIds = new Set(validSessions.map((s) => s.id));

  const validMessages = messages.filter((m) => validSessionIds.has(m.sessionId));
  const validMessageIds = new Set(validMessages.map((m) => m.id));

  const validRawAttachments = rawAttachments.filter((a) => a.messageId && validMessageIds.has(a.messageId));
  
  const validUsage = usage.filter((u) => validSessionIds.has(u.sessionId));

  // Convert Blob attachment data → Base64 strings for JSON serialisation
  const attachments: Attachment[] = await Promise.all(
    validRawAttachments.map(async (att) => {
      if (att.data instanceof Blob) {
        const base64 = await blobToBase64(att.data);
        return { ...att, data: base64 };
      }
      return att;
    }),
  );

  return {
    version: BACKUP_VERSION,
    exportDate: Date.now(),
    collections: {
      personas,
      sessions: validSessions,
      messages: validMessages,
      attachments,
      summaries,
      usage: validUsage,
    },
  };
}

// ---------------------------------------------------------------------------
// Parse & validate
// ---------------------------------------------------------------------------

export interface ParseResult {
  success: true;
  manifest: BackupManifest;
}

export interface ParseError {
  success: false;
  error: string;
}

/**
 * Parse a raw JSON string and validate it against the BackupManifestSchema.
 */
export function parseBackup(fileText: string): ParseResult | ParseError {
  let json: unknown;
  try {
    json = JSON.parse(fileText);
  } catch {
    return { success: false, error: 'File is not valid JSON.' };
  }

  const result = BackupManifestSchema.safeParse(json);
  if (!result.success) {
    return {
      success: false,
      error: `Invalid backup format: ${result.error.issues.map((i) => i.message).join(', ')}`,
    };
  }

  return { success: true, manifest: result.data };
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export interface RestorePreview {
  personaCount: number;
  sessionCount: number;
  messageCount: number;
  attachmentCount: number;
  summaryCount: number;
  usageCount: number;
  collisions: {
    personas: number;
    sessions: number;
  };
}

/**
 * Analyse a parsed manifest to produce a human-readable summary and detect
 * ID collisions with existing database records.
 */
export async function previewRestore(
  manifest: BackupManifest,
): Promise<RestorePreview> {
  const { collections } = manifest;

  // Detect collisions by checking existing IDs
  const existingPersonaIds = new Set(
    (await db.personas.toArray()).map((p) => p.id),
  );
  const existingSessionIds = new Set(
    (await db.sessions.toArray()).map((s) => s.id),
  );

  const personaCollisions = collections.personas.filter((p) =>
    existingPersonaIds.has(p.id),
  ).length;
  const sessionCollisions = collections.sessions.filter((s) =>
    existingSessionIds.has(s.id),
  ).length;

  return {
    personaCount: collections.personas.length,
    sessionCount: collections.sessions.length,
    messageCount: collections.messages.length,
    attachmentCount: collections.attachments.length,
    summaryCount: collections.summaries.length,
    usageCount: collections.usage.length,
    collisions: {
      personas: personaCollisions,
      sessions: sessionCollisions,
    },
  };
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

/**
 * Write the manifest's collections into IndexedDB. Base64 attachment data is
 * converted back to Blobs. The `collisionStrategy` determines behaviour when
 * a record with the same ID already exists:
 *   - `replace`: overwrite existing records.
 *   - `skip`:    leave existing records untouched.
 */
export async function applyRestore(
  manifest: BackupManifest,
  collisionStrategy: 'replace' | 'skip',
): Promise<void> {
  const { collections } = manifest;

  // Convert Base64 attachment data → Blob
  const attachments: Attachment[] = collections.attachments.map((att) => {
    if (typeof att.data === 'string') {
      return { ...att, data: base64ToBlob(att.data, att.mimeType) };
    }
    return att;
  });

  await db.transaction(
    'rw',
    [
      db.personas,
      db.sessions,
      db.messages,
      db.attachments,
      db.summaries,
      db.tokenUsage,
    ],
    async () => {
      const bulkPut = async <T extends { id: string }>(
        table: import('dexie').Table<T, string>,
        records: T[],
      ) => {
        if (collisionStrategy === 'replace') {
          await table.bulkPut(records);
        } else {
          // Skip strategy: only add records whose IDs don't already exist
          const existingKeys = new Set(await table.toCollection().primaryKeys());
          const newRecords = records.filter((r) => !existingKeys.has(r.id));
          if (newRecords.length > 0) {
            await table.bulkAdd(newRecords);
          }
        }
      };

      await bulkPut(db.personas, collections.personas);
      await bulkPut(db.sessions, collections.sessions);
      await bulkPut(db.messages, collections.messages);
      await bulkPut(db.attachments, attachments);
      await bulkPut(db.summaries, collections.summaries);
      await bulkPut(db.tokenUsage, collections.usage);
    },
  );
}

// ---------------------------------------------------------------------------
// Wipe
// ---------------------------------------------------------------------------

export interface WipeResult {
  success: boolean;
  blocked?: boolean;
  error?: string;
}

/**
 * Permanently delete all app data:
 *   1. Delete the Dexie database (handles the "blocked" edge case).
 *   2. Clear all namespaced localStorage keys.
 */
export async function wipeData(): Promise<WipeResult> {
  try {
    // Delete the IndexedDB database
    await new Promise<void>((resolve, reject) => {
      // Use the raw IndexedDB API to get access to the onblocked callback
      const request = indexedDB.deleteDatabase('FrameworkEngineDB');

      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(new Error('Failed to delete database.'));
      request.onblocked = () =>
        reject(
          new Error(
            'Database deletion is blocked. Please close other tabs that use this application and try again.',
          ),
        );
    });

    // Clear namespaced localStorage keys
    settingsStore.clearAll();

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error during wipe.';
    const blocked = message.includes('blocked');
    return { success: false, blocked, error: message };
  }
}
