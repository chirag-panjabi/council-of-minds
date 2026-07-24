import Dexie, { type Table } from 'dexie';
import type { Persona, PersonaGroup, ChatSession, ChatMessage, MessageAttachment, UsageRecord } from '@/types';
import generatedPersonasRaw from '@/lib/db/fixtures/generated-personas.json';

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

  return {
    id: p.id,
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
      const existingIds = new Set(existingPersonas.map((p: Persona) => p.id));

      const newOfficialPersonas = (generatedPersonasRaw as any[])
        .map(formatGeneratedPersona)
        .filter((p) => !existingIds.has(p.id));

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
