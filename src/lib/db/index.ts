import Dexie, { type Table } from 'dexie';
import type { Persona, PersonaGroup, ChatSession, ChatMessage, MessageAttachment, UsageRecord } from '@/types';
import generatedPersonasRaw from '@/lib/db/fixtures/generated-personas.json';

export const DEFAULT_SYNTHESIZER_ID = 'official-council-neural-judge';

export function isOfficialPersona(p?: Partial<Persona> | null): boolean {
  if (!p) return false;
  if (p.isSystem === true) return true;
  if (p.isCustom === true) return false;
  if (p.id?.startsWith('official-')) return true;
  if (p.id?.startsWith('custom-')) return false;
  return false;
}

function formatGeneratedPersona(p: any): Persona {
  const nameStr = p.name || 'AI Persona';
  let roleStr = 'AI Thought Partner';
  if (nameStr.includes('(')) {
    roleStr = nameStr.split('(')[1].replace(')', '').trim();
  } else if (nameStr.includes('Framework')) {
    roleStr = 'Philosophical Framework';
  } else if (nameStr.includes('CTO')) {
    roleStr = 'Technology Strategy';
  } else if (nameStr.includes('VC') || nameStr.includes('Partner')) {
    roleStr = 'Venture Capital';
  }

  const isNeuralJudge = p.agent_id === 'council-neural-judge' || p.name?.includes('Neural Judge');
  const personaId = isNeuralJudge
    ? DEFAULT_SYNTHESIZER_ID
    : (p.id.startsWith('official-') ? p.id : `official-${p.id}`);

  return {
    id: personaId,
    name: p.name,
    role: roleStr,
    description: p.description || 'Analytical thought partner and reasoning framework.',
    systemPrompt: p.instructions || p.systemPrompt || '',
    recommendedModel: p.recommended_model || p.recommendedModel || 'GPT-4o',
    tags: p.tags || ['AI', 'Philosophy', 'Strategy'],
    isArchived: Boolean(p.isArchived),
    isSystem: true,
    isCustom: false,
    isFavorite: Boolean(p.isFavorite),
    welcomeMessage: p.welcome_message || p.welcomeMessage,
    uiColor: p.ui_color || p.uiColor || 'indigo',
    createdAt: p.createdAt || Date.now(),
    updatedAt: p.updatedAt || Date.now(),
  };
}

export class CouncilDatabase extends Dexie {
  personas!: Table<Persona, string>;
  groups!: Table<PersonaGroup, string>;
  chats!: Table<ChatSession, string>;
  messages!: Table<ChatMessage, string>;
  attachments!: Table<MessageAttachment, string>;
  usage!: Table<UsageRecord, string>;

  constructor() {
    super('CouncilOfMindsDB');

    this.version(1).stores({
      personas: 'id, name, isArchived, createdAt, *tags',
      groups: 'id, name, createdAt',
      chats: 'id, title, type, groupId, personaId, updatedAt',
      messages: 'id, chatId, personaId, role, timestamp',
      attachments: 'id, messageId, createdAt',
      usage: 'id, chatId, personaId, model, timestamp',
    });

    this.version(2).stores({
      personas: 'id, name, isArchived, isSystem, isCustom, isFavorite, createdAt, *tags',
    }).upgrade(async (tx) => {
      const existingPersonas = await tx.table('personas').toArray();
      const existingNames = new Set(existingPersonas.map((p: Persona) => p.name.trim().toLowerCase()));

      const newOfficialPersonas = (generatedPersonasRaw as any[])
        .map(formatGeneratedPersona)
        .filter((p) => !existingNames.has(p.name.trim().toLowerCase()));

      if (newOfficialPersonas.length > 0) {
        await tx.table('personas').bulkAdd(newOfficialPersonas);
      }
    });
  }
}

export const db = new CouncilDatabase();

// Seed initial default personas on database creation
db.on('populate', (tx) => {
  const initialPersonas = (generatedPersonasRaw as any[]).map(formatGeneratedPersona);

  const initialGroup: PersonaGroup = {
    id: 'founders-council',
    name: 'Executive Leadership Board',
    description: 'A multi-agent council for stress-testing business strategies and trade-offs.',
    personaIds: initialPersonas.slice(0, 3).map((p) => p.id),
    synthesizerPersonaId: initialPersonas[0]?.id,
    createdAt: Date.now(),
  };

  tx.table('personas').bulkAdd(initialPersonas);
  tx.table('groups').add(initialGroup);
});

// Automatic persona deduplication, sync, and system flag cleanup on DB ready
if (typeof window !== 'undefined') {
  db.on('ready', async () => {
    try {
      const allPersonas = await db.personas.toArray();
      const seenOfficialNames = new Set<string>();
      const idsToDelete: string[] = [];

      for (const p of allPersonas) {
        if (p.isSystem || (!p.isCustom && !p.id.startsWith('custom-'))) {
          const normName = p.name.trim().toLowerCase();
          if (seenOfficialNames.has(normName)) {
            idsToDelete.push(p.id);
          } else {
            seenOfficialNames.add(normName);
            if (!p.isSystem) {
              await db.personas.update(p.id, { isSystem: true, isCustom: false });
            }
          }
        }
      }

      if (idsToDelete.length > 0) {
        await db.personas.bulkDelete(idsToDelete);
        console.log(`[CouncilDB] Deduplicated ${idsToDelete.length} duplicate persona entries.`);
      }

      // Check if any official personas from fixtures are missing in local IndexedDB
      const currentPersonas = await db.personas.toArray();
      const currentNames = new Set(currentPersonas.map((p) => p.name.trim().toLowerCase()));
      const missingOfficial = (generatedPersonasRaw as any[])
        .map(formatGeneratedPersona)
        .filter((p) => !currentNames.has(p.name.trim().toLowerCase()));

      if (missingOfficial.length > 0) {
        await db.personas.bulkAdd(missingOfficial);
        console.log(`[CouncilDB] Seeded ${missingOfficial.length} missing official personas into IndexedDB.`);
      }
    } catch (e) {
      console.warn('[CouncilDB] Synchronization check skipped:', e);
    }
  });
}
