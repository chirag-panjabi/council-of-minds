import React from 'react';

interface AutoPilotConfirmModalProps {
  isOpen: boolean;
  turnCap: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AutoPilotConfirmModal({ isOpen, turnCap, onConfirm, onCancel }: AutoPilotConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="autopilot-modal-title">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
        <h2 id="autopilot-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Enable Auto-Pilot?
        </h2>
        
        <p className="text-gray-700 dark:text-gray-300">
          Enabling Auto-Pilot will automatically generate up to <strong>{turnCap}</strong> turns. Each turn may incur provider costs.
        </p>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm"
          >
            Enable Auto-Pilot
          </button>
        </div>
      </div>
    </div>
  );
}
