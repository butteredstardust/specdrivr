import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InlineConstitutionEditor } from '@/components/inline-constitution-editor';

vi.mock('@/lib/actions', () => ({
  updateConstitutionDev: vi.fn().mockResolvedValue({ success: true })
}));

describe('InlineConstitutionEditor', () => {
  it('renders constitution markdown safely', () => {
    const constitution = '# Title\n**bold** and <script>alert("XSS")</script>';
    render(<InlineConstitutionEditor projectId={1} constitution={constitution} />);

    // Title should be rendered
    expect(screen.getByText('Title')).toBeInTheDocument();

    // Bold should be rendered
    expect(screen.getByText('bold')).toBeInTheDocument();

    // XSS should be sanitized
    const container = screen.getByText('Title').closest('div')?.parentElement;
    expect(container?.innerHTML).not.toContain('<script>');
  });
});
