import { describe, it, expect } from 'vitest';
import { formatElapsed } from '@/lib/utils';

describe('formatElapsed', () => {
  it('renders sub-minute durations as MM:SS', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(7)).toBe('00:07');
    expect(formatElapsed(59)).toBe('00:59');
  });

  it('renders sub-hour durations as MM:SS without an hour field', () => {
    expect(formatElapsed(60)).toBe('01:00');
    expect(formatElapsed(3599)).toBe('59:59');
  });

  it('promotes to H:MM:SS past the hour instead of overflowing the minutes', () => {
    expect(formatElapsed(3600)).toBe('1:00:00');
    expect(formatElapsed(2 * 3600 + 5 * 60 + 3)).toBe('2:05:03');
    // The regression this replaced: a six-month session printed as '249562:02'.
    expect(formatElapsed(249562 * 60 + 2)).toBe('4159:22:02');
  });

  it('clamps negative and fractional input', () => {
    expect(formatElapsed(-5)).toBe('00:00');
    expect(formatElapsed(90.9)).toBe('01:30');
  });
});
