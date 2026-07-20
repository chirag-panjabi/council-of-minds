"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  exportBackup,
  parseBackup,
  previewRestore,
  applyRestore,
  wipeData,
  type RestorePreview,
} from '@/lib/services/backup';

type Status = 'idle' | 'exporting' | 'parsing' | 'previewing' | 'restoring' | 'wiping';

export function DataManagementSettings() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [status, setStatus] = React.useState<Status>('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Restore preview state
  const [preview, setPreview] = React.useState<RestorePreview | null>(null);
  const [pendingManifest, setPendingManifest] = React.useState<ReturnType<typeof parseBackup> | null>(null);

  // Wipe confirmation
  const [showWipeConfirm, setShowWipeConfirm] = React.useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // ------ Export -----------------------------------------------------------

  const handleExport = async () => {
    clearMessages();
    setStatus('exporting');
    try {
      const manifest = await exportBackup();
      const json = JSON.stringify(manifest, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `framework-engine-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccessMessage('Backup exported successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setStatus('idle');
    }
  };

  // ------ Restore ----------------------------------------------------------

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    clearMessages();
    setPreview(null);
    setPendingManifest(null);

    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    try {
      const text = await file.text();
      const parsed = parseBackup(text);

      if (!parsed.success) {
        setError(parsed.error);
        setStatus('idle');
        return;
      }

      setPendingManifest(parsed);
      setStatus('previewing');

      const restorePreview = await previewRestore(parsed.manifest);
      setPreview(restorePreview);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read backup file.');
      setStatus('idle');
    }

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestore = async (strategy: 'replace' | 'skip') => {
    clearMessages();
    if (!pendingManifest || !pendingManifest.success) return;

    setStatus('restoring');
    try {
      await applyRestore(pendingManifest.manifest, strategy);
      setSuccessMessage(`Backup restored successfully (${strategy} strategy).`);
      setPreview(null);
      setPendingManifest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setStatus('idle');
    }
  };

  const cancelRestore = () => {
    setPreview(null);
    setPendingManifest(null);
    clearMessages();
  };

  // ------ Wipe -------------------------------------------------------------

  const handleWipe = async () => {
    clearMessages();
    setShowWipeConfirm(false);
    setStatus('wiping');
    try {
      const result = await wipeData();
      if (result.success) {
        router.push('/onboarding');
      } else {
        setError(result.error ?? 'Wipe failed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wipe failed.');
    } finally {
      setStatus('idle');
    }
  };

  const isBusy = status !== 'idle';

  return (
    <section
      aria-labelledby="data-management-title"
      className="space-y-6 rounded-xl border bg-card p-5 shadow-sm mt-6"
    >
      {/* Header */}
      <div>
        <h2 id="data-management-title" className="text-xl font-semibold">
          Data Management
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Export your data as a portable backup, restore from a previous backup, or wipe
          all local data. API keys are never included in backups.
        </p>
      </div>

      {/* Feedback messages */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {successMessage && (
        <div
          role="status"
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}

      {/* Export */}
      <div className="space-y-2">
        <h3 className="text-base font-medium">Export Backup</h3>
        <p className="text-sm text-muted-foreground">
          Download a JSON file containing all your personas, sessions, messages, attachments,
          summaries, and usage records.
        </p>
        <button
          id="export-backup-btn"
          type="button"
          onClick={handleExport}
          disabled={isBusy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {status === 'exporting' ? 'Exporting…' : 'Export Backup'}
        </button>
      </div>

      {/* Restore */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-base font-medium">Restore from Backup</h3>
        <p className="text-sm text-muted-foreground">
          Select a previously exported JSON backup file. You will see a preview before any
          data is written.
        </p>
        <input
          ref={fileInputRef}
          id="restore-file-input"
          aria-label="Select backup file to restore"
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          disabled={isBusy}
          className="block text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
        />
      </div>

      {/* Restore preview */}
      {preview && (
        <div className="space-y-3 rounded-md border p-4 bg-muted/30">
          <h4 className="text-sm font-semibold">Backup Preview</h4>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 pr-4 text-muted-foreground">Personas</td>
                <td className="py-1 font-medium">{preview.personaCount}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-muted-foreground">Sessions</td>
                <td className="py-1 font-medium">{preview.sessionCount}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-muted-foreground">Messages</td>
                <td className="py-1 font-medium">{preview.messageCount}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-muted-foreground">Attachments</td>
                <td className="py-1 font-medium">{preview.attachmentCount}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-muted-foreground">Summaries</td>
                <td className="py-1 font-medium">{preview.summaryCount}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-muted-foreground">Usage records</td>
                <td className="py-1 font-medium">{preview.usageCount}</td>
              </tr>
            </tbody>
          </table>

          {(preview.collisions.personas > 0 || preview.collisions.sessions > 0) && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
              <strong>Collisions detected:</strong>{' '}
              {preview.collisions.personas} persona(s) and{' '}
              {preview.collisions.sessions} session(s) already exist locally.
            </p>
          )}

          <div className="flex gap-2">
            <button
              id="restore-replace-btn"
              type="button"
              onClick={() => handleRestore('replace')}
              disabled={isBusy}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {status === 'restoring' ? 'Restoring…' : 'Replace Existing'}
            </button>
            <button
              id="restore-skip-btn"
              type="button"
              onClick={() => handleRestore('skip')}
              disabled={isBusy}
              className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Skip Existing
            </button>
            <button
              id="restore-cancel-btn"
              type="button"
              onClick={cancelRestore}
              disabled={isBusy}
              className="rounded-md border bg-background px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Wipe */}
      <div className="space-y-2 border-t pt-4">
        <h3 className="text-base font-medium text-red-600">Danger Zone</h3>
        <p className="text-sm text-muted-foreground">
          Permanently delete all local data including personas, sessions, messages, attachments,
          settings, and preferences. This action cannot be undone.
        </p>

        {!showWipeConfirm ? (
          <button
            id="wipe-data-btn"
            type="button"
            onClick={() => { clearMessages(); setShowWipeConfirm(true); }}
            disabled={isBusy}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Delete Everything
          </button>
        ) : (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-medium text-red-800">
              Are you sure? This will permanently delete all your data. There is no cloud
              backup — once deleted, your data is gone forever.
            </p>
            <div className="flex gap-2">
              <button
                id="wipe-confirm-btn"
                type="button"
                onClick={handleWipe}
                disabled={isBusy}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {status === 'wiping' ? 'Deleting…' : 'Yes, Delete Everything'}
              </button>
              <button
                id="wipe-cancel-btn"
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                disabled={isBusy}
                className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
