'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { PersonaGroup } from '@/types';
import { ArrowLeft, Sparkles, Plus, Check, Trash2, Play, Copy } from 'lucide-react';

/* Hallmark · genre: editorial · macrostructure: 14-narrative-workflow · theme: riso · nav: N1b · footer: Ft4 */

export default function PersonaGroupsPage() {
  const router = useRouter();

  const personas = useLiveQuery(() => db.personas.where('isArchived').equals(0).toArray()) || [];
  const groups = useLiveQuery(() => db.groups.toArray()) || [];

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [synthesizerPersonaId, setSynthesizerPersonaId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleStartCreate = () => {
    setEditingGroupId(null);
    setName('');
    setDescription('');
    setSelectedPersonaIds(personas.slice(0, 3).map((p) => p.id));
    setSynthesizerPersonaId(personas[0]?.id || '');
  };

  const handleStartEdit = (group: PersonaGroup) => {
    setEditingGroupId(group.id);
    setName(group.name);
    setDescription(group.description);
    setSelectedPersonaIds(group.personaIds);
    setSynthesizerPersonaId(group.synthesizerPersonaId || group.personaIds[0] || '');
  };

  const handleDuplicateGroup = async (group: PersonaGroup) => {
    const newGroupId = 'group-' + Date.now();
    const duplicatedGroup: PersonaGroup = {
      ...group,
      id: newGroupId,
      name: `${group.name} (Copy)`,
      createdAt: Date.now(),
    };

    await db.groups.add(duplicatedGroup);
    handleStartEdit(duplicatedGroup);
  };

  const handleTogglePersonaSelect = (personaId: string) => {
    if (selectedPersonaIds.includes(personaId)) {
      if (selectedPersonaIds.length <= 1) return; // Prevent empty roster
      const next = selectedPersonaIds.filter((id) => id !== personaId);
      setSelectedPersonaIds(next);
      if (synthesizerPersonaId === personaId) {
        setSynthesizerPersonaId(next[0] || '');
      }
    } else {
      setSelectedPersonaIds([...selectedPersonaIds, personaId]);
    }
  };

  const handleSaveGroup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim() || selectedPersonaIds.length === 0) return;

    setIsSaving(true);

    if (editingGroupId) {
      await db.groups.update(editingGroupId, {
        name: name.trim(),
        description: description.trim(),
        personaIds: selectedPersonaIds,
        synthesizerPersonaId: synthesizerPersonaId || selectedPersonaIds[0],
      });
    } else {
      await db.groups.add({
        id: 'group-' + Date.now(),
        name: name.trim(),
        description: description.trim(),
        personaIds: selectedPersonaIds,
        synthesizerPersonaId: synthesizerPersonaId || selectedPersonaIds[0],
        createdAt: Date.now(),
      });
    }

    setIsSaving(false);
    handleStartCreate();
  };

  const handleLaunchCouncilDebate = async (group: PersonaGroup) => {
    const newChatId = 'chat-' + Date.now();
    await db.chats.add({
      id: newChatId,
      title: `${group.name} Debate`,
      type: 'council',
      groupId: group.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    router.push(`/chat/council/${newChatId}`);
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (confirm(`Are you sure you want to delete group "${groupName}"?`)) {
      await db.groups.delete(groupId);
    }
  };

  return (
    <Shell>
      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        {/* N1b Navigation Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--color-border-hairline)] pb-4 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-semibold">
              Roster Construction Surface
            </div>
            <h1 className="font-display text-4xl text-[var(--color-ink)]">Persona Groups & Rosters</h1>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Assemble multi-agent debate panels, assign moderators, and launch Council sessions.
            </p>
          </div>

          <Link
            href="/personas"
            aria-label="Back to Persona Library"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </Link>
        </header>

        {/* Existing Saved Groups Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-[var(--color-ink)]">Saved Roster Panels ({groups.length})</h2>
            <button
              onClick={handleStartCreate}
              aria-label="Create New Persona Group"
              className="btn-hallmark text-xs gap-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              <Plus className="w-3.5 h-3.5" /> New Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-ink-muted)] italic">
              No saved persona groups. Use the step-by-step workflow below to create your first Council roster.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => {
                const groupMembers = personas.filter((p) => group.personaIds.includes(p.id));
                const synth = personas.find((p) => p.id === group.synthesizerPersonaId);

                return (
                  <div key={group.id} className="p-5 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-xl text-[var(--color-ink)]">{group.name}</h3>
                          <p className="text-xs text-[var(--color-ink-muted)] line-clamp-2">{group.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicateGroup(group)}
                            aria-label={`Duplicate group ${group.name}`}
                            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] rounded"
                            title="Duplicate Group"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            aria-label={`Delete group ${group.name}`}
                            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] focus:outline-none focus:ring-1 focus:ring-[var(--color-error)] rounded"
                            title="Delete Group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[var(--color-border-hairline)]">
                        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
                          Roster Members ({groupMembers.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {groupMembers.map((m) => (
                            <span key={m.id} className="text-xs px-2 py-0.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded font-medium text-[var(--color-ink)]">
                              @{m.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {synth && (
                        <div className="text-xs font-mono text-[var(--color-accent)] pt-1">
                          Moderator/Synthesizer: <span className="font-semibold">@{synth.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleStartEdit(group)}
                        aria-label={`Edit roster for ${group.name}`}
                        className="btn-hallmark text-xs flex-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                      >
                        Edit Roster
                      </button>
                      <button
                        onClick={() => handleLaunchCouncilDebate(group)}
                        aria-label={`Launch Council debate for ${group.name}`}
                        className="btn-hallmark btn-hallmark-primary text-xs flex-1 gap-1 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Launch Debate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 14 · Narrative Workflow Step-by-Step Roster Construction */}
        <form onSubmit={handleSaveGroup} className="p-6 md:p-8 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-8">
          <div className="border-b border-[var(--color-border-hairline)] pb-4">
            <span className="font-mono text-xs text-[var(--color-accent)] font-semibold uppercase tracking-wider">
              14 // Narrative Workflow
            </span>
            <h2 className="font-display text-3xl text-[var(--color-ink)]">
              {editingGroupId ? 'Edit Roster Panel' : 'Construct New Roster Panel'}
            </h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Follow the 4-phase workflow to assemble a balanced multi-agent Council.
            </p>
          </div>

          {/* Phase 1.0 — Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-[var(--color-accent)]">
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-[10px]">1</span>
              Phase 1.0 — Group Identity
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Roster Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Strategic Product Panel"
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-medium focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Panel Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Evaluates market risk, technical debt, and philosophical alignment..."
                  className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
                />
              </div>
            </div>
          </div>

          {/* Phase 2.0 — Member Selection */}
          <div className="space-y-4 pt-4 border-t border-[var(--color-border-hairline)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-[10px]">2</span>
                Phase 2.0 — Member Selection ({selectedPersonaIds.length} Selected)
              </div>
              <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">Select at least 2 personas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {personas.map((p) => {
                const isSelected = selectedPersonaIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => handleTogglePersonaSelect(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTogglePersonaSelect(p.id);
                      }
                    }}
                    className={`p-3 border rounded-[var(--radius-md)] cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] ${
                      isSelected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium'
                        : 'border-[var(--color-border)] bg-[var(--color-paper)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-display text-base font-normal text-[var(--color-ink)]">{p.name}</div>
                      {isSelected && <Check className="w-4 h-4 text-[var(--color-accent)] shrink-0" />}
                    </div>
                    <div className="text-xs text-[var(--color-ink-muted)]">{p.role}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase 3.0 — Synthesizer Assignment */}
          <div className="space-y-4 pt-4 border-t border-[var(--color-border-hairline)]">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-[var(--color-accent)]">
              <span className="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-[10px]">3</span>
              Phase 3.0 — Moderator & Synthesizer Assignment
            </div>

            <div className="space-y-1.5 max-w-md">
              <label className="block text-xs font-mono text-[var(--color-ink-muted)]">Select Council Moderator</label>
              <select
                value={synthesizerPersonaId}
                onChange={(e) => setSynthesizerPersonaId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-paper)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-medium focus:outline-none focus:border-[var(--color-focus)] focus:ring-1 focus:ring-[var(--color-focus)]"
              >
                {personas
                  .filter((p) => selectedPersonaIds.includes(p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      @{p.name} ({p.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Phase 4.0 — Save & Action Triggers */}
          <div className="pt-4 border-t border-[var(--color-border-hairline)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleStartCreate}
              className="btn-hallmark text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)]"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSaving || selectedPersonaIds.length === 0}
              className="btn-hallmark btn-hallmark-primary text-xs gap-1.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" /> {editingGroupId ? 'Update Roster' : 'Save New Roster'}
            </button>
          </div>
        </form>

        {/* Ft4 Dense Colophon Footer */}
        <footer className="border-t border-[var(--color-border-hairline)] pt-4 text-xs font-mono text-[var(--color-ink-faint)] flex justify-between">
          <div>Roster Construction Schema v1.0 • Hallmark Riso Theme</div>
          <div>Council of Minds</div>
        </footer>
      </div>
    </Shell>
  );
}
