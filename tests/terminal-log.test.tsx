import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { TerminalLog } from '@/components/ui/terminal-log';

describe('TerminalLog', () => {
  test('renders lines as log output', () => {
    render(<TerminalLog lines={['Hello world', 'Second line']} />);
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    expect(screen.getByText(/Second line/)).toBeInTheDocument();
  });

  // Streaming log output has to announce itself, and it is the assistive-tech
  // contract rather than the visual frame that matters here. This replaces an
  // assertion on the `terminal-surface` class, which was the CRT treatment the
  // UI overhaul deleted.
  test('exposes the log landmark and announces updates', () => {
    render(<TerminalLog lines={['boot']} />);
    const log = screen.getByRole('log', { name: 'Log output' });
    expect(log).toHaveAttribute('aria-live', 'polite');
  });

  test('renders on the neutral log surface, not a CRT one', () => {
    const { container } = render(<TerminalLog lines={[]} />);
    expect(container.firstChild).toHaveClass('bg-log-bg', 'border-line');
    expect(container.firstChild).not.toHaveClass('terminal-surface');
  });

  test('tints lines by severity', () => {
    render(<TerminalLog lines={['ERROR boom', 'WARN careful', 'plain']} />);
    expect(screen.getByText(/ERROR boom/)).toHaveClass('text-danger');
    expect(screen.getByText(/WARN careful/)).toHaveClass('text-warning');
    expect(screen.getByText(/plain/)).toHaveClass('text-log-text');
  });

  test('escapes markup in log lines', () => {
    render(<TerminalLog lines={['<img src=x onerror=alert(1)>']} />);
    const log = screen.getByRole('log');
    expect(log.querySelector('img')).toBeNull();
  });

  test('renders empty state without error', () => {
    const { container } = render(<TerminalLog lines={[]} />);
    expect(container).toBeInTheDocument();
  });
});
