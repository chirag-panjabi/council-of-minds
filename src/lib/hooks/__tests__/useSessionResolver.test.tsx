import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSessionResolver } from '../useSessionResolver';
import { sessionRepository } from '../../db/repositories/session';
import { notFound } from 'next/navigation';
import type { Session } from '../../schemas/session';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('../../db/repositories/session', () => ({
  sessionRepository: {
    get: vi.fn(),
  },
}));

describe('useSessionResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load a valid session and not trigger notFound', async () => {
    const mockSession: Session = {
      id: 'test-id',
      createdAt: 123,
      updatedAt: 123,
      title: 'Test Session',
      mode: '1-on-1',
      state: 'active',
      isIncognito: false,
      participants: [{ personaId: "123e4567-e89b-12d3-a456-426614174001", name: "Test", instructions: "Test", role: "debater" }],
    };

    vi.mocked(sessionRepository.get).mockResolvedValueOnce(mockSession);

    const { result } = renderHook(() => useSessionResolver('test-id', '1-on-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(notFound).not.toHaveBeenCalled();
  });

  it('should call notFound if session does not exist', async () => {
    vi.mocked(sessionRepository.get).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSessionResolver('test-id', '1-on-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // notFound is called during render if isNotFound state is set to true
    expect(notFound).toHaveBeenCalled();
  });

  it('should call notFound if session mode mismatches expected mode', async () => {
    const mockSession: Session = {
      id: 'test-id',
      createdAt: 123,
      updatedAt: 123,
      title: 'Test Session',
      mode: 'council',
      state: 'active',
      isIncognito: false,
      participants: [{ personaId: "123e4567-e89b-12d3-a456-426614174001", name: "Test", instructions: "Test", role: "debater" }],
    };

    vi.mocked(sessionRepository.get).mockResolvedValueOnce(mockSession);

    const { result } = renderHook(() => useSessionResolver('test-id', '1-on-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(notFound).toHaveBeenCalled();
  });

  it('should call notFound if sessionRepository.get throws an error', async () => {
    vi.mocked(sessionRepository.get).mockRejectedValueOnce(new Error('Database error'));

    const { result } = renderHook(() => useSessionResolver('test-id', '1-on-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(notFound).toHaveBeenCalled();
  });
});
