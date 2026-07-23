import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { Dialog } from '../dialog';

describe('Dialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Dialog',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Polyfill for HTMLDialogElement methods in jsdom
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function() {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function() {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  });

  it('renders the dialog when isOpen is true', () => {
    render(
      <Dialog {...defaultProps}>
        <div>Dialog Content</div>
      </Dialog>
    );
    
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
  });

  it('does not render content if it starts closed (native dialog starts without open attr)', () => {
    render(
      <Dialog {...defaultProps} isOpen={false}>
        <div>Dialog Content</div>
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog', { hidden: true }) as HTMLDialogElement;
    expect(dialog.open).toBe(false);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Dialog {...defaultProps}>
        <div>Dialog Content</div>
      </Dialog>
    );
    
    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <Dialog {...defaultProps}>
        <div>Dialog Content</div>
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog', { hidden: true });
    fireEvent.click(dialog); // Clicking the dialog itself (which covers the backdrop) triggers close
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog content is clicked', () => {
    render(
      <Dialog {...defaultProps}>
        <div data-testid="content">Dialog Content</div>
      </Dialog>
    );
    
    const content = screen.getByTestId('content');
    fireEvent.click(content);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('passes accessibility checks', async () => {
    const { container } = render(
      <main>
        <Dialog {...defaultProps}>
          <div>Dialog Content</div>
        </Dialog>
      </main>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
