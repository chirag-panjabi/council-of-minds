"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { Search, CheckCircle2 } from 'lucide-react';
import { personaRepository } from '../../lib/db/repositories/persona';
import { LocalPersona } from '../../lib/schemas/persona';
import { generateAvatarSvg } from '../../lib/utils/avatar';

export type PersonaSelectorMode = 'single' | 'council-debaters' | 'council-synthesizer';

export interface PersonaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  mode: PersonaSelectorMode;
  onSelect: (selectedIds: string[], isIncognito: boolean) => void;
  initialSelectedIds?: string[];
}

export function PersonaSelector({ 
  isOpen, 
  onClose, 
  mode, 
  onSelect, 
  initialSelectedIds = [] 
}: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<LocalPersona[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [isIncognito, setIsIncognito] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIds(new Set(initialSelectedIds));
      setIsIncognito(false);
      loadPersonas('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadPersonas = async (query: string) => {
    const data = await personaRepository.search(query, 'all');
    setPersonas(data);
  };

  useEffect(() => {
    if (isOpen) {
      loadPersonas(search);
    }
  }, [search, isOpen]);

  const handleToggleSelect = (id: string) => {
    if (mode === 'single' || mode === 'council-synthesizer') {
      onSelect([id], isIncognito);
      onClose();
    } else {
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSelectedIds(next);
    }
  };

  const handleConfirmMulti = () => {
    onSelect(Array.from(selectedIds), isIncognito);
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'council-debaters': return 'Select Council Members';
      case 'council-synthesizer': return 'Select Synthesizer';
      default: return 'Select Persona';
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={getTitle()} className="max-w-3xl">
      <div className="flex flex-col space-y-4 h-[60vh] min-h-[400px]">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search personas..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 shrink-0 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md">
            <input
              type="checkbox"
              id="incognito-toggle"
              checked={isIncognito}
              onChange={(e) => setIsIncognito(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="incognito-toggle" className="text-sm font-medium cursor-pointer">
              Incognito Session
            </label>
          </div>
        </div>

        {/* Persona Grid */}
        <div className="flex-grow overflow-y-auto min-h-0 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2">
          {personas.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              No personas found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personas.map(persona => {
                const isSelected = selectedIds.has(persona.id);
                const avatarSrc = persona.avatar || generateAvatarSvg(persona.name);
                return (
                  <button
                    key={persona.id}
                    onClick={() => handleToggleSelect(persona.id)}
                    className={`flex items-start p-3 text-left rounded-lg border-2 transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-transparent bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                    }`}
                  >
                    <img 
                      src={avatarSrc} 
                      alt={persona.name} 
                      className="w-12 h-12 rounded-lg object-cover bg-gray-200 shrink-0 mr-3"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">
                        {persona.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {persona.description || 'No description provided.'}
                      </p>
                    </div>
                    {isSelected && mode === 'council-debaters' && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer for Multi-Select */}
        {mode === 'council-debaters' && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedIds.size} selected
            </span>
            <div className="space-x-3">
              <button 
                className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <Button 
                onClick={handleConfirmMulti} 
                disabled={selectedIds.size === 0}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
