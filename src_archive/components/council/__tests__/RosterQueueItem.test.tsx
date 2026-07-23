import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RosterQueueItem } from '../RosterQueueItem';
import { SetupParticipant } from '../../../lib/hooks/useCouncilSetup';
import { getAllProviders } from '../../../lib/providers/registry';

// Mock the provider registry
vi.mock('../../../lib/providers/registry', () => ({
  getAllProviders: vi.fn(),
  getProviderCapabilities: vi.fn(),
}));

describe('RosterQueueItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAllProviders as any).mockReturnValue([
      { id: 'openai', name: 'OpenAI' },
      { id: 'anthropic', name: 'Anthropic' },
    ]);
  });

  const mockParticipant: SetupParticipant = {
    persona: {
      id: '1',
      name: 'Test Persona',
      description: 'A test persona',
      instructions: 'Be helpful',
      createdAt: 123,
      updatedAt: 123,
    },
    providerId: 'openai',
    modelId: 'gpt-4o',
  };

  const defaultProps = {
    participant: mockParticipant,
    isFirst: false,
    isLast: false,
    onMoveEarlier: vi.fn(),
    onMoveLater: vi.fn(),
    onRemove: vi.fn(),
    onModelChange: vi.fn(),
    role: 'debater' as const,
  };

  it('renders participant details correctly', () => {
    render(<RosterQueueItem {...defaultProps} />);
    expect(screen.getByText('Test Persona')).toBeInTheDocument();
    expect(screen.getByText('A test persona')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Select Provider' })).toHaveValue('openai');
    expect(screen.getByRole('combobox', { name: 'Select Model' })).toHaveValue('gpt-4o');
  });

  it('calls onMoveEarlier when Move Earlier button is clicked', () => {
    render(<RosterQueueItem {...defaultProps} />);
    const earlierButton = screen.getByLabelText('Move Earlier');
    fireEvent.click(earlierButton);
    expect(defaultProps.onMoveEarlier).toHaveBeenCalled();
  });

  it('calls onMoveLater when Move Later button is clicked', () => {
    render(<RosterQueueItem {...defaultProps} />);
    const laterButton = screen.getByLabelText('Move Later');
    fireEvent.click(laterButton);
    expect(defaultProps.onMoveLater).toHaveBeenCalled();
  });

  it('disables Move Earlier button when isFirst is true', () => {
    render(<RosterQueueItem {...defaultProps} isFirst={true} />);
    const earlierButton = screen.getByLabelText('Move Earlier');
    expect(earlierButton).toBeDisabled();
  });

  it('disables Move Later button when isLast is true', () => {
    render(<RosterQueueItem {...defaultProps} isLast={true} />);
    const laterButton = screen.getByLabelText('Move Later');
    expect(laterButton).toBeDisabled();
  });

  it('calls onRemove when Remove button is clicked', () => {
    render(<RosterQueueItem {...defaultProps} />);
    const removeButton = screen.getByLabelText('Remove Test Persona');
    fireEvent.click(removeButton);
    expect(defaultProps.onRemove).toHaveBeenCalled();
  });

  it('does not render move buttons for synthesizer role', () => {
    render(<RosterQueueItem {...defaultProps} role="synthesizer" />);
    expect(screen.queryByLabelText('Move Earlier')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move Later')).not.toBeInTheDocument();
  });

  it('calls onModelChange when provider or model is changed', () => {
    render(<RosterQueueItem {...defaultProps} />);
    
    const providerSelect = screen.getByLabelText('Select Provider');
    fireEvent.change(providerSelect, { target: { value: 'anthropic' } });
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('anthropic', 'gpt-4o');

    const modelSelect = screen.getByLabelText('Select Model');
    fireEvent.change(modelSelect, { target: { value: 'gpt-4-turbo' } });
    expect(defaultProps.onModelChange).toHaveBeenCalledWith('openai', 'gpt-4-turbo');
  });
});
