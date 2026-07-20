import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../index';
import { personaRepository } from '../persona';
import { DEFAULT_PERSONAS } from '../../fixtures/personas';

describe('personaRepository', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('should seed default personas via populate hook', async () => {
    const all = await personaRepository.getAll(true);
    expect(all.length).toBe(DEFAULT_PERSONAS.length);
  });

  it('should support searching personas by name and description', async () => {
    const all = await personaRepository.search('Acharya', 'all');
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].name).toContain('Acharya');

    const byDesc = await personaRepository.search('ego', 'all');
    expect(byDesc.length).toBeGreaterThan(0);
  });

  it('should support filtering personas by favorites and archived', async () => {
    const testPersona = {
      id: crypto.randomUUID(),
      name: 'Test',
      instructions: 'Test',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
      isArchived: false,
    };
    await personaRepository.save(testPersona);
    
    // Toggle favorite
    await personaRepository.toggleFavorite(testPersona.id);
    const favs = await personaRepository.search('', 'favorites');
    expect(favs.some(p => p.id === testPersona.id)).toBe(true);

    // Toggle archive
    await personaRepository.toggleArchive(testPersona.id);
    const archived = await personaRepository.search('', 'archived');
    expect(archived.some(p => p.id === testPersona.id)).toBe(true);

    // Should not be in all (since all filters out archived)
    const all = await personaRepository.search('', 'all');
    expect(all.some(p => p.id === testPersona.id)).toBe(false);
  });
  
  it('should correctly delete a persona', async () => {
    const id = DEFAULT_PERSONAS[0].id;
    await personaRepository.delete(id);
    const persona = await personaRepository.get(id);
    expect(persona).toBeUndefined();
  });
});
