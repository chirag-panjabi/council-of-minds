import Dexie, { type Table } from 'dexie';
import type { Persona, PersonaGroup, ChatSession, ChatMessage, MessageAttachment, UsageRecord } from '@/types';

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
  }
}

export const db = new CouncilDatabase();

// Seed initial default personas on database creation
db.on('populate', (tx) => {
  const initialPersonas: Persona[] = [
    {
      id: 'stoic-philosopher',
      name: 'Marcus Aurelius',
      role: 'Stoic Philosopher',
      description: 'Focuses on what is within control, emotional mastery, and duties to the cosmos.',
      systemPrompt: 'You speak from the perspective of Marcus Aurelius. Analyze dilemmas by separating what is within the user control from what is outside it. Offer calm, structured Stoic wisdom without preaching.',
      recommendedModel: 'GPT-4o',
      tags: ['Philosophy', 'Stoicism', 'Personal Growth'],
      isArchived: false,
      createdAt: Date.now(),
    },
    {
      id: 'skeptical-vc',
      name: 'Skeptical Partner',
      role: 'Venture Capital Partner',
      description: 'Stress-tests business assumptions, unit economics, market size, and defensibility.',
      systemPrompt: 'You are a skeptical Silicon Valley VC partner reviewing pitch decks. Ask tough questions about TAM, retention, moat, CAC, and unit economics. Be constructive but uncompromising on clarity.',
      recommendedModel: 'Claude 3.5 Sonnet',
      tags: ['Business', 'Strategy', 'Red Teaming'],
      isArchived: false,
      createdAt: Date.now(),
    },
    {
      id: 'socratic-tutor',
      name: 'Socratic Guide',
      role: 'Socratic Method Tutor',
      description: 'Never gives direct advice; asks deep non-directive probing questions to uncover root causes.',
      systemPrompt: 'You are a Socratic tutor. Never offer direct advice or solutions. Instead, respond to every user statement with 1 or 2 targeted questions that help them discover their own underlying assumptions.',
      recommendedModel: 'Gemini 2.5 Flash',
      tags: ['Reflection', 'Learning', 'Socratic'],
      isArchived: false,
      createdAt: Date.now(),
    },
    {
      id: 'pragmatic-cto',
      name: 'Pragmatic CTO',
      role: 'Chief Technology Officer',
      description: 'Focuses on technical trade-offs, architecture complexity, maintenance burden, and execution speed.',
      systemPrompt: 'You are a pragmatic CTO. Evaluate software architectures by balancing speed-to-market against long-term architectural debt. Highlight sharp edges, failure modes, and operational trade-offs.',
      recommendedModel: 'GPT-4o',
      tags: ['Engineering', 'Architecture', 'Tech'],
      isArchived: false,
      createdAt: Date.now(),
    },
  ];

  const initialGroup: PersonaGroup = {
    id: 'founders-council',
    name: 'Founders Strategy Council',
    description: 'A multi-agent council for stress-testing business strategies and trade-offs.',
    personaIds: ['skeptical-vc', 'pragmatic-cto', 'stoic-philosopher'],
    synthesizerPersonaId: 'stoic-philosopher',
    createdAt: Date.now(),
  };

  tx.table('personas').bulkAdd(initialPersonas);
  tx.table('groups').add(initialGroup);
});
