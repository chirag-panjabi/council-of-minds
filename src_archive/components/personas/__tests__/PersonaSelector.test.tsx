import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { PersonaSelector } from '../PersonaSelector';
import { personaRepository } from '../../../lib/db/repositories/persona';

// Mock the repository
vi.mock('../../../lib/db/repositories/persona', () => ({
  personaRepository: {
    search: vi.fn(),
  }
}));

const mockPersonas = [
  { id: '1', name: 'Alice', description: 'Expert 1', isArchived: false, createdAt: 1, updatedAt: 1, instructions: '1' },
  { id: '2', name: 'Bob', description: 'Expert 2', isArchived: false, createdAt: 2, updatedAt: 2, instructions: '2' },
];

describe('PersonaSelector', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mode: 'single' as const,
    onSelect: vi.fn(),
  };

  beforeAll(() => {
    // Polyfill for HTMLDialogElement
    if (typeof window.HTMLDialogElement === 'undefined') {
      (window as any).HTMLDialogElement = HTMLElement;
    }
    
    HTMLDialogElement.prototype.showModal = function() {
      (this as any).open = true;
    };
    HTMLDialogElement.prototype.close = function() {
      (this as any).open = false;
      this.dispatchEvent(new Event('close'));
    };
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (personaRepository.search as any).mockResolvedValue(mockPersonas);
  });

  it('renders a list of personas', async () => {
    render(<PersonaSelector {...defaultProps} />);
    
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('filters personas by search input', async () => {
    render(<PersonaSelector {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search personas...');
    fireEvent.change(searchInput, { target: { value: 'Ali' } });
    
    expect(personaRepository.search).toHaveBeenCalledWith('Ali', 'all');
  });

  it('handles single selection mode', async () => {
    render(<PersonaSelector {...defaultProps} mode="single" />);
    
    const aliceBtn = await screen.findByText('Alice');
    fireEvent.click(aliceBtn);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith(['1'], false);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('passes isIncognito flag when selected', async () => {
    render(<PersonaSelector {...defaultProps} mode="single" />);
    
    const incognitoToggle = screen.getByLabelText('Incognito Session');
    fireEvent.click(incognitoToggle);
    
    const aliceBtn = await screen.findByText('Alice');
    fireEvent.click(aliceBtn);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith(['1'], true);
  });

  it('handles council-debaters multi-selection mode', async () => {
    render(<PersonaSelector {...defaultProps} mode="council-debaters" />);
    
    const aliceBtn = await screen.findByText('Alice');
    const bobBtn = await screen.findByText('Bob');
    
    fireEvent.click(aliceBtn);
    fireEvent.click(bobBtn);
    
    // Should not call onSelect immediately
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
    
    const confirmBtn = screen.getByText('Confirm Selection');
    fireEvent.click(confirmBtn);
    
    expect(defaultProps.onSelect).toHaveBeenCalledWith(['1', '2'], false);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('passes accessibility checks', async () => {
    const { container } = render(<main><PersonaSelector {...defaultProps} /></main>);
    await screen.findByText('Alice'); // wait for load
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
