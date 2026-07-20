import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CouncilSetupPage from '../page';
import { useCouncilSetup } from '../../../../lib/hooks/useCouncilSetup';
import { personaRepository } from '../../../../lib/db/repositories/persona';
import { sessionRepository } from '../../../../lib/db/repositories/session';
import { useRouter } from 'next/navigation';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../../../../lib/hooks/useCouncilSetup', () => ({
  useCouncilSetup: vi.fn(),
}));

vi.mock('../../../../lib/db/repositories/persona', () => ({
  personaRepository: {
    getAll: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock('../../../../lib/db/repositories/session', () => ({
  sessionRepository: {
    createSession: vi.fn().mockResolvedValue({ id: 'test-session-id' }),
  },
}));

// Provide minimal mock implementations for RosterQueueItem if necessary, 
// but standard rendering should be fine since it's a simple component.
vi.mock('../../../../lib/providers/registry', () => ({
  getAllProviders: vi.fn().mockReturnValue([
    { id: 'openai', name: 'OpenAI' }
  ]),
  getProviderCapabilities: vi.fn(),
}));

describe('CouncilSetupPage', () => {
  const mockRouter = { push: vi.fn() };
  
  const mockPersonas = [
    { id: '1', name: 'Persona 1', description: 'Desc 1', instructions: 'Inst 1', createdAt: 1, updatedAt: 1 },
    { id: '2', name: 'Persona 2', description: 'Desc 2', instructions: 'Inst 2', createdAt: 2, updatedAt: 2 },
    { id: '3', name: 'Persona 3', description: 'Desc 3', instructions: 'Inst 3', createdAt: 3, updatedAt: 3 },
  ];

  const mockSetup = {
    debaters: [],
    synthesizer: null,
    turnCap: 6,
    setTurnCap: vi.fn(),
    addDebater: vi.fn(),
    removeDebater: vi.fn(),
    moveDebater: vi.fn(),
    updateDebaterModel: vi.fn(),
    setSynthesizerPersona: vi.fn(),
    updateSynthesizerModel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (personaRepository.getAll as any).mockResolvedValue(mockPersonas);
    (personaRepository.search as any).mockResolvedValue(mockPersonas);
    (useCouncilSetup as any).mockReturnValue(mockSetup);
  });

  it('renders correctly and fetches personas', async () => {
    render(<CouncilSetupPage />);
    
    expect(screen.getByText('Council Setup')).toBeInTheDocument();
    expect(screen.getByText('Select Debaters')).toBeInTheDocument();
  });

  it('adds a debater when selected and confirmed', async () => {
    render(<CouncilSetupPage />);
    
    // Open the selector
    fireEvent.click(screen.getByText('Select Debaters'));
    
    await waitFor(() => expect(screen.getAllByText('Persona 1').length).toBeGreaterThan(0));

    // Click the persona to select it
    fireEvent.click(screen.getAllByText('Persona 1')[0]);
    
    // Click confirm
    fireEvent.click(screen.getByText('Confirm Selection'));

    expect(mockSetup.addDebater).toHaveBeenCalledWith(mockPersonas[0]);
  });

  it('disables Start Council button when less than 2 debaters are present', () => {
    (useCouncilSetup as any).mockReturnValue({
      ...mockSetup,
      debaters: [{ persona: mockPersonas[0] }],
    });

    render(<CouncilSetupPage />);
    const startButton = screen.getByText('Start Council');
    
    expect(startButton).toBeDisabled();
  });

  it('enables Start Council button and creates session when clicked', async () => {
    (useCouncilSetup as any).mockReturnValue({
      ...mockSetup,
      debaters: [
        { persona: mockPersonas[0], providerId: 'openai', modelId: 'gpt-4o' },
        { persona: mockPersonas[1], providerId: 'anthropic', modelId: 'claude-3' },
      ],
      turnCap: 10,
    });

    render(<CouncilSetupPage />);
    
    const startButton = screen.getByText('Start Council');
    expect(startButton).not.toBeDisabled();

    // Set incognito
    const incognitoCheckbox = screen.getByLabelText('Incognito Mode');
    fireEvent.click(incognitoCheckbox);

    // Set Title
    const titleInput = screen.getByDisplayValue('New Council Session');
    fireEvent.change(titleInput, { target: { value: 'My Cool Session' } });

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(sessionRepository.createSession).toHaveBeenCalled();
    });
    
    const calls = (sessionRepository.createSession as import("vitest").Mock).mock.calls[0];
    const [mode, participants, sessionTitle, incognito, turnCap] = calls;
    
    expect(mode).toBe('council');
    expect(sessionTitle).toBe('My Cool Session');
    expect(incognito).toBe(true);
    expect(turnCap).toBe(10);
    expect(participants).toHaveLength(2);
    expect(participants[0].role).toBe('debater');
    expect(mockRouter.push).toHaveBeenCalled();
  });

  it('includes synthesizer in participants if selected', async () => {
    (useCouncilSetup as any).mockReturnValue({
      ...mockSetup,
      debaters: [
        { persona: mockPersonas[0] },
        { persona: mockPersonas[1] },
      ],
      synthesizer: { persona: mockPersonas[2], providerId: 'openai', modelId: 'gpt-4' },
    });

    render(<CouncilSetupPage />);
    
    const startButton = screen.getByText('Start Council');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(sessionRepository.createSession).toHaveBeenCalledWith(
        'council',
        expect.arrayContaining([
          expect.objectContaining({ personaId: '3', role: 'synthesizer' }),
        ]),
        expect.any(String),
        expect.any(Boolean),
        expect.any(Number)
      );
    });
  });
});
