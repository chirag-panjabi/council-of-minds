import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportBackup,
  parseBackup,
  previewRestore,
  applyRestore,
  wipeData,
} from '../backup';
import { blobToBase64, base64ToBlob } from '../../utils/base64';
import type { BackupManifest } from '../../schemas';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../db', () => {
  const makeTable = () => ({
    toArray: vi.fn().mockResolvedValue([]),
    toCollection: vi.fn().mockReturnValue({
      primaryKeys: vi.fn().mockResolvedValue([]),
    }),
    bulkPut: vi.fn().mockResolvedValue(undefined),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
  });

  return {
    db: {
      personas: makeTable(),
      sessions: makeTable(),
      messages: makeTable(),
      attachments: makeTable(),
      summaries: makeTable(),
      tokenUsage: makeTable(),
      transaction: vi.fn(
        async (
          _mode: string,
          _tables: unknown[],
          fn: () => Promise<void>,
        ) => fn(),
      ),
    },
  };
});

vi.mock('../../storage/settings', () => ({
  settingsStore: {
    clearAll: vi.fn(),
  },
}));

// Re-import after mocks are hoisted
import { db } from '../../db';
import { settingsStore } from '../../storage/settings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeManifest(
  overrides: Partial<BackupManifest['collections']> = {},
): BackupManifest {
  return {
    version: 'framework-engine.backup/v1',
    exportDate: Date.now(),
    collections: {
      personas: overrides.personas ?? [],
      sessions: overrides.sessions ?? [],
      messages: overrides.messages ?? [],
      attachments: overrides.attachments ?? [],
      summaries: overrides.summaries ?? [],
      usage: overrides.usage ?? [],
    },
  };
}

const fakePersona = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'Test Persona',
  instructions: 'Be helpful',
  version: 'framework-engine.persona/v1',
  createdAt: 1000,
  updatedAt: 1000,
};

const fakeSession = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  createdAt: 2000,
  updatedAt: 2000,
  title: 'Test Session',
  mode: '1-on-1' as const,
  state: 'active' as const,
  isIncognito: false,
  participants: [
    {
      personaId: fakePersona.id,
      name: fakePersona.name,
      instructions: fakePersona.instructions,
      role: 'debater' as const,
    },
  ],
};

const fakeMessage = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  sessionId: fakeSession.id,
  createdAt: 3000,
  role: 'user' as const,
  content: 'Hello!',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('backup service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- exportBackup -------------------------------------------------------

  describe('exportBackup', () => {
    it('returns a valid BackupManifest with all collections', async () => {
      vi.mocked(db.personas.toArray).mockResolvedValue([fakePersona as any]);
      vi.mocked(db.sessions.toArray).mockResolvedValue([fakeSession as any]);
      vi.mocked(db.messages.toArray).mockResolvedValue([fakeMessage as any]);
      vi.mocked(db.attachments.toArray).mockResolvedValue([]);
      vi.mocked(db.summaries.toArray).mockResolvedValue([]);
      vi.mocked(db.tokenUsage.toArray).mockResolvedValue([]);

      const manifest = await exportBackup();

      expect(manifest.version).toBe('framework-engine.backup/v1');
      expect(manifest.exportDate).toBeGreaterThan(0);
      expect(manifest.collections.personas).toHaveLength(1);
      expect(manifest.collections.sessions).toHaveLength(1);
      expect(manifest.collections.messages).toHaveLength(1);
    });

    it('converts Blob attachment data to Base64', async () => {
      const blobData = new Blob(['binary-content'], {
        type: 'image/png',
      });
      const attachment = {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        messageId: fakeMessage.id,
        createdAt: 4000,
        name: 'img.png',
        mimeType: 'image/png',
        size: 14,
        data: blobData,
      };

      vi.mocked(db.personas.toArray).mockResolvedValue([]);
      vi.mocked(db.sessions.toArray).mockResolvedValue([fakeSession as any]);
      vi.mocked(db.messages.toArray).mockResolvedValue([fakeMessage as any]);
      vi.mocked(db.attachments.toArray).mockResolvedValue([attachment as any]);
      vi.mocked(db.summaries.toArray).mockResolvedValue([]);
      vi.mocked(db.tokenUsage.toArray).mockResolvedValue([]);

      const manifest = await exportBackup();

      expect(typeof manifest.collections.attachments[0].data).toBe('string');
      // Round-trip: should reconstruct original text
      const restored = base64ToBlob(
        manifest.collections.attachments[0].data as string,
        'image/png',
      );
      expect(await restored.text()).toBe('binary-content');
    });

    it('does not include API keys or Incognito sessions', async () => {
      // Mock db returns
      const incognitoSession = { ...fakeSession, id: 'incognito-123', isIncognito: true };
      const incognitoMessage = { ...fakeMessage, sessionId: 'incognito-123' };

      vi.mocked(db.sessions.toArray).mockResolvedValue([fakeSession as any, incognitoSession as any]);
      vi.mocked(db.messages.toArray).mockResolvedValue([fakeMessage as any, incognitoMessage as any]);
      
      const manifest = await exportBackup();
      
      // Manifest does not have an apiKeys property or anything similar
      expect((manifest as any).apiKeys).toBeUndefined();
      
      // Verify Incognito data is filtered out
      expect(manifest.collections.sessions).toHaveLength(1);
      expect(manifest.collections.sessions[0].id).toBe(fakeSession.id);
      
      expect(manifest.collections.messages).toHaveLength(1);
      expect(manifest.collections.messages[0].sessionId).toBe(fakeSession.id);
    });
  });

  // ---- parseBackup --------------------------------------------------------

  describe('parseBackup', () => {
    it('returns success for a valid manifest JSON', () => {
      const manifest = makeManifest();
      const result = parseBackup(JSON.stringify(manifest));

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.manifest.version).toBe('framework-engine.backup/v1');
      }
    });

    it('returns error for invalid JSON', () => {
      const result = parseBackup('NOT JSON {{');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('not valid JSON');
      }
    });

    it('returns error for wrong schema version', () => {
      const bad = { version: 'wrong/v2', exportDate: 1, collections: {} };
      const result = parseBackup(JSON.stringify(bad));
      expect(result.success).toBe(false);
    });
  });

  // ---- previewRestore -----------------------------------------------------

  describe('previewRestore', () => {
    it('counts records and detects collisions', async () => {
      vi.mocked(db.personas.toArray).mockResolvedValue([fakePersona as any]);
      vi.mocked(db.sessions.toArray).mockResolvedValue([]);

      const manifest = makeManifest({
        personas: [fakePersona as any],
        sessions: [fakeSession as any],
      });

      const preview = await previewRestore(manifest);
      expect(preview.personaCount).toBe(1);
      expect(preview.sessionCount).toBe(1);
      expect(preview.collisions.personas).toBe(1); // same ID exists
      expect(preview.collisions.sessions).toBe(0);
    });
  });

  // ---- applyRestore -------------------------------------------------------

  describe('applyRestore', () => {
    it('uses bulkPut for replace strategy', async () => {
      const manifest = makeManifest({
        personas: [fakePersona as any],
        sessions: [fakeSession as any],
        messages: [fakeMessage as any],
      });

      await applyRestore(manifest, 'replace');

      expect(db.personas.bulkPut).toHaveBeenCalledWith([fakePersona]);
      expect(db.sessions.bulkPut).toHaveBeenCalledWith([fakeSession]);
      expect(db.messages.bulkPut).toHaveBeenCalledWith([fakeMessage]);
    });

    it('skips existing records for skip strategy', async () => {
      // Simulate that the persona already exists
      vi.mocked(db.personas.toCollection().primaryKeys).mockResolvedValue([
        fakePersona.id,
      ]);

      const manifest = makeManifest({
        personas: [fakePersona as any],
      });

      await applyRestore(manifest, 'skip');

      // Should not add the persona since it already exists
      expect(db.personas.bulkAdd).not.toHaveBeenCalled();
    });

    it('converts Base64 attachment data back to Blob', async () => {
      const base64Data = await blobToBase64(
        new Blob(['restored-content'], { type: 'text/plain' }),
      );

      const manifest = makeManifest({
        attachments: [
          {
            id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            messageId: fakeMessage.id,
            createdAt: 4000,
            name: 'file.txt',
            mimeType: 'text/plain',
            size: 16,
            data: base64Data,
          },
        ],
      });

      await applyRestore(manifest, 'replace');

      const putCall = vi.mocked(db.attachments.bulkPut).mock.calls[0][0] as any[];
      expect(putCall[0].data).toBeInstanceOf(Blob);
      expect(await putCall[0].data.text()).toBe('restored-content');
    });
  });

  // ---- wipeData -----------------------------------------------------------

  describe('wipeData', () => {
    it('deletes database and clears localStorage namespaced keys', async () => {
      // Mock deleteDatabase
      const mockDeleteDB = vi.fn((name: string) => {
        const req = {
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onblocked: null as (() => void) | null,
        };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      });
      vi.stubGlobal('indexedDB', { deleteDatabase: mockDeleteDB });

      const result = await wipeData();

      expect(result.success).toBe(true);
      expect(mockDeleteDB).toHaveBeenCalledWith('FrameworkEngineDB');
      expect(settingsStore.clearAll).toHaveBeenCalled();
    });

    it('reports blocked deletion', async () => {
      const mockDeleteDB = vi.fn((name: string) => {
        const req = {
          onsuccess: null as (() => void) | null,
          onerror: null as (() => void) | null,
          onblocked: null as (() => void) | null,
        };
        setTimeout(() => req.onblocked?.(), 0);
        return req;
      });
      vi.stubGlobal('indexedDB', { deleteDatabase: mockDeleteDB });

      const result = await wipeData();

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.error).toContain('blocked');
    });
  });
});

// ---------------------------------------------------------------------------
// base64 utils
// ---------------------------------------------------------------------------

describe('base64 utils', () => {
  it('round-trips Blob → Base64 → Blob', async () => {
    const original = new Blob(['hello world'], { type: 'text/plain' });
    const encoded = await blobToBase64(original);

    expect(typeof encoded).toBe('string');

    const decoded = base64ToBlob(encoded, 'text/plain');
    expect(decoded).toBeInstanceOf(Blob);
    expect(await decoded.text()).toBe('hello world');
  });

  it('handles empty Blob', async () => {
    const empty = new Blob([], { type: 'application/octet-stream' });
    const encoded = await blobToBase64(empty);
    expect(encoded).toBe('');

    const decoded = base64ToBlob(encoded, 'application/octet-stream');
    expect(decoded.size).toBe(0);
  });
});
