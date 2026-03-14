import { render } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import { DaemonMascot } from '@/components/ui/daemon-mascot';

describe('DaemonMascot', () => {
  test('renders SVG element', () => {
    const { container } = render(<DaemonMascot />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('uses correct viewBox', () => {
    const { container } = render(<DaemonMascot />);
    expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 34 40');
  });

  test('applies size prop to width and height', () => {
    const { container } = render(<DaemonMascot size={48} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('48');
    expect(svg?.getAttribute('height')).toBe('48');
  });

  test('renders silhouette only at size <= 16', () => {
    const { container } = render(<DaemonMascot size={16} />);
    expect(container.querySelector('[data-tier="silhouette"]')).toBeInTheDocument();
    expect(container.querySelector('[data-tier="full"]')).not.toBeInTheDocument();
  });

  test('renders full detail at size >= 32', () => {
    const { container } = render(<DaemonMascot size={32} />);
    expect(container.querySelector('[data-tier="full"]')).toBeInTheDocument();
  });

  test('accepts all valid expressions without error', () => {
    const expressions: Array<'idle' | 'working' | 'success' | 'blocked' | 'error'> = [
      'idle',
      'working',
      'success',
      'blocked',
      'error',
    ];
    for (const expression of expressions) {
      const { container } = render(<DaemonMascot expression={expression} size={32} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    }
  });
});
