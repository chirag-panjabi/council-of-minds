'use client';

import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { decodePersona, CodecError } from '../../lib/personas/codec';
import { personaRepository } from '../../lib/db/repositories/persona';
import type { LocalPersona } from '../../lib/schemas/persona';
import { generateId } from '../../lib/utils/uuid';

interface PersonaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

type CollisionAction = 'replace' | 'duplicate' | 'skip';

export function PersonaImportModal({ isOpen, onClose, onImportSuccess }: PersonaImportModalProps) {
  const [pastedData, setPastedData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LocalPersona | null>(null);
  const [collisionDetected, setCollisionDetected] = useState(false);

  const handleDecode = async () => {
    setError(null);
    try {
      if (!pastedData.trim()) throw new Error('Input is empty.');
      const portable = decodePersona(pastedData.trim());
      
      const newPersona: LocalPersona = {
        ...portable.persona,
        isFavorite: false,
        isArchived: false,
        ...(portable.localConfig || {})
      };

      setPreview(newPersona);
      
      // Check collision
      const existing = await personaRepository.get(newPersona.id);
      if (existing) {
        setCollisionDetected(true);
      } else {
        setCollisionDetected(false);
      }
    } catch (err) {
      if (err instanceof CodecError) {
        setError(err.message);
      } else {
        setError('Failed to process input data.');
      }
      setPreview(null);
      setCollisionDetected(false);
    }
  };

  const handleAction = async (action: CollisionAction) => {
    if (!preview) return;

    try {
      if (action === 'skip') {
        // do nothing
      } else if (action === 'replace') {
        await personaRepository.save(preview);
      } else if (action === 'duplicate') {
        const duplicated = {
          ...preview,
          id: generateId(),
          name: preview.name + ' (Copy)'
        };
        await personaRepository.save(duplicated);
      }
      onImportSuccess();
      handleClose();
    } catch (err) {
      setError('Failed to save persona.');
    }
  };

  const handleImportNew = async () => {
    if (!preview) return;
    try {
      await personaRepository.save(preview);
      onImportSuccess();
      handleClose();
    } catch (err) {
      setError('Failed to save persona.');
    }
  };

  const handleClose = () => {
    setPastedData('');
    setError(null);
    setPreview(null);
    setCollisionDetected(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Import Persona">
      <div className="space-y-4">
        {!preview ? (
          <>
            <textarea
              className="w-full h-32 p-2 border rounded-md dark:bg-gray-900 dark:border-gray-700 dark:text-white"
              placeholder="Paste Base64URL persona data here..."
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end space-x-2">
              <button className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleClose}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleDecode}>Preview</button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
              <h3 className="font-semibold text-lg">{preview.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3">{preview.description || 'No description'}</p>
            </div>

            {collisionDetected ? (
              <div className="space-y-3">
                <p className="text-amber-600 dark:text-amber-400 font-medium">A persona with this ID already exists. How would you like to proceed?</p>
                <div className="flex flex-col space-y-2">
                  <button onClick={() => handleAction('replace')} className="px-4 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded">Replace Existing</button>
                  <button onClick={() => handleAction('duplicate')} className="px-4 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded">Duplicate (New ID)</button>
                  <button onClick={() => handleAction('skip')} className="px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded">Skip</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end space-x-2">
                <button className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleClose}>Cancel</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleImportNew}>Import</button>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
