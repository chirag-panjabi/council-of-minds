'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ShieldAlert, Sparkles, Sliders, MessageSquare } from 'lucide-react';

/* Hallmark · component: AdvancedRulesBuilder · genre: studio · theme: studio · spec: spec_persona_library.md §3.2 */

export type RuleCategory = 'Tone' | 'Style' | 'Taboo' | 'Formatting';

export interface PersonaRule {
  id: string;
  category: RuleCategory;
  content: string;
}

interface AdvancedRulesBuilderProps {
  rules: PersonaRule[];
  onChange: (updatedRules: PersonaRule[]) => void;
}

export function formatRulesBlock(rules: PersonaRule[]): string {
  if (!rules || rules.length === 0) return '';

  let block = '\n\n--- ADVANCED DIRECTIVE RULES ---\n';
  rules.forEach((rule) => {
    if (rule.content.trim()) {
      block += `- [${rule.category}]: ${rule.content.trim()}\n`;
    }
  });
  return block;
}

export function parseRulesFromPrompt(systemPrompt: string): { basePrompt: string; rules: PersonaRule[] } {
  if (!systemPrompt || !systemPrompt.includes('--- ADVANCED DIRECTIVE RULES ---')) {
    return { basePrompt: systemPrompt || '', rules: [] };
  }

  const parts = systemPrompt.split('--- ADVANCED DIRECTIVE RULES ---');
  const basePrompt = parts[0].trim();
  const rulesRaw = parts[1] || '';

  const rules: PersonaRule[] = [];
  const lines = rulesRaw.split('\n');

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [')) {
      const match = trimmed.match(/^- \[(Tone|Style|Taboo|Formatting)\]:\s*(.*)$/);
      if (match) {
        rules.push({
          id: 'rule-' + Math.random().toString(36).substr(2, 6),
          category: match[1] as RuleCategory,
          content: match[2],
        });
      }
    }
  });

  return { basePrompt, rules };
}

export function AdvancedRulesBuilder({ rules, onChange }: AdvancedRulesBuilderProps) {
  const [newCategory, setNewCategory] = useState<RuleCategory>('Tone');
  const [newContent, setNewContent] = useState('');

  const handleAddRule = () => {
    if (!newContent.trim()) return;

    const rule: PersonaRule = {
      id: 'rule-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      category: newCategory,
      content: newContent.trim(),
    };

    onChange([...rules, rule]);
    setNewContent('');
  };

  const handleRemoveRule = (id: string) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4 p-4 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[var(--color-accent)]" />
          <h3 className="text-xs font-mono font-semibold text-[var(--color-ink)] uppercase tracking-wider">
            Advanced Persona Rules & Constraints
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
          {rules.length} Rule(s) Configured
        </span>
      </div>

      {/* Existing Rules List */}
      {rules.length > 0 && (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-2.5 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-sm)] flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    rule.category === 'Tone'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : rule.category === 'Style'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : rule.category === 'Taboo'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {rule.category}
                </span>
                <span className="font-mono text-[var(--color-ink)] truncate">{rule.content}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRule(rule.id)}
                aria-label="Remove rule"
                className="p-1 text-[var(--color-ink-muted)] hover:text-[var(--color-error)] transition-colors rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Rule Form Controls */}
      <div className="pt-2 border-t border-[var(--color-border-hairline)] space-y-2">
        <div className="text-[11px] font-mono text-[var(--color-ink-muted)]">Add Behavioral Directive:</div>
        <div className="flex items-center gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as RuleCategory)}
            className="px-2.5 py-1.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)] shrink-0"
          >
            <option value="Tone">Tone & Stance</option>
            <option value="Style">Argument Style</option>
            <option value="Taboo">Taboo / Forbidden</option>
            <option value="Formatting">Formatting</option>
          </select>
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={
              newCategory === 'Tone'
                ? 'e.g. Maintain a rigorous Socratic questioning tone'
                : newCategory === 'Style'
                ? 'e.g. Always reason from first principles'
                : newCategory === 'Taboo'
                ? 'e.g. Never use buzzwords or fluff adjectives'
                : 'e.g. Format main takeaways in bullet points'
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRule();
              }
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-[var(--color-paper)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-ink)] font-mono focus:outline-none focus:border-[var(--color-focus)]"
          />
          <button
            type="button"
            onClick={handleAddRule}
            disabled={!newContent.trim()}
            className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-sm)] transition-all disabled:opacity-40 flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
