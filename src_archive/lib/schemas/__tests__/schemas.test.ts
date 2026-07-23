import { describe, it, expect } from 'vitest';
import {
  PersonaSchema,
  PortablePersonaSchema,
  LocalPersonaSchema,
  SessionSchema,
  MessageSchema,
  AttachmentSchema,
  SummarySchema,
  TokenUsageSchema,
  ProviderCapabilitySchema,
  BackupManifestSchema,
} from '../index';

describe('Domain Schemas', () => {
  describe('PersonaSchema', () => {
    it('validates a correct persona', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'Test Persona',
        instructions: 'You are a test.',
      };
      expect(PersonaSchema.safeParse(data).success).toBe(true);
    });

    it('rejects invalid uuid', () => {
      const data = {
        id: 'invalid-id',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'Test',
        instructions: 'You are a test.',
      };
      expect(PersonaSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('PortablePersonaSchema', () => {
    it('validates portable structure without local preferences', () => {
      const data = {
        version: 'framework-engine.persona/v1',
        persona: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          name: 'Portable',
          instructions: 'Portable test',
        },
      };
      expect(PortablePersonaSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('LocalPersonaSchema', () => {
    it('validates local preferences', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        name: 'Local',
        instructions: 'Local test',
        isFavorite: true,
      };
      expect(LocalPersonaSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('SessionSchema', () => {
    it('validates a valid 1-on-1 session', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'Chat',
        mode: '1-on-1',
        state: 'active',
        participants: [
          {
            personaId: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Test Persona',
            instructions: 'You are a test.',
            role: 'debater',
          }
        ],
      };
      expect(SessionSchema.safeParse(data).success).toBe(true);
    });

    it('rejects missing participants', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        title: 'Chat',
        mode: '1-on-1',
        participants: [], // Invalid
      };
      expect(SessionSchema.safeParse(data).success).toBe(false);
    });
  });

  describe('MessageSchema', () => {
    it('validates a basic user message', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: Date.now(),
        role: 'user',
        content: 'Hello',
      };
      expect(MessageSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('AttachmentSchema', () => {
    it('validates an attachment', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        createdAt: Date.now(),
        name: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      };
      expect(AttachmentSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('ProviderCapabilitySchema', () => {
    it('validates known providers', () => {
      const data = {
        id: 'openai',
        name: 'OpenAI',
        capabilities: {
          transport: 'cloud-proxy',
          modelDiscovery: 'api',
          textStreaming: true,
          imageInput: true,
          attachmentExtraction: false,
          outputTokenControl: true,
          validationStrategy: 'openai',
          errorMapping: true,
        },
      };
      expect(ProviderCapabilitySchema.safeParse(data).success).toBe(true);
    });
  });

  describe('SummarySchema', () => {
    it('validates a summary', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: Date.now(),
        content: 'Test summary content',
      };
      expect(SummarySchema.safeParse(data).success).toBe(true);
    });
  });

  describe('TokenUsageSchema', () => {
    it('validates token usage', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
        createdAt: Date.now(),
        providerId: 'openai',
        modelId: 'gpt-4o',
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      };
      expect(TokenUsageSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('BackupManifestSchema', () => {
    it('validates an empty backup manifest', () => {
      const data = {
        version: 'framework-engine.backup/v1',
        exportDate: Date.now(),
        collections: {
          personas: [],
          sessions: [],
          messages: [],
          attachments: [],
          summaries: [],
          usage: [],
        },
      };
      expect(BackupManifestSchema.safeParse(data).success).toBe(true);
    });
  });
});
