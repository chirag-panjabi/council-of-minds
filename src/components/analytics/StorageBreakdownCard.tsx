'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, Database, Layers, FileText, CheckCircle2, Shield } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

/* Hallmark · component: StorageBreakdownCard · genre: studio · theme: studio · spec: spec_analytics.md (§8.1) */

export function StorageBreakdownCard() {
  const personas = useLiveQuery(() => db.personas.toArray()) || [];
  const chats = useLiveQuery(() => db.chats.toArray()) || [];
  const messages = useLiveQuery(() => db.messages.toArray()) || [];
  const usage = useLiveQuery(() => db.usage.toArray()) || [];

  const [localStorageCount, setLocalStorageCount] = useState<number>(0);
  const [localStorageSizeBytes, setLocalStorageSizeBytes] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let count = 0;
      let totalBytes = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('framework-engine:')) {
          count++;
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2; // UTF-16 approximate bytes
        }
      }

      setLocalStorageCount(count);
      setLocalStorageSizeBytes(totalBytes);
    }
  }, []);

  // Estimate IndexedDB byte size (~2 bytes per char of stringified content)
  const personaBytes = personas.reduce((acc, p) => acc + JSON.stringify(p).length * 2, 0);
  const chatBytes = chats.reduce((acc, c) => acc + JSON.stringify(c).length * 2, 0);
  const messageBytes = messages.reduce((acc, m) => acc + JSON.stringify(m).length * 2, 0);
  const usageBytes = usage.reduce((acc, u) => acc + JSON.stringify(u).length * 2, 0);

  const indexedDbTotalBytes = personaBytes + chatBytes + messageBytes + usageBytes;
  const grandTotalBytes = indexedDbTotalBytes + localStorageSizeBytes;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getPercent = (bytes: number) => {
    if (grandTotalBytes === 0) return 0;
    return Math.min(100, (bytes / grandTotalBytes) * 100);
  };

  return (
    <div className="p-6 bg-[var(--color-paper-2)] border border-[var(--color-border-hairline)] rounded-[var(--radius-lg)] space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border-hairline)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-[var(--color-ink)]">
              Client Storage Breakdown & Data Footprint
            </h2>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1">
            Zero-server client storage audit across IndexedDB entities and LocalStorage preferences.
          </p>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] text-[var(--color-ink-muted)] uppercase">Total Footprint</div>
          <div className="text-base font-bold text-[var(--color-accent)]">{formatSize(grandTotalBytes)}</div>
        </div>
      </div>

      {/* Visual Bar Distribution */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-ink-muted)]">
          <span>Storage Category Distribution</span>
          <span>100% Client-Side Only</span>
        </div>
        <div className="h-2.5 w-full bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-full overflow-hidden flex">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${getPercent(messageBytes)}%` }} title="Messages" />
          <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${getPercent(personaBytes)}%` }} title="Personas" />
          <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${getPercent(usageBytes)}%` }} title="Logs" />
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${getPercent(localStorageSizeBytes)}%` }} title="LocalStorage" />
        </div>
      </div>

      {/* Categorical Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* Chat Messages */}
        <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Chat Messages</span>
            <span>{messages.length} Items</span>
          </div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">{formatSize(messageBytes)}</div>
        </div>

        {/* Personas */}
        <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Personas & Rules</span>
            <span>{personas.length} Items</span>
          </div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">{formatSize(personaBytes)}</div>
        </div>

        {/* Telemetry Logs */}
        <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Telemetry Logs</span>
            <span>{usage.length} Records</span>
          </div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">{formatSize(usageBytes)}</div>
        </div>

        {/* LocalStorage Preferences */}
        <div className="p-3 bg-[var(--color-paper)] border border-[var(--color-border-hairline)] rounded-[var(--radius-md)] space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] uppercase">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> App Settings</span>
            <span>{localStorageCount} Keys</span>
          </div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">{formatSize(localStorageSizeBytes)}</div>
        </div>
      </div>
    </div>
  );
}
