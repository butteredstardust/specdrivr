/**
 * Unit tests for InlineSpecEditor component
 * Tests markdown rendering, editing modes, version history, and save/cancel operations
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InlineSpecEditor } from '@/components/inline-spec-editor';
import '@testing-library/jest-dom';

// Mock the server action
jest.mock('@/lib/actions', () => ({
  updateSpecificationDev: jest.fn(),
}));

const mockUpdateSpecificationDev = require('@/lib/actions').updateSpecificationDev;

describe('InlineSpecEditor - Core Functionality', () => {
  const mockSpec = {
    id: 1,
    projectId: 1,
    version: 1,
    content: '# Test Specification\n\nThis is a test.',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Markdown Rendering', () => {
    test('renders H1 headings correctly', () => {
      const spec = {
        ...mockSpec,
        content: '# Heading 1',
      };

      render(<InlineSpecEditor specification={spec} />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Heading 1');
    });

    test('renders H2 headings correctly', () => {
      const spec = {
        ...mockSpec,
        content: '## Heading 2',
      };

      render(<InlineSpecEditor specification={spec} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Heading 2');
    });

    test('renders H3 headings correctly', () => {
      const spec = {
        ...mockSpec,
        content: '### Heading 3',
      };

      render(<InlineSpecEditor specification={spec} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Heading 3');
    });

    test('renders bold text correctly', () => {
      const spec = {
        ...mockSpec,
        content: '**bold text**',
      };

      render(<InlineSpecEditor specification={spec} />);

      const strongElement = screen.getByText('bold text');
      expect(strongElement.tagName).toBe('STRONG');
    });

    test('renders italic text correctly', () => {
      const spec = {
        ...mockSpec,
        content: '*italic text*',
      };

      render(<InlineSpecEditor specification={spec} />);

      const emphasis = screen.getByText('italic text');
      expect(emphasis.tagName).toBe('EM');
    });

    test('renders unordered lists correctly', () => {
      const spec = {
        ...mockSpec,
        content: '- Item 1\n- Item 2\n- Item 3',
      };

      render(<InlineSpecEditor specification={spec} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('Item 1');
      expect(items[0]).toHaveClass('list-disc');
    });

    test('renders ordered lists correctly', () => {
      const spec = {
        ...mockSpec,
        content: '1. First\n2. Second\n3. Third',
      };

      render(<InlineSpecEditor specification={spec} />);

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('First');
    });

    test('renders code blocks correctly', () => {
      const spec = {
        ...mockSpec,
        content: '```javascript\nconst x = 1;\n```',
      };

      render(<InlineSpecEditor specification={spec} />);

      const codeBlock = screen.getByRole('code');
      expect(codeBlock).toBeInTheDocument();
      expect(codeBlock).toHaveTextContent('const x = 1;');
    });

    test('renders inline code correctly', () => {
      const spec = {
        ...mockSpec,
        content: 'This is `inline code` sample.',
      };

      render(<InlineSpecEditor specification={spec} />);

      const inlineCode = screen.getByText('inline code');
      expect(inlineCode.tagName).toBe('CODE');
    });

    test('renders blockquotes correctly', () => {
      const spec = {
        ...mockSpec,
        content: '> This is a blockquote',
      };

      render(<InlineSpecEditor specification={spec} />);

      const blockquote = screen.getByRole('blockquote');
      expect(blockquote).toHaveTextContent('This is a blockquote');
      expect(blockquote).toHaveClass('border-l-4');
    });

    test('handles mixed markdown correctly', () => {
      const spec = {
        ...mockSpec,
        content: '# Title\n\n## Subtitle\n\n- Item 1\n- Item 2\n\n**bold** and *italic* text.',
      };

      render(<InlineSpecEditor specification={spec} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByText('bold')).toBeInTheDocument();
      expect(screen.getByText('italic')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    test('starts in view mode', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      expect(screen.getByLabelText('Edit')).toBeInTheDocument();
      expect(screen.queryByRole('textarea')).not.toBeInTheDocument();
    });

    test('clicking Edit button enters edit mode', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      const editButton = screen.getByLabelText('Edit');
      fireEvent.click(editButton);

      expect(screen.getByRole('textarea')).toBeInTheDocument();
      expect(screen.getByLabelText('Save')).toBeInTheDocument();
      expect(screen.getByLabelText('Cancel')).toBeInTheDocument();
    });

    test('textarea contains current content when editing', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));

      const textarea = screen.getByRole('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(mockSpec.content);
    });

    test('can type in textarea', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));

      const textarea = screen.getByRole('textarea');
      fireEvent.change(textarea, { target: { value: '# Updated content' } });

      expect((textarea as HTMLTextAreaElement).value).toBe('# Updated content');
    });

    test('Save button is disabled when content is empty', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));

      const textarea = screen.getByRole('textarea');
      fireEvent.change(textarea, { target: { value: '' } });

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });

    test('Save button is disabled when content has only whitespace', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));

      const textarea = screen.getByRole('textarea');
      fireEvent.change(textarea, { target: { value: '   \n  ' } });

      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
    });

    test('clicking Cancel exits edit mode and restores content', () => {
      render(<InlineSpecEditor specification={mockSpec} />);

      // Enter edit mode and change content
      fireEvent.click(screen.getByText('Edit'));
      const textarea = screen.getByRole('textarea');
      fireEvent.change(textarea, { target: { value: 'Modified content' } });

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Should be back in view mode with original content
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Specification');
      expect(screen.queryByRole('textarea')).not.toBeInTheDocument();
    });

    test('clicking Cancel clears error messages', () => {
      const mockOnSpecUpdated = jest.fn();
      mockUpdateSpecificationDev.mockResolvedValue({
        success: false,
        error: 'Save failed',
      });

      render(<InlineSpecEditor specification={mockSpec} onSpecUpdated={mockOnSpecUpdated} />);

      // Enter edit mode, make a change, and save
      fireEvent.click(screen.getByText('Edit'));
      const textarea = screen.getByRole('textarea');
      fireEvent.change(textarea, { target: { value: 'Modified content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      // Wait for error
      waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });

      // Cancel should clear error
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('Save failed')).not.toBeInTheDocument();
    });
  });

  describe('Save Operations', () => {
    test('clicking Save calls updateSpecificationDev with correct params', async () => {
      const mockOnSpecUpdated = jest.fn();
      mockUpdateSpecificationDev.mockResolvedValue({
        success: true,
        spec: mockSpec,
      });

      render(<InlineSpecEditor specification={mockSpec} onSpecUpdated={mockOnSpecUpdated} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(mockUpdateSpecificationDev).toHaveBeenCalledWith(mockSpec.id, 'Updated content');
      });
    });

    test('successful save exits edit mode', async () => {
      const mockOnSpecUpdated = jest.fn();
      mockUpdateSpecificationDev.mockResolvedValue({
        success: true,
        spec: { ...mockSpec, content: 'Updated content' },
      });

      render(<InlineSpecEditor specification={mockSpec} onSpecUpdated={mockOnSpecUpdated} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(screen.queryByRole('textarea')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Specification');
      });
    });

    test('successful save calls onSpecUpdated callback', async () => {
      const mockOnSpecUpdated = jest.fn();
      const updatedSpec = { ...mockSpec, content: 'Updated content' };
      mockUpdateSpecificationDev.mockResolvedValue({
        success: true,
        spec: updatedSpec,
      });

      render(<InlineSpecEditor specification={mockSpec} onSpecUpdated={mockOnSpecUpdated} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(mockOnSpecUpdated).toHaveBeenCalledWith(updatedSpec);
      });
    });

    test('failed save shows error message', async () => {
      mockUpdateSpecificationDev.mockResolvedValue({
        success: false,
        error: 'Failed to save specification',
      });

      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Failed to save specification')).toBeInTheDocument();
      });
    });

    test('failed save stays in edit mode', async () => {
      mockUpdateSpecificationDev.mockResolvedValue({
        success: false,
        error: 'Failed to save',
      });

      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(screen.queryByRole('textarea')).toBeInTheDocument();
      });
    });

    test('Save button shows loading state', async () => {
      mockUpdateSpecificationDev.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true, spec: mockSpec }), 100))
      );

      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated content' } });
      fireEvent.click(screen.getByLabelText('Save'));

      expect(screen.getByText('Saving...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Version History', () => {
    const mockSpecs: SpecificationSelect[] = [
      mockSpec,
      {
        id: 2,
        projectId: 1,
        version: 2,
        content: '# Version 2\n\nUpdated content.',
        isActive: false,
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    test('shows version button when multiple versions exist', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      expect(screen.getByText(/v1/)).toBeInTheDocument();
    });

    test('clicking version button shows version history', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      fireEvent.click(screen.getByText(/v1/));

      expect(screen.getByText('Version History (2 versions)')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
    });

    test('clicking version button again hides version history', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      const versionButton = screen.getByText(/v1/);
      fireEvent.click(versionButton);

      expect(screen.getByText('Version History (2 versions)')).toBeInTheDocument();

      fireEvent.click(versionButton);

      expect(screen.queryByText('Version History (2 versions)')).not.toBeInTheDocument();
    });

    test('viewing a version shows current content', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      fireEvent.click(screen.getByText(/v1/));
      fireEvent.click(screen.getAllByText('View')[1]); // View v2

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Version 2');
    });

    test('viewing a historical version shows warning', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      fireEvent.click(screen.getByText(/v1/));
      fireEvent.click(screen.getAllByText('View')[1]); // View v2

      expect(screen.getByText('Historical View')).toBeInTheDocument();
    });

    test('can restore a historical version', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      fireEvent.click(screen.getByText(/v1/));
      fireEvent.click(screen.getByText('Restore')); // Restore v2

      expect(screen.getByRole('textarea')).toBeInTheDocument();
      const textarea = screen.getByRole('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toContain('Version 2');
    });

    test('restore shows warning about creating new version', () => {
      render(<InlineSpecEditor specification={mockSpec} allSpecs={mockSpecs} />);

      fireEvent.click(screen.getByText(/v1/));
      fireEvent.click(screen.getByText('Restore')); // Restore v2

      expect(screen.getByText(/Restoring v2\. Saving will create a new version/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('shows error when save fails', async () => {
      mockUpdateSpecificationDev.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    test('error is cleared when entering edit mode again', async () => {
      mockUpdateSpecificationDev.mockResolvedValue({
        success: false,
        error: 'Save failed',
      });

      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));
      fireEvent.click(screen.getByText('Edit'));

      expect(screen.queryByText('Save failed')).not.toBeInTheDocument();
    });

    test('handles exceptions in save operation', async () => {
      mockUpdateSpecificationDev.mockRejectedValue(new Error('Unexpected error'));

      render(<InlineSpecEditor specification={mockSpec} />);

      fireEvent.click(screen.getByText('Edit'));
      fireEvent.change(screen.getByRole('textarea'), { target: { value: 'Updated' } });
      fireEvent.click(screen.getByLabelText('Save'));

      await waitFor(() => {
        expect(screen.getByText('Unexpected error')).toBeInTheDocument();
      });
    });
  });
});