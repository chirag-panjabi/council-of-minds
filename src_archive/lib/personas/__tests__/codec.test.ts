import { describe, it, expect } from 'vitest';
import { encodePersona, decodePersona, CodecError } from '../codec';
import type { LocalPersona } from '../../schemas/persona';

describe('Persona Codec', () => {
  const mockLocalPersona: LocalPersona = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    createdAt: 1000,
    updatedAt: 1000,
    name: 'Test Persona',
    instructions: 'Test instructions with unicode: 🚀',
    isFavorite: true,
    isArchived: false,
    lastUsedAt: 2000,
  };

  it('encodes and decodes correctly round-trip', () => {
    const encoded = encodePersona(mockLocalPersona);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');

    const decoded = decodePersona(encoded);
    
    // Assert stripped fields
    expect(decoded.version).toBe('framework-engine.persona/v1');
    expect(decoded.persona.id).toBe(mockLocalPersona.id);
    expect(decoded.persona.name).toBe(mockLocalPersona.name);
    expect(decoded.persona.instructions).toBe(mockLocalPersona.instructions);
    
    // The decoded persona should NOT have local metadata
    expect((decoded.persona as any).isFavorite).toBeUndefined();
    expect((decoded.persona as any).isArchived).toBeUndefined();
    expect((decoded.persona as any).lastUsedAt).toBeUndefined();
  });

  it('throws CodecError on malformed base64', () => {
    expect(() => decodePersona('not-base-64!@#')).toThrow(CodecError);
  });

  it('throws CodecError on invalid JSON', () => {
    // Encoded '{"invalid": json'
    const invalidJsonBase64 = 'eyJpbnZhbGlkIjoganNvbg';
    expect(() => decodePersona(invalidJsonBase64)).toThrow(CodecError);
  });

  it('throws CodecError on unsupported version', () => {
    const fakePortable = {
      version: 'framework-engine.persona/v999',
      persona: mockLocalPersona,
    };
    const b64 = Buffer.from(JSON.stringify(fakePortable)).toString('base64url');
    expect(() => decodePersona(b64)).toThrow(CodecError);
    expect(() => decodePersona(b64)).toThrow('Invalid portable persona schema version or data.');
  });
});
