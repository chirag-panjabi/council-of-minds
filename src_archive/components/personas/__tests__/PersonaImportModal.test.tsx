import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonaImportModal } from '../PersonaImportModal';
import { personaRepository } from '../../../lib/db/repositories/persona';
import { decodePersona, CodecError } from '../../../lib/personas/codec';

// Mock dependencies
vi.mock('../../../lib/db/repositories/persona', () => ({
  personaRepository: {
    get: vi.fn(),
    save: vi.fn(),
  }
}));

vi.mock('../../../lib/personas/codec', () => ({
  decodePersona: vi.fn(),
  CodecError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CodecError';
    }
  }
}));

// Provide crypto.randomUUID for testing environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mocked-uuid'
  }
});

describe('PersonaImportModal', () => {
  const mockOnClose = vi.fn();
  const mockOnImportSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <PersonaImportModal isOpen={false} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders input area when open', () => {
    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    expect(screen.getByText('Import Persona')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste Base64URL/i)).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows error if input is empty', async () => {
    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to process input data.')).toBeInTheDocument();
    });
  });

  it('shows codec error', async () => {
    (decodePersona as any).mockImplementation(() => {
      throw new CodecError('Invalid portable persona format');
    });

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'invalid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid portable persona format')).toBeInTheDocument();
    });
  });

  it('previews successfully when valid data is provided and no collision', async () => {
    const mockPersona = { id: 'test-id', name: 'Test Persona', description: 'desc' };
    (decodePersona as any).mockReturnValue({ persona: mockPersona });
    (personaRepository.get as any).mockResolvedValue(null);

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'valid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Test Persona')).toBeInTheDocument();
      expect(screen.getByText('desc')).toBeInTheDocument();
      expect(screen.getByText('Import')).toBeInTheDocument();
    });
  });

  it('handles import (no collision)', async () => {
    const mockPersona = { id: 'test-id', name: 'Test Persona', description: 'desc' };
    (decodePersona as any).mockReturnValue({ persona: mockPersona });
    (personaRepository.get as any).mockResolvedValue(null);

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'valid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Import')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Import'));

    await waitFor(() => {
      expect(personaRepository.save).toHaveBeenCalledWith({
        id: 'test-id',
        name: 'Test Persona',
        description: 'desc',
        isFavorite: false,
        isArchived: false,
      });
      expect(mockOnImportSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('detects collision and shows options', async () => {
    const mockPersona = { id: 'test-id', name: 'Test Persona' };
    (decodePersona as any).mockReturnValue({ persona: mockPersona });
    (personaRepository.get as any).mockResolvedValue(mockPersona);

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'valid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
      expect(screen.getByText('Replace Existing')).toBeInTheDocument();
      expect(screen.getByText('Duplicate (New ID)')).toBeInTheDocument();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
  });

  it('handles Replace Existing collision action', async () => {
    const mockPersona = { id: 'test-id', name: 'Test Persona' };
    (decodePersona as any).mockReturnValue({ persona: mockPersona });
    (personaRepository.get as any).mockResolvedValue(mockPersona);

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'valid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Replace Existing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Replace Existing'));

    await waitFor(() => {
      expect(personaRepository.save).toHaveBeenCalledWith({
        ...mockPersona,
        isFavorite: false,
        isArchived: false,
      });
      expect(mockOnImportSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles Duplicate collision action', async () => {
    const mockPersona = { id: 'test-id', name: 'Test Persona' };
    (decodePersona as any).mockReturnValue({ persona: mockPersona });
    (personaRepository.get as any).mockResolvedValue(mockPersona);

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'valid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Duplicate (New ID)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Duplicate (New ID)'));

    await waitFor(() => {
      expect(personaRepository.save).toHaveBeenCalledWith({
        id: 'mocked-uuid',
        name: 'Test Persona (Copy)',
        isFavorite: false,
        isArchived: false,
      });
      expect(mockOnImportSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles Skip collision action', async () => {
    const mockPersona = { id: 'test-id', name: 'Test Persona' };
    (decodePersona as any).mockReturnValue({ persona: mockPersona });
    (personaRepository.get as any).mockResolvedValue(mockPersona);

    render(<PersonaImportModal isOpen={true} onClose={mockOnClose} onImportSuccess={mockOnImportSuccess} />);
    
    const textarea = screen.getByPlaceholderText(/Paste Base64URL/i);
    fireEvent.change(textarea, { target: { value: 'valid_data' } });
    fireEvent.click(screen.getByText('Preview'));
    
    await waitFor(() => {
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skip'));

    await waitFor(() => {
      expect(personaRepository.save).not.toHaveBeenCalled();
      expect(mockOnImportSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
