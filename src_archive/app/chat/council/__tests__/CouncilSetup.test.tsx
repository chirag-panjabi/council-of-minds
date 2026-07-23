import { vi } from "vitest";

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CouncilSetupPage from '../page';
import { personaRepository } from '../../../../lib/db/repositories/persona';
import { sessionRepository } from '../../../../lib/db/repositories/session';
import { getAllProviders } from '../../../../lib/providers/registry';
import { useRouter } from 'next/navigation';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
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

vi.mock('../../../../lib/providers/registry', () => ({
  getAllProviders: vi.fn(),
}));

describe('CouncilSetupPage', () => {
  const mockPersonas = [
    { id: '1', name: 'Persona 1', description: 'Desc 1', instructions: 'Inst 1' },
    { id: '2', name: 'Persona 2', description: 'Desc 2', instructions: 'Inst 2' },
    { id: '3', name: 'Persona 3', description: 'Desc 3', instructions: 'Inst 3' },
  ];

  const mockRouterPush = vi.fn();

  beforeAll(() => {
    // Mock dialog methods for jsdom
    if (typeof HTMLDialogElement !== 'undefined') {
      HTMLDialogElement.prototype.showModal = function () {
        this.open = true;
      };
      HTMLDialogElement.prototype.close = function () {
        this.open = false;
      };
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockRouterPush });
    (personaRepository.getAll as any).mockResolvedValue(mockPersonas);
    (personaRepository.search as any).mockResolvedValue(mockPersonas);
    (getAllProviders as any).mockReturnValue([
      { id: 'openai', name: 'OpenAI' },
    ]);
  });

  it('loads personas and requires at least 2 debaters to start', async () => {
    render(<CouncilSetupPage />);

    // Wait for the main page to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select debaters/i })).toBeInTheDocument();
    });

    const startBtn = screen.getByRole('button', { name: /start council/i });
    expect(startBtn).toBeDisabled();

    // Open Debater Selector
    fireEvent.click(screen.getByRole('button', { name: /select debaters/i }));
    
    // Wait for dialog and personas to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /select council members/i })).toBeInTheDocument();
      expect(screen.getByText('Persona 1')).toBeInTheDocument();
    });

    // Add first debater
    fireEvent.click(screen.getByText('Persona 1'));
    
    // Confirm selection
    fireEvent.click(screen.getByRole('button', { name: /confirm selection/i }));
    
    expect(startBtn).toBeDisabled(); // Still disabled, need 2

    // Reopen Debater Selector
    fireEvent.click(screen.getByRole('button', { name: /select debaters/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /select council members/i })).toBeInTheDocument();
    });

    // Add second debater (Persona 1 is already selected, click Persona 2)
    fireEvent.click(screen.getByText('Persona 2'));
    
    // Confirm selection
    fireEvent.click(screen.getByRole('button', { name: /confirm selection/i }));

    expect(startBtn).not.toBeDisabled(); // Should be enabled now
  });

  it('allows reordering debaters with accessible keyboard controls', async () => {
    render(<CouncilSetupPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select debaters/i })).toBeInTheDocument();
    });

    // Open Debater Selector
    fireEvent.click(screen.getByRole('button', { name: /select debaters/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Persona 1')).toBeInTheDocument();
    });

    // Add three debaters
    fireEvent.click(screen.getByText('Persona 1'));
    fireEvent.click(screen.getByText('Persona 2'));
    fireEvent.click(screen.getByText('Persona 3'));
    fireEvent.click(screen.getByRole('button', { name: /confirm selection/i }));

    // Initial order: Persona 1, Persona 2, Persona 3
    let headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Persona 1');
    expect(headings[1]).toHaveTextContent('Persona 2');
    expect(headings[2]).toHaveTextContent('Persona 3');

    // Find the "Move Later" button for Persona 1 (the first debater)
    const moveLaterBtns = screen.getAllByRole('button', { name: /move later/i });
    expect(moveLaterBtns[0]).not.toBeDisabled();

    // Trigger Move Later for Persona 1
    fireEvent.click(moveLaterBtns[0]);

    // Order should now be: Persona 2, Persona 1, Persona 3
    headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Persona 2');
    expect(headings[1]).toHaveTextContent('Persona 1');
    expect(headings[2]).toHaveTextContent('Persona 3');

    // Find the "Move Earlier" button for Persona 1 (now at index 1)
    const moveEarlierBtns = screen.getAllByRole('button', { name: /move earlier/i });
    expect(moveEarlierBtns[1]).not.toBeDisabled();

    // Trigger Move Earlier for Persona 1
    fireEvent.click(moveEarlierBtns[1]);

    // Order should revert to: Persona 1, Persona 2, Persona 3
    headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('Persona 1');
    expect(headings[1]).toHaveTextContent('Persona 2');
  });

  it('snapshots participants and creates a council session', async () => {
    render(<CouncilSetupPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /select debaters/i })).toBeInTheDocument();
    });

    // Open Debater Selector
    fireEvent.click(screen.getByRole('button', { name: /select debaters/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Persona 1')).toBeInTheDocument();
    });

    // Add Debaters
    fireEvent.click(screen.getByText('Persona 1'));
    fireEvent.click(screen.getByText('Persona 2'));
    fireEvent.click(screen.getByRole('button', { name: /confirm selection/i }));

    // Add Synthesizer
    fireEvent.click(screen.getByRole('button', { name: /select synthesizer/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /select synthesizer/i })).toBeInTheDocument();
    });
    
    // Clicking a persona in single select mode auto-closes the dialog
    const p3Btns = screen.getAllByText('Persona 3');
    fireEvent.click(p3Btns[p3Btns.length - 1]);

    // Set turn cap
    const turnCapInput = screen.getByRole('spinbutton', { name: /turn cap/i });
    fireEvent.change(turnCapInput, { target: { value: '8' } });

    // Select provider and model for Debater 1
    const providerSelects = screen.getAllByRole('combobox', { name: /select provider/i });
    fireEvent.change(providerSelects[0], { target: { value: 'openai' } }); // provider for debater 1

    const startBtn = screen.getByRole('button', { name: /start council/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(sessionRepository.createSession).toHaveBeenCalledTimes(1);
    });
    
    // mode, participants, title, isIncognito, turnCap
    const calls = (sessionRepository.createSession as import("vitest").Mock).mock.calls[0];
    const mode = calls[0];
    const participants = calls[1];
    const turnCap = calls[4];

    expect(mode).toBe('council');
    expect(turnCap).toBe(8);
    expect(participants).toHaveLength(3);
    
    // Check Debater 1
    expect(participants[0]).toMatchObject({
      personaId: '1',
      role: 'debater',
      providerId: 'openai',
    });

    // Check Synthesizer
    expect(participants[2]).toMatchObject({
      personaId: '3',
      role: 'synthesizer',
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/chat/council/test-session-id');
  });
});
