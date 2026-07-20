import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PersonaForm from '../PersonaForm';
import { settingsStore } from '../../../lib/storage/settings';
import { personaRepository } from '../../../lib/db/repositories/persona';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('../../../lib/storage/settings', () => ({
  settingsStore: {
    getDrafts: vi.fn().mockReturnValue({}),
    setDrafts: vi.fn(),
  },
}));

vi.mock('../../../lib/db/repositories/persona', () => ({
  personaRepository: {
    save: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock crypto.randomUUID for jsdom
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => '123e4567-e89b-12d3-a456-426614174000'
  }
});

describe('PersonaForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (settingsStore.getDrafts as any).mockReturnValue({});
  });

  it('renders empty form for new persona', () => {
    render(<PersonaForm />);
    expect(screen.getByLabelText(/Name/i)).toHaveValue('');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('');
    expect(screen.getByLabelText(/System Instructions/i)).toHaveValue('');
  });

  it('loads data from initialPersona', () => {
    const mockPersona = {
      id: '123',
      name: 'Test Persona',
      description: 'Test Desc',
      instructions: 'Test Inst',
      createdAt: 100,
      updatedAt: 100,
      isFavorite: false,
      isArchived: false,
    };
    
    render(<PersonaForm initialPersona={mockPersona} />);
    expect(screen.getByLabelText(/Name/i)).toHaveValue('Test Persona');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('Test Desc');
    expect(screen.getByLabelText(/System Instructions/i)).toHaveValue('Test Inst');
  });

  it('validates required fields on submit', async () => {
    render(<PersonaForm />);
    
    fireEvent.click(screen.getByText('Save Persona'));
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Instructions are required')).toBeInTheDocument();
    });
    
    expect(personaRepository.save).not.toHaveBeenCalled();
  });

  it('saves draft on change', async () => {
    render(<PersonaForm />);
    
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Draft Name' } });
    
    await waitFor(() => {
      expect(settingsStore.setDrafts).toHaveBeenCalledWith(
        expect.objectContaining({
          'persona:new': expect.stringContaining('Draft Name'),
        })
      );
    });
  });

  it('submits successfully when fields are valid', async () => {
    render(<PersonaForm />);
    
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Valid Name' } });
    fireEvent.change(screen.getByLabelText(/System Instructions/i), { target: { value: 'Valid Instructions' } });
    
    fireEvent.click(screen.getByText('Save Persona'));
    
    await waitFor(() => {
      expect(personaRepository.save).toHaveBeenCalled();
    });
  });
});
