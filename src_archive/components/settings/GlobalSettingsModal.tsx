import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../ui/button';
import { settingsRepository, GlobalSettings } from '../../lib/db/repositories/settings';

interface GlobalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
  const [settings, setSettings] = useState<GlobalSettings>({});

  useEffect(() => {
    if (isOpen) {
      setSettings(settingsRepository.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    settingsRepository.saveSettings(settings);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Global Settings">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          These settings apply to all personas by default, unless overridden by an individual persona&apos;s local configuration.
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Global Default Word Limit
            </label>
            <input
              type="number"
              min="1"
              value={settings.defaultWordLimit || ''}
              onChange={(e) => setSettings({ ...settings, defaultWordLimit: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="e.g., 50 (leave empty for no limit)"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The maximum number of words a persona should speak in a single response, if not explicitly overridden.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
            Cancel
          </button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
