'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { personaRepository } from '../../lib/db/repositories/persona';
import { LocalPersona } from '../../lib/schemas/persona';
import { Search, Star, Archive, Trash2, ArchiveRestore, Edit, Download, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useRouter } from 'next/navigation';
import { encodePersona } from '../../lib/personas/codec';
import { PersonaImportModal } from '../../components/personas/PersonaImportModal';
import { ExportPersonaModal } from '../../components/personas/ExportPersonaModal';
import { GlobalSettingsModal } from '../../components/settings/GlobalSettingsModal';
import { Upload, Settings } from 'lucide-react';
import { sessionRepository } from '../../lib/db/repositories/session';

type FilterType = 'all' | 'favorites' | 'archived';

export default function PersonaList() {
  const [personas, setPersonas] = useState<LocalPersona[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);
  const router = useRouter();
  
  const loadPersonas = useCallback(async () => {
    const data = await personaRepository.search(search, filter, selectedTag || undefined);
    setPersonas(data);
  }, [search, filter, selectedTag]);
  
  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);
  
  useEffect(() => {
    const fetchTags = async () => {
      const allData = await personaRepository.getAll();
      const tags = new Set<string>();
      allData.forEach(p => {
        if (p.tags) {
          p.tags.forEach(t => tags.add(t));
        }
      });
      setAllTags(Array.from(tags).sort());
    };
    fetchTags();
  }, [personas]);
  
  const handleToggleFavorite = async (id: string) => {
    await personaRepository.toggleFavorite(id);
    await loadPersonas();
  };
  
  const handleToggleArchive = async (id: string) => {
    await personaRepository.toggleArchive(id);
    await loadPersonas();
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      await personaRepository.delete(id);
      await loadPersonas();
    }
  };

  const [exportModalPersona, setExportModalPersona] = useState<LocalPersona | null>(null);

  const handleExport = (persona: LocalPersona) => {
    setExportModalPersona(persona);
  };

  const handleChat = async (persona: LocalPersona) => {
    try {
      const session = await sessionRepository.createSession(
        '1-on-1',
        [{
          personaId: persona.id,
          name: persona.name,
          description: persona.description,
          instructions: persona.instructions,
          avatar: persona.avatar,
          role: 'debater',
          wordLimit: persona.defaultWordLimit
        }],
        `Chat with ${persona.name}`,
        false
      );
      router.push(`/chat/1-on-1/${session.id}`);
    } catch (e) {
      console.error('Failed to start chat:', e);
      alert('Failed to start chat session.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search personas..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md font-semibold focus:outline-none transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`px-4 py-2 rounded-md font-semibold focus:outline-none transition-colors ${filter === 'favorites' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            Favorites
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 rounded-md font-semibold focus:outline-none transition-colors ${filter === 'archived' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            Archived
          </button>
          <button
            onClick={() => setIsGlobalSettingsOpen(true)}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none transition-colors"
            title="Global Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 focus:outline-none transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">Tags:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTag === tag 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas.map(persona => (
          <div key={persona.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{persona.name}</h3>
                <button
                  onClick={() => handleToggleFavorite(persona.id)}
                  className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${persona.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}
                  aria-label={persona.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className="h-5 w-5" fill={persona.isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">
                {persona.description || 'No description provided.'}
              </p>
              {persona.tags && persona.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {persona.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 px-5 py-3 border-t border-gray-200 dark:border-gray-700 rounded-b-lg flex justify-end space-x-2">
              <button
                onClick={() => handleChat(persona)}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Chat"
                title="Chat"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <Link
                href={`/personas/${persona.id}/edit`}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Edit"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={() => handleToggleArchive(persona.id)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label={persona.isArchived ? 'Unarchive' : 'Archive'}
                title={persona.isArchived ? 'Unarchive' : 'Archive'}
              >
                {persona.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleExport(persona)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Export"
                title="Export"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(persona.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {personas.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No personas found matching your criteria.
        </div>
      )}

      <PersonaImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={() => loadPersonas()} 
      />

      <ExportPersonaModal
        isOpen={exportModalPersona !== null}
        onClose={() => setExportModalPersona(null)}
        persona={exportModalPersona}
      />

      <GlobalSettingsModal
        isOpen={isGlobalSettingsOpen}
        onClose={() => setIsGlobalSettingsOpen(false)}
      />
    </div>
  );
}
