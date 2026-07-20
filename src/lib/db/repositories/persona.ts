import { db } from '../index';
import type { LocalPersona } from '../../schemas';

export class PersonaRepository {
  async get(id: string): Promise<LocalPersona | undefined> {
    return db.personas.get(id);
  }

  async getAll(includeArchived = false): Promise<LocalPersona[]> {
    const all = await db.personas.orderBy('createdAt').reverse().toArray();
    return includeArchived ? all : all.filter(p => !p.isArchived);
  }

  async getRecent(): Promise<LocalPersona[]> {
    const recent = await db.personas
      .where('lastUsedAt')
      .above(0)
      .reverse()
      .sortBy('lastUsedAt');
    return recent.filter(p => !p.isArchived);
  }

  async search(query: string, filter: 'all' | 'favorites' | 'archived' = 'all', tag?: string): Promise<LocalPersona[]> {
    let all = await db.personas.orderBy('createdAt').reverse().toArray();
    
    if (filter === 'favorites') {
      all = all.filter(p => p.isFavorite && !p.isArchived);
    } else if (filter === 'archived') {
      all = all.filter(p => p.isArchived);
    } else {
      all = all.filter(p => !p.isArchived);
    }
    
    if (tag) {
      const lowerTag = tag.toLowerCase();
      all = all.filter(p => p.tags?.some(t => t.toLowerCase() === lowerTag));
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      all = all.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery)))
      );
    }
    
    return all;
  }

  async save(persona: LocalPersona): Promise<string> {
    return db.personas.put(persona);
  }

  async delete(id: string): Promise<void> {
    return db.personas.delete(id);
  }

  async markUsed(id: string): Promise<void> {
    const persona = await db.personas.get(id);
    if (persona) {
      persona.lastUsedAt = Date.now();
      await db.personas.put(persona);
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    const persona = await db.personas.get(id);
    if (persona) {
      persona.isFavorite = !persona.isFavorite;
      persona.updatedAt = Date.now();
      await db.personas.put(persona);
    }
  }

  async toggleArchive(id: string): Promise<void> {
    const persona = await db.personas.get(id);
    if (persona) {
      persona.isArchived = !persona.isArchived;
      persona.updatedAt = Date.now();
      await db.personas.put(persona);
    }
  }
}

export const personaRepository = new PersonaRepository();
