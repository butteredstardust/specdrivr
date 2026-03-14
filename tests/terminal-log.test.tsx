import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { TerminalLog } from '@/components/ui/terminal-log';

describe('TerminalLog', () => {
  test('renders lines as terminal output', () => {
    render(<TerminalLog lines={['Hello world', 'Second line']} />);
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
  });

  test('applies terminal-surface class for scanlines', () => {
    const { container } = render(<TerminalLog lines={[]} />);
    expect(container.firstChild).toHaveClass('terminal-surface');
  });

  test('renders empty state without error', () => {
    const { container } = render(<TerminalLog lines={[]} />);
    expect(container).toBeInTheDocument();
  });
});
