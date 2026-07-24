import JSZip from 'jszip';
import { db } from '@/lib/db';
import type { ChatSession, ChatMessage, Persona, PersonaGroup } from '@/types';

/**
 * Generates a full client-side backup ZIP archive containing:
 * - manifest.json (framework-engine.backup/v1)
 * - personas.json, chats.json, messages.json, groups.json, usage.json
 * - transcripts/*.md (Readable Markdown transcript files per chat session)
 * - attachments/* (Binary file attachments if present)
 *
 * Excludes API keys, local drafts, and Incognito content.
 */
export async function generateFullBackupZip(): Promise<Blob> {
  const zip = new JSZip();

  // Fetch all IndexedDB data
  const rawPersonas = await db.personas.toArray();
  const rawChats = await db.chats.toArray();
  const rawMessages = await db.messages.toArray();
  const rawGroups = await db.groups.toArray();
  const rawUsage = await db.usage.toArray();

  // Filter out any Incognito or temporary data
  const personas = rawPersonas;
  const chats = rawChats.filter((c) => !(c as any).isIncognito);
  const validChatIds = new Set(chats.map((c) => c.id));
  const messages = rawMessages.filter((m) => validChatIds.has(m.chatId));
  const groups = rawGroups;
  const usage = rawUsage.filter((u) => validChatIds.has(u.chatId));

  // Manifest
  const manifest = {
    version: 'framework-engine.backup/v1',
    schemaVersion: 1,
    createdAt: Date.now(),
    appVersion: '1.0.0',
    counts: {
      personas: personas.length,
      chats: chats.length,
      messages: messages.length,
      groups: groups.length,
      usage: usage.length,
    },
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('personas.json', JSON.stringify(personas, null, 2));
  zip.file('chats.json', JSON.stringify(chats, null, 2));
  zip.file('messages.json', JSON.stringify(messages, null, 2));
  zip.file('groups.json', JSON.stringify(groups, null, 2));
  zip.file('usage.json', JSON.stringify(usage, null, 2));

  // Transcripts folder
  const transcriptsFolder = zip.folder('transcripts');
  if (transcriptsFolder) {
    const personaMap = new Map<string, Persona>(personas.map((p) => [p.id, p]));

    for (const chat of chats) {
      const sessionMessages = messages
        .filter((m) => m.chatId === chat.id)
        .sort((a, b) => a.timestamp - b.timestamp);

      let md = `# ${chat.title || 'Conversation Transcript'}\n\n`;
      md += `**Type:** ${chat.type.toUpperCase()}\n`;
      md += `**Created:** ${new Date(chat.createdAt).toLocaleString()}\n`;
      md += `**Last Updated:** ${new Date(chat.updatedAt).toLocaleString()}\n\n`;
      md += `---\n\n`;

      sessionMessages.forEach((msg) => {
        const speaker = msg.role === 'user' ? 'You' : personaMap.get(msg.personaId || '')?.name || 'Assistant';
        md += `### ${speaker} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
        if (msg.reasoning) {
          md += `> **Thought Process:**\n> ${msg.reasoning.replace(/\n/g, '\n> ')}\n\n`;
        }
        md += `${msg.content}\n\n`;
      });

      const safeTitle = (chat.title || 'chat')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      transcriptsFolder.file(`${safeTitle}-${chat.id.slice(0, 8)}.md`, md);
    }
  }

  // Attachments folder (if db.attachments object store exists)
  if ((db as any).attachments) {
    const attachmentsFolder = zip.folder('attachments');
    if (attachmentsFolder) {
      try {
        const attachments = await (db as any).attachments.toArray();
        for (const att of attachments) {
          if (att.blob) {
            attachmentsFolder.file(att.name || att.id, att.blob);
          }
        }
      } catch {}
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}
