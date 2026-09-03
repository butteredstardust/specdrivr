import { describe, expect, it } from 'vitest';
import { getSafeInternalPath } from '@/lib/redirects';

describe('getSafeInternalPath', () => {
  it('allows internal paths with query strings', () => {
    expect(getSafeInternalPath('/specs/12?tab=plan')).toBe('/specs/12?tab=plan');
  });

  it.each([
    null,
    '',
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/specs\nmalicious',
  ])('falls back for unsafe redirect target %s', (target) => {
    expect(getSafeInternalPath(target)).toBe('/');
  });
});
