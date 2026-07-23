import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SummaryService } from '../summary';
import { settingsStore } from '../../storage/settings';
import { db } from '../../db';

// Mock DB
vi.mock('../../db', () => ({
  db: {
    messages: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      sortBy: vi.fn(),
      add: vi.fn(),
    },
    summaries: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      sortBy: vi.fn(),
      add: vi.fn(),
    },
  },
}));

// Mock Settings Store
vi.mock('../../storage/settings', () => ({
  settingsStore: {
    getPreferences: vi.fn(),
    getApiKeys: vi.fn(),
  },
}));

// Mock localStorage
const mockGetItem = vi.fn();
const mockSetItem = vi.fn();
global.localStorage = {
  getItem: mockGetItem,
  setItem: mockSetItem,
  length: 0,
  clear: vi.fn(),
  key: vi.fn(),
  removeItem: vi.fn(),
} as unknown as Storage;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SummaryService', () => {
  let summaryService: SummaryService;

  beforeEach(() => {
    vi.clearAllMocks();
    summaryService = new SummaryService();

    // Default settings: enabled summarization
    vi.mocked(settingsStore.getPreferences).mockReturnValue({
      theme: 'system',
      density: 'comfortable',
      typography: 'base',
      summarization: {
        enabled: true,
        providerId: 'openai',
        modelId: 'gpt-4o',
      },
    });

    vi.mocked(settingsStore.getApiKeys).mockReturnValue({
      openai: 'test-api-key',
      anthropic: 'test-api-key',
      gemini: 'test-api-key',
    });

    mockGetItem.mockReturnValue(JSON.stringify({ apiKey: 'test-api-key' }));

    // Default fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'This is a test summary.' } }],
      }),
    } as any);

    // Default empty messages/summaries
    vi.mocked((db.messages as any).sortBy).mockResolvedValue([]);
    vi.mocked((db.summaries as any).sortBy).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exits early if summarization is disabled', async () => {
    vi.mocked(settingsStore.getPreferences).mockReturnValue({
      theme: 'system',
      density: 'comfortable',
      typography: 'base',
      summarization: {
        enabled: false,
      },
    });

    await summaryService.summarizeSession('session-1');

    expect(db.messages.where).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('exits early if there are fewer than SUMMARY_THRESHOLD new messages', async () => {
    // Return 10 messages, which is less than 15
    const mockMessages = Array.from({ length: 10 }).map((_, i) => ({
      id: `msg-${i}`,
      sessionId: 'session-1',
      createdAt: Date.now() + i,
      role: 'user',
      content: `Message ${i}`,
    }));
    vi.mocked((db.messages as any).sortBy).mockResolvedValue(mockMessages as any);
    vi.mocked((db.summaries as any).sortBy).mockResolvedValue([]);

    await summaryService.summarizeSession('session-1');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(db.summaries.add).not.toHaveBeenCalled();
  });

  it('generates a summary if message count exceeds threshold', async () => {
    // Return 15 messages (threshold)
    const mockMessages = Array.from({ length: 15 }).map((_, i) => ({
      id: `msg-${i}`,
      sessionId: 'session-1',
      createdAt: 1000 + i,
      role: 'user',
      content: `Message ${i}`,
    }));
    vi.mocked((db.messages as any).sortBy).mockResolvedValue(mockMessages as any);
    vi.mocked((db.summaries as any).sortBy).mockResolvedValue([]);

    await summaryService.summarizeSession('session-1');

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe('/api/proxy/openai'); // url
    
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.model).toBe('gpt-4o');
    expect(requestBody.messages[0].content).toContain('NEW MESSAGES:');
    expect(requestBody.messages[0].content).toContain('Message 0');
    expect(requestBody.messages[0].content).toContain('Message 14');

    expect(db.summaries.add).toHaveBeenCalled();
    const addedSummary = vi.mocked(db.summaries.add).mock.calls[0][0];
    expect(addedSummary).toMatchObject({
      sessionId: 'session-1',
      content: 'This is a test summary.',
      providerId: 'openai',
      modelId: 'gpt-4o',
    });
  });

  it('calculates diff correctly when a previous summary exists', async () => {
    const previousSummaryTime = 2000;
    const oldMessages = Array.from({ length: 5 }).map((_, i) => ({
      id: `old-${i}`,
      sessionId: 'session-1',
      createdAt: 1000 + i,
      role: 'user',
      content: `Old ${i}`,
    }));

    const newMessages = Array.from({ length: 15 }).map((_, i) => ({
      id: `new-${i}`,
      sessionId: 'session-1',
      createdAt: 3000 + i,
      role: 'user',
      content: `New ${i}`,
    }));

    vi.mocked((db.messages as any).sortBy).mockResolvedValue([...oldMessages, ...newMessages] as any);
    vi.mocked((db.summaries as any).sortBy).mockResolvedValue([
      { id: 'sum-1', sessionId: 'session-1', createdAt: previousSummaryTime, content: 'Previous summary content', providerId: 'openai', modelId: 'gpt-4o' }
    ] as any);

    await summaryService.summarizeSession('session-1');

    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    
    // It should include the previous summary content
    expect(requestBody.messages[0].content).toContain('PREVIOUS SUMMARY:\nPrevious summary content');
    
    // It should only include the new messages
    expect(requestBody.messages[0].content).not.toContain('Old 0');
    expect(requestBody.messages[0].content).toContain('New 0');
    expect(requestBody.messages[0].content).toContain('New 14');
  });

  it('formats request payload correctly for anthropic', async () => {
    vi.mocked(settingsStore.getPreferences).mockReturnValue({
      theme: 'system',
      density: 'comfortable',
      typography: 'base',
      summarization: {
        enabled: true,
        providerId: 'anthropic',
        modelId: 'claude-3-5',
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [{ text: 'Anthropic summary.' }],
      }),
    } as any);

    const mockMessages = Array.from({ length: 15 }).map((_, i) => ({
      id: `msg-${i}`,
      sessionId: 'session-1',
      createdAt: 1000 + i,
      role: 'user',
      content: `Message ${i}`,
    }));
    vi.mocked((db.messages as any).sortBy).mockResolvedValue(mockMessages as any);

    await summaryService.summarizeSession('session-1');

    expect(mockFetch).toHaveBeenCalled();
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('claude-3-5');
    expect(requestBody.max_tokens).toBe(4096);

    const addedSummary = vi.mocked(db.summaries.add).mock.calls[0][0];
    expect(addedSummary.content).toBe('Anthropic summary.');
    expect(addedSummary.providerId).toBe('anthropic');
  });

  it('formats request payload correctly for gemini', async () => {
    vi.mocked(settingsStore.getPreferences).mockReturnValue({
      theme: 'system',
      density: 'comfortable',
      typography: 'base',
      summarization: {
        enabled: true,
        providerId: 'gemini',
        modelId: 'gemini-1.5',
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        candidates: [{ content: { parts: [{ text: 'Gemini summary.' }] } }],
      }),
    } as any);

    const mockMessages = Array.from({ length: 15 }).map((_, i) => ({
      id: `msg-${i}`,
      sessionId: 'session-1',
      createdAt: 1000 + i,
      role: 'user',
      content: `Message ${i}`,
    }));
    vi.mocked((db.messages as any).sortBy).mockResolvedValue(mockMessages as any);

    await summaryService.summarizeSession('session-1');

    expect(mockFetch).toHaveBeenCalled();
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.model).toBe('gemini-1.5');
    expect(requestBody.contents[0].parts[0].text).toContain('NEW MESSAGES:');

    const addedSummary = vi.mocked(db.summaries.add).mock.calls[0][0];
    expect(addedSummary.content).toBe('Gemini summary.');
    expect(addedSummary.providerId).toBe('gemini');
  });

  it('handles fetch errors gracefully without adding summary', async () => {
    const mockMessages = Array.from({ length: 15 }).map((_, i) => ({
      id: `msg-${i}`,
      sessionId: 'session-1',
      createdAt: 1000 + i,
      role: 'user',
      content: `Message ${i}`,
    }));
    vi.mocked((db.messages as any).sortBy).mockResolvedValue(mockMessages as any);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    await summaryService.summarizeSession('session-1');

    expect(mockFetch).toHaveBeenCalled();
    expect(db.summaries.add).not.toHaveBeenCalled();
  });
});
