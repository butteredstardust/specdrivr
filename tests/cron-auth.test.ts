import { describe, it, expect } from 'vitest';
import { isValidBearerSecret } from '@/lib/cron-auth';

const SECRET = 'x'.repeat(40);

describe('isValidBearerSecret', () => {
  it('accepts the exact secret', () => {
    expect(isValidBearerSecret(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it.each([
    [null],
    [''],
    [SECRET],
    [`Basic ${SECRET}`],
    [`Bearer ${SECRET}x`],
    ['Bearer short'],
    ['Bearer '],
  ])('rejects %j', (header) => {
    expect(isValidBearerSecret(header, SECRET)).toBe(false);
  });

  it('rejects everything when no secret is configured', () => {
    expect(isValidBearerSecret('Bearer ', '')).toBe(false);
  });
});
