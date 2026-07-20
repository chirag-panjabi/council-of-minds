import React, { useState, useEffect } from 'react';
import { LocalPersona } from '../../lib/schemas/persona';
import { encodePersona, ExportPersonaOptions } from '../../lib/personas/codec';
import { Button } from '../ui/button';
import { X, Copy, Check } from 'lucide-react';

interface ExportPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: LocalPersona | null;
}

export function ExportPersonaModal({ isOpen, onClose, persona }: ExportPersonaModalProps) {
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<ExportPersonaOptions>({
    includeAvatar: true,
    includeDescription: true,
    includeAdvancedRules: true,
    includeTags: true,
    includeUiColor: false,
    includeRecommendedModel: false,
    includeIsCouncilMember: false,
    includeWelcomeMessage: false,
    includePrice: false,
    includeDefaultWordLimit: false,
    includeIsFavorite: false,
    includeIsArchived: false,
    includeLastUsedAt: false,
  });

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setOptions({
        includeAvatar: true,
        includeDescription: true,
        includeAdvancedRules: true,
        includeTags: true,
        includeUiColor: false,
        includeRecommendedModel: false,
        includeIsCouncilMember: false,
        includeWelcomeMessage: false,
        includePrice: false,
        includeDefaultWordLimit: false,
        includeIsFavorite: false,
        includeIsArchived: false,
        includeLastUsedAt: false,
      });
    }
  }, [isOpen]);

  if (!isOpen || !persona) return null;

  const handleExport = async () => {
    try {
      const encoded = encodePersona(persona, options);
      await navigator.clipboard.writeText(encoded);
      setCopied(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Failed to export persona:', e);
      alert('Failed to export persona to clipboard.');
    }
  };

  const handleToggle = (key: keyof ExportPersonaOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 my-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Export Persona</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Select which fields to include in the exported persona for <strong>{persona.name}</strong>.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Standard Fields</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeAvatar} onChange={() => handleToggle('includeAvatar')} />
                  <span>Avatar</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeDescription} onChange={() => handleToggle('includeDescription')} />
                  <span>Description</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeAdvancedRules} onChange={() => handleToggle('includeAdvancedRules')} />
                  <span>Advanced Rules</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeTags} onChange={() => handleToggle('includeTags')} />
                  <span>Tags</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Local Configuration (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeDefaultWordLimit} onChange={() => handleToggle('includeDefaultWordLimit')} />
                  <span>Default Word Limit</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeWelcomeMessage} onChange={() => handleToggle('includeWelcomeMessage')} />
                  <span>Welcome Message</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeUiColor} onChange={() => handleToggle('includeUiColor')} />
                  <span>UI Color</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeRecommendedModel} onChange={() => handleToggle('includeRecommendedModel')} />
                  <span>Recommended Model</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeIsCouncilMember} onChange={() => handleToggle('includeIsCouncilMember')} />
                  <span>Is Council Member</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includePrice} onChange={() => handleToggle('includePrice')} />
                  <span>Price</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeIsFavorite} onChange={() => handleToggle('includeIsFavorite')} />
                  <span>Is Favorite</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeIsArchived} onChange={() => handleToggle('includeIsArchived')} />
                  <span>Is Archived</span>
                </label>
                <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600" checked={options.includeLastUsedAt} onChange={() => handleToggle('includeLastUsedAt')} />
                  <span>Last Used At</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
            Cancel
          </button>
          <Button onClick={handleExport} className="min-w-[140px]">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
