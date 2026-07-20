import { renderHook, act, waitFor } from '@testing-library/react';
import { useCouncilOrchestrator } from '../useCouncilOrchestrator';
import { messageRepository } from '../../db/repositories/message';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Session, ParticipantSnapshot } from '../../schemas/session';
import { db } from '../../db';
import { summaryService } from '../../services/summary';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    summaries: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      sortBy: vi.fn().mockResolvedValue([]),
    }
  }
}));

vi.mock('../../services/summary', () => ({
  summaryService: {
    summarizeSession: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('../../db/repositories/message', () => ({
  messageRepository: {
    getForSession: vi.fn(),
    save: vi.fn(),
  }
}));

vi.mock('../../db/repositories/attachment', () => ({
  attachmentRepository: {
    save: vi.fn(),
  }
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDebater1: ParticipantSnapshot = {
  personaId: 'debater-1-id',
  name: 'Debater 1',
  instructions: 'System 1',
  providerId: 'openai',
  modelId: 'gpt-4o',
  role: 'debater'
};

const mockDebater2: ParticipantSnapshot = {
  personaId: 'debater-2-id',
  name: 'Debater 2',
  instructions: 'System 2',
  providerId: 'anthropic',
  modelId: 'claude-3-5',
  role: 'debater'
};

const mockSynthesizer: ParticipantSnapshot = {
  personaId: 'synth-1-id',
  name: 'Synthesizer',
  instructions: 'Synth System',
  providerId: 'gemini',
  modelId: 'gemini-1.5',
  role: 'synthesizer'
};

const mockSession: Session = {
  id: 'session-id',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  title: 'Council',
  mode: 'council',
  state: 'active',
  isIncognito: false,
  participants: [mockDebater1, mockDebater2, mockSynthesizer],
  turnCap: 3
};

describe('useCouncilOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (messageRepository.getForSession as any).mockResolvedValue([]);
    (messageRepository.save as any).mockResolvedValue(undefined);

    // Default fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
           let done = false;
           return {
             read: async () => {
               if (done) return { done: true, value: undefined };
               done = true;
               // simulate an SSE delta
               const chunk = new TextEncoder().encode('data: {"choices":[{"delta":{"content":"test answer"}}]}\n\n');
               return { done: false, value: chunk };
             },
             releaseLock: vi.fn(),
           };
        }
      }
    } as any);
  });

  it('initializes to setup state when no messages exist', async () => {
    const { result } = renderHook(() => useCouncilOrchestrator(mockSession));
    
    // Initially setup
    expect(result.current.councilState).toBe('setup');
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalledWith('session-id');
    });
    
    expect(result.current.councilState).toBe('setup');
    expect(result.current.turnCount).toBe(0);
  });

  it('transitions to paused after submitting a central prompt', async () => {
    const { result } = renderHook(() => useCouncilOrchestrator(mockSession));
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.submitCentralPrompt('Hello council');
    });

    expect(result.current.councilState).toBe('paused');
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe('Hello council');
    expect(messageRepository.save).toHaveBeenCalled();
  });

  it('transitions to ready and sets debater index when using a direct mention', async () => {
    const { result } = renderHook(() => useCouncilOrchestrator(mockSession));
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // Mock runTurn success so it doesn't stay generating forever or fail
    // It's going to call requestPersonaTurn which executes generation.
    // executeGeneration will set it to generating then paused.
    // We just want to check if requestPersonaTurn was called effectively.
    // For now, let's just see if it transitions to generating because requestPersonaTurn starts running
    await act(async () => {
      await result.current.submitCentralPrompt('Hello @Debater 1 !');
    });

    expect(result.current.councilState).toBe('paused');
    // We should have the user prompt and the resulting generated message from Debater 1
    const generatedMessages = result.current.messages.filter(m => m.role === 'assistant');
    expect(generatedMessages).toHaveLength(1);
    expect(generatedMessages[0].personaId).toBe('debater-1-id');
  });

  it('executes next turn and increments turn count', async () => {
    const { result } = renderHook(() => useCouncilOrchestrator(mockSession));
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.submitCentralPrompt('Hello council');
    });

    await act(async () => {
      await result.current.startNextTurn();
    });

    // We mocked a simple response for OpenAI format
    await waitFor(() => {
      expect(result.current.councilState).toBe('paused');
    });
    
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.turnCount).toBe(1);
    expect(result.current.messages[1].content).toContain('test answer');
  });

  it('enforces turn cap', async () => {
    const limitedSession = { ...mockSession, turnCap: 2 };
    const { result } = renderHook(() => useCouncilOrchestrator(limitedSession));
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalled();
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    // mock fetch differently for anthropic to just return empty to simplify
    mockFetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => {
           let done = false;
           return {
             read: async () => {
               if (done) return { done: true, value: undefined };
               done = true;
               const chunk = new TextEncoder().encode(''); // ignore actual stream parsing for anthropic in this test
               return { done: false, value: chunk };
             },
             releaseLock: vi.fn(),
           };
        }
      }
    } as any);

    await act(async () => {
      await result.current.submitCentralPrompt('Start');
    });

    // Turn 1
    await act(async () => {
      await result.current.startNextTurn();
    });
    await waitFor(() => {
      expect(result.current.councilState).toBe('paused');
    });

    // Turn 2
    await act(async () => {
      await result.current.startNextTurn();
    });
    await waitFor(() => {
      expect(result.current.councilState).toBe('paused');
    });

    expect(result.current.turnCount).toBe(2);

    // Turn 3 should be blocked
    await act(async () => {
      await result.current.startNextTurn();
    });
    
    expect(result.current.turnCount).toBe(2);
  });

  it('enforces maximum turn cap of 12 even if session specifies more', async () => {
    const corruptedSession = { ...mockSession, turnCap: 20 };
    const { result } = renderHook(() => useCouncilOrchestrator(corruptedSession));
    
    expect(result.current.turnCap).toBe(12);
  });

  it('enforces minimum turn cap of 1 even if session specifies less', async () => {
    const corruptedSession = { ...mockSession, turnCap: 0 };
    const { result } = renderHook(() => useCouncilOrchestrator(corruptedSession));
    
    expect(result.current.turnCap).toBe(1);
  });

  it('exits synthesize early if a generation is actively streaming', async () => {
    const { result } = renderHook(() => useCouncilOrchestrator(mockSession));
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalled();
    });

    // We mock fetch so it doesn't resolve immediately to simulate "generating"
    let resolveStream: any;
    mockFetch.mockReturnValue(new Promise(resolve => {
        resolveStream = resolve;
    }));

    await act(async () => {
      // Start a normal turn, setting state to generating
      result.current.startNextTurn();
    });

    expect(result.current.councilState).toBe('generating');

    await act(async () => {
      // Try to synthesize while generating
      await result.current.synthesize();
    });

    // Verify a synthesis turn did not start
    const synthMessages = result.current.messages.filter(m => m.personaId === mockSynthesizer.personaId);
    expect(synthMessages).toHaveLength(0);

    // cleanup to avoid unhandled promise
    if (resolveStream) {
      resolveStream({
        ok: true,
        body: {
          getReader: () => ({
            read: async () => ({ done: true }),
            releaseLock: vi.fn(),
          })
        }
      });
    }
  });

  it('injects summary block and triggers background summarization', async () => {
    // Setup summary in db
    vi.mocked((db.summaries as any).sortBy).mockResolvedValue([
      { id: 'sum-1', sessionId: 'session-id', createdAt: 500, content: 'Test summary content', providerId: 'openai', modelId: 'gpt-4o' } as any
    ]);

    const { result } = renderHook(() => useCouncilOrchestrator(mockSession));
    
    await waitFor(() => {
      expect(messageRepository.getForSession).toHaveBeenCalled();
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    await act(async () => {
      await result.current.submitCentralPrompt('Hello');
    });

    await act(async () => {
      await result.current.startNextTurn();
    });

    // Verify mock fetch was called with the summary
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall).toBeDefined();
    
    const requestBody = JSON.parse(fetchCall[1].body);
    // Find the injected summary
    const hasSummary = requestBody.messages.some((m: any) => 
      m.role === 'user' && m.content.includes('<UNTRUSTED_CONVERSATION_SUMMARY>') && m.content.includes('Test summary content')
    );
    expect(hasSummary).toBe(true);

    // Verify background summarization was triggered
    expect(summaryService.summarizeSession).toHaveBeenCalledWith('session-id');
  });
});

