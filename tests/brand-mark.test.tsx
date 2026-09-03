import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLockup, BrandMark } from '@/components/ui/brand-mark';

describe('BrandMark', () => {
  it('is decorative by default', () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('supports an accessible standalone label', () => {
    render(<BrandMark label="Specdrivr" />);
    expect(screen.getByRole('img', { name: 'Specdrivr' })).toBeTruthy();
  });

  it('keeps the product name in the full lockup', () => {
    render(<BrandLockup />);
    expect(screen.getByText('specdrivr')).toBeTruthy();
  });
});
