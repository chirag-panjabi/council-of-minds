'use client';

import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import type { PersonaGroup } from '@/types';
import { Users, Plus, Play, Edit2, Trash2, Copy, Search, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { RosterTemplateSelector } from '@/components/personas/RosterTemplateSelector';

/* Hallmark · genre: editorial · macrostructure: 14-narrative-workflow · theme: studio · nav: N1b */

export default function PersonaGroupsPage() {
  const groups = useLiveQuery(() => db.groups.toArray()) || [];
  const personas = useLiveQuery(() => db.personas.toArray()) || [];

  // Form State for Roster Construction Workflow (14-narrative-workflow)
  const [showForm, setShowForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [synthesizerId, setSynthesizerId] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Quick Dilemma Launcher Modal State
  const [launchingGroup, setLaunchingGroup] = useState<PersonaGroup | null>(null);
  const [dilemmaTopic, setDilemmaTopic] = useState('');

  const filteredCandidates = personas.filter(
    (p) =>
      p.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      p.role.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const handleOpenForm = (group?: PersonaGroup) => {
    if (group) {
      setEditingGroupId(group.id);
      setGroupName(group.name);
      setGroupDesc(group.description);
      setSelectedPersonaIds(group.personaIds || []);
      setSynthesizerId(group.synthesizerPersonaId || group.personaIds?.[0] || '');
    } else {
      setEditingGroupId(null);
      setGroupName('');
      setGroupDesc('');
      setSelectedPersonaIds([]);
      setSynthesizerId('');
    }
    setShowForm(true);
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedPersonaIds.length === 0) return;

    if (editingGroupId) {
      await db.groups.update(editingGroupId, {
        name: groupName.trim(),
        description: groupDesc.trim(),
        personaIds: selectedPersonaIds,
        synthesizerPersonaId: synthesizerId || selectedPersonaIds[0],
      });
    } else {
      const newGroup: PersonaGroup = {
        id: 'group-' + Date.now(),
        name: groupName.trim(),
        description: groupDesc.trim(),
        personaIds: selectedPersonaIds,
        synthesizerPersonaId: synthesizerId || selectedPersonaIds[0],
        createdAt: Date.now(),
      };
      await db.groups.add(newGroup);
    }

    setShowForm(false);
  };

  const handleDuplicate = async (group: PersonaGroup) => {
    const dup: PersonaGroup = {
      id: 'group-' + Date.now(),
      name: `${group.name} (Copy)`,
      description: group.description,
      personaIds: [...group.personaIds],
      synthesizerPersonaId: group.synthesizerPersonaId,
      createdAt: Date.now(),
    };
    await db.groups.add(dup);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete roster group "${name}"?`)) {
      await db.groups.delete(id);
    }
  };

  const togglePersonaSelect = (id: string) => {
    if (selectedPersonaIds.includes(id)) {
      const next = selectedPersonaIds.filter((pId) => pId !== id);
      setSelectedPersonaIds(next);
      if (synthesizerId === id) setSynthesizerId(next[0] || '');
    } else {
      const next = [...selectedPersonaIds, id];
      setSelectedPersonaIds(next);
      if (!synthesizerId) setSynthesizerId(id);
    }
  };

  return (
    <Shell>
      <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-10">
        {/* Header Bar (N1b) */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border-hairline)] pb-6">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-normal text-[var(--color-ink)]">
              Persona Groups & Rosters
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
              Debate Panel Configurations • {groups.length} Active Rosters
            </p>
          </div>

          <button
            onClick={() => handleOpenForm()}
            className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] gap-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          >
            <Plus className="w-3.5 h-3.5" /> Create Custom Roster Panel
          </button>
        </header>

        {/* Curated Roster Template Selector Section */}
        <RosterTemplateSelector />

        {/* Saved Roster Panels Grid */}
        <div className="space-y-4 pt-4 border-t border-[var(--color-border-hairline)]">
          <h2 className="font-display text-2xl text-[var(--color-ink)]">Saved Roster Panels</h2>

          {groups.length === 0 ? (
            <div className="p-12 border border-dashed border-[var(--color-border)] rounded-[var(--radius-md)] text-center space-y-3">
              <div className="font-display text-xl text-[var(--color-ink)]">No saved roster panels</div>
              <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mx-auto">
                Create a custom debater roster or click a template preset above to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const groupPersonas = personas.filter((p) => group.personaIds?.includes(p.id));
                const synth = personas.find((p) => p.id === group.synthesizerPersonaId);

                return (
                  <div
                    key={group.id}
                    className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] hover:border-[var(--color-border)] rounded-[var(--radius-md)] flex flex-col justify-between space-y-6 group transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg text-[var(--color-ink)]">{group.name}</h3>
                          <div className="text-xs font-mono text-[var(--color-ink-muted)]">
                            {groupPersonas.length} Debater Personas
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicate(group)}
                            aria-label={`Duplicate ${group.name}`}
                            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none"
                            title="Duplicate Roster"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenForm(group)}
                            aria-label={`Edit ${group.name}`}
                            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] rounded focus:outline-none"
                            title="Edit Roster"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(group.id, group.name)}
                            aria-label={`Delete ${group.name}`}
                            className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] rounded focus:outline-none"
                            title="Delete Roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs leading-relaxed text-[var(--color-ink-muted)] line-clamp-2">
                        {group.description}
                      </p>

                      {/* Member Avatars */}
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-mono text-[var(--color-ink-muted)] uppercase">Roster Members:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {groupPersonas.map((p) => (
                            <span
                              key={p.id}
                              className="px-2.5 py-1 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-full text-xs font-mono text-[var(--color-ink)] flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {synth && (
                        <div className="text-xs font-mono text-[var(--color-ink-muted)] pt-1">
                          Synthesizer: <span className="text-[var(--color-accent)] font-semibold">{synth.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[var(--color-border-hairline)] flex justify-end">
                      <button
                        onClick={() => setLaunchingGroup(group)}
                        className="btn-hallmark text-xs gap-1.5 bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Launch Council Debate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Dilemma Topic Launcher Modal */}
        {launchingGroup && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
                <h3 className="font-display text-xl text-[var(--color-ink)]">
                  Launch Debate: {launchingGroup.name}
                </h3>
                <button onClick={() => setLaunchingGroup(null)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                  ✕
                </button>
              </div>

              <p className="text-xs text-[var(--color-ink-muted)]">
                Enter an initial dilemma topic or scenario prompt for the debaters to analyze.
              </p>

              <textarea
                value={dilemmaTopic}
                onChange={(e) => setDilemmaTopic(e.target.value)}
                placeholder="e.g. Should we pivot our core infrastructure to a local-first BYOK model?"
                rows={4}
                className="w-full p-3 font-body text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setLaunchingGroup(null)} className="btn-hallmark text-xs bg-[var(--color-paper-2)]">
                  Cancel
                </button>
                <Link
                  href={`/chat/council/new?group=${launchingGroup.id}${dilemmaTopic ? `&topic=${encodeURIComponent(dilemmaTopic)}` : ''}`}
                  onClick={() => setLaunchingGroup(null)}
                  className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                >
                  Start Debate Session
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 4-Phase Roster Construction Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-md)] max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-3">
                <h3 className="font-display text-xl text-[var(--color-ink)]">
                  {editingGroupId ? 'Edit Roster Group' : 'Construct New Roster Panel'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveGroup} className="space-y-6">
                {/* Phase 1.0: Group Identity */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
                    Phase 1.0 — Panel Identity
                  </h4>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Roster Group Name (e.g. Executive Board)"
                    required
                    className="w-full px-3 py-2 text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)] font-display text-lg"
                  />
                  <input
                    type="text"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder="Brief description of panel purpose..."
                    className="w-full px-3 py-2 text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-focus)]"
                  />
                </div>

                {/* Phase 2.0: Member Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
                      Phase 2.0 — Debater Selection ({selectedPersonaIds.length} Selected)
                    </h4>
                    <div className="relative w-48">
                      <Search className="w-3.5 h-3.5 text-[var(--color-ink-muted)] absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        placeholder="Search personas..."
                        className="w-full pl-7 pr-2 py-1 text-[10px] bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded">
                    {filteredCandidates.map((p) => {
                      const isSelected = selectedPersonaIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePersonaSelect(p.id)}
                          className={`p-2 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] text-[var(--color-ink)] font-semibold'
                              : 'bg-[var(--color-paper)] border border-[var(--color-border-hairline)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                          }`}
                        >
                          <div className="truncate">
                            <div>{p.name}</div>
                            <div className="text-[10px] font-mono text-[var(--color-ink-muted)]">{p.role}</div>
                          </div>
                          <span className="font-mono text-xs">{isSelected ? '✓' : '+'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Phase 3.0: Synthesizer Selection */}
                {selectedPersonaIds.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-muted)]">
                      Phase 3.0 — Synthesizer Persona
                    </h4>
                    <select
                      value={synthesizerId}
                      onChange={(e) => setSynthesizerId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[var(--color-paper-2)] border border-[var(--color-border)] rounded text-[var(--color-ink)] font-mono"
                    >
                      {personas
                        .filter((p) => selectedPersonaIds.includes(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            Synthesizer: {p.name} ({p.role})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Save Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border-hairline)]">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-hallmark text-xs bg-[var(--color-paper-2)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!groupName.trim() || selectedPersonaIds.length === 0}
                    className="btn-hallmark text-xs bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
                  >
                    {editingGroupId ? 'Update Roster' : 'Save Roster Panel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
