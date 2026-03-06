import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineSpecEditor } from '@/components/inline-spec-editor';
import '@testing-library/jest-dom';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the server action
vi.mock('@/lib/actions', () => ({
  updateSpecificationDev: vi.fn(),
}));

import * as actions from '@/lib/actions';
const mockUpdateSpecificationDev = actions.updateSpecificationDev as any;

describe('InlineSpecEditor - Core Functionality', () => {
  const mockSpec = {
    id: 1,
    projectId: 1,
    version: '1.0',
    content: '# Test Specification\n\nThis is a test.',
    isActive: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Edit Mode', () => {
    test('starts in view mode', () => {
      render(<InlineSpecEditor specification={mockSpec} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    test('clicking Edit button enters edit mode', () => {
      render(<InlineSpecEditor specification={mockSpec} />);
      fireEvent.click(screen.getByText('Edit'));
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('can cancel editing', () => {
      render(<InlineSpecEditor specification={mockSpec} />);
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Save Operations', () => {
    test('successful save calls onSpecUpdated', async () => {
      const mockOnSpecUpdated = vi.fn();
      mockUpdateSpecificationDev.mockResolvedValue({
        success: true,
        spec: { ...mockSpec, content: 'Updated' }
      });

      render(<InlineSpecEditor specification={mockSpec} onSpecUpdated={mockOnSpecUpdated} />);
      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Updated' } });
      fireEvent.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(mockOnSpecUpdated).toHaveBeenCalled();
      });
    });
  });
});