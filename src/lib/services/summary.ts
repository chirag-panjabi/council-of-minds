import { db } from '../db';
import { settingsStore } from '../storage/settings';
import { memoryStore } from '../stores/memory';
import { generateId } from '../utils/uuid';
import type { Message, Summary } from '../schemas';

const SUMMARY_THRESHOLD = 15;

export class SummaryService {
  async summarizeSession(sessionId: string): Promise<void> {
    // Privacy Guard: Do not summarize Incognito (memory-only) sessions
    if (memoryStore.sessions.has(sessionId)) {
      return;
    }

    const prefs = settingsStore.getPreferences();
    if (!prefs.summarization?.enabled) return;

    const providerId = prefs.summarization.providerId;
    const modelId = prefs.summarization.modelId;
    if (!providerId || !modelId) return;

    try {
      // 1. Fetch current messages
      const messages = await db.messages.where('sessionId').equals(sessionId).sortBy('createdAt');
      
      // 2. Fetch the latest summary
      const summaries = await db.summaries.where('sessionId').equals(sessionId).sortBy('createdAt');
      const latestSummary = summaries[summaries.length - 1];

      // 3. Find messages since the latest summary
      let newMessages = messages;
      if (latestSummary) {
        newMessages = messages.filter(m => m.createdAt > latestSummary.createdAt);
      }

      // If we haven't reached the threshold of new messages, return
      if (newMessages.length < SUMMARY_THRESHOLD) {
        return;
      }

      // 4. Construct prompt
      let promptContent = `Summarize the following conversation concisely, focusing on key decisions, main topics, and unresolved questions.\n\n`;
      if (latestSummary) {
        promptContent += `PREVIOUS SUMMARY:\n${latestSummary.content}\n\n`;
      }
      promptContent += `NEW MESSAGES:\n`;
      for (const msg of newMessages) {
        promptContent += `[${msg.role}]: ${msg.content}\n\n`;
      }

      // 5. Build Payload
      let payload: any;
      if (providerId === 'openai' || providerId === 'ollama') {
        payload = {
          model: modelId,
          stream: false,
          messages: [{ role: 'user', content: promptContent }],
        };
      } else if (providerId === 'anthropic') {
        payload = {
          model: modelId,
          stream: false,
          max_tokens: 4096,
          messages: [{ role: 'user', content: promptContent }]
        };
      } else if (providerId === 'gemini') {
        payload = {
          model: modelId,
          contents: [{ role: 'user', parts: [{ text: promptContent }] }],
        };
      }

      const url = providerId === 'ollama' ? 'http://localhost:11434/api/chat' : `/api/proxy/${providerId}`;
      const apiKeys = settingsStore.getApiKeys();
      const apiKey = apiKeys[providerId] || '';

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (providerId !== 'ollama') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // 6. Send Request
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[SummaryService] Failed to generate summary: ${response.status}`);
        return;
      }

      const data = await response.json();
      let generatedSummary = '';

      if (providerId === 'openai' || providerId === 'ollama') {
        generatedSummary = data.choices?.[0]?.message?.content || data.message?.content || '';
      } else if (providerId === 'anthropic') {
        generatedSummary = data.content?.[0]?.text || '';
      } else if (providerId === 'gemini') {
        generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (!generatedSummary) return;

      // 7. Save the new summary
      const newSummary: Summary = {
        id: generateId(),
        sessionId,
        createdAt: Date.now(),
        content: generatedSummary,
        providerId,
        modelId,
      };

      await db.summaries.add(newSummary);

    } catch (err) {
      console.warn('[SummaryService] Exception during summarization:', err);
    }
  }
}

export const summaryService = new SummaryService();
