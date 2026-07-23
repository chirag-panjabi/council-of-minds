import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PersonaList from '../PersonaList';
import { personaRepository } from '../../../lib/db/repositories/persona';
import { axe } from 'jest-axe';

vi.mock('../../../lib/db/repositories/persona', () => ({
  personaRepository: {
    search: vi.fn(),
    getAll: vi.fn(),
    toggleFavorite: vi.fn(),
    toggleArchive: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockPersonas = [
  {
    id: '1',
    name: 'General Assistant',
    description: 'A helpful assistant',
    isFavorite: true,
    isArchived: false,
  },
  {
    id: '2',
    name: 'Code Expert',
    description: 'A coding expert',
    isFavorite: false,
    isArchived: false,
  }
];

describe('PersonaList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (personaRepository.search as any).mockResolvedValue(mockPersonas);
    (personaRepository.getAll as any).mockResolvedValue(mockPersonas);
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders a list of personas', async () => {
    render(<PersonaList />);
    
    await waitFor(() => {
      expect(screen.getByText('General Assistant')).toBeInTheDocument();
      expect(screen.getByText('Code Expert')).toBeInTheDocument();
    });
  });

  it('filters by search input', async () => {
    render(<PersonaList />);
    
    await waitFor(() => {
      expect(personaRepository.search).toHaveBeenCalledWith('', 'all', undefined);
    });

    const searchInput = screen.getByPlaceholderText('Search personas...');
    fireEvent.change(searchInput, { target: { value: 'Code' } });
    
    await waitFor(() => {
      expect(personaRepository.search).toHaveBeenCalledWith('Code', 'all', undefined);
    });
  });
  
  it('toggles favorite on click', async () => {
    render(<PersonaList />);
    
    await waitFor(() => {
      expect(screen.getByText('General Assistant')).toBeInTheDocument();
    });
    
    const favButtons = screen.getAllByRole('button', { name: /Remove from favorites|Add to favorites/i });
    fireEvent.click(favButtons[0]);
    
    await waitFor(() => {
      expect(personaRepository.toggleFavorite).toHaveBeenCalledWith('1');
      expect(personaRepository.search).toHaveBeenCalledTimes(2);
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PersonaList />);
    
    await waitFor(() => {
      expect(screen.getByText('General Assistant')).toBeInTheDocument();
    });
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
