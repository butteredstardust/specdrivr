import { describe, it, expect } from 'vitest';
import { resolveModel, buildCliArgs } from '../src/lib/agent-models';

describe('Agent Model Resolution', () => {
  it('resolves correct models for Gemini backend', () => {
    expect(resolveModel('gemini', 'flash')).toBe('gemini-2.0-flash');
    expect(resolveModel('gemini', 'pro')).toBe('gemini-2.0-pro');
  });

  it('resolves correct models for Claude backend', () => {
    expect(resolveModel('claude', 'flash')).toBe('claude-haiku-4-5');
    expect(resolveModel('claude', 'pro')).toBe('claude-sonnet-4-6');
  });

  it('builds correct CLI args for Gemini', () => {
    const prompt = 'Test prompt';
    const args = buildCliArgs('gemini', prompt, 'flash');
    expect(args).toContain('-p');
    expect(args).toContain(prompt);
    expect(args).toContain('--model');
    expect(args).toContain('gemini-2.0-flash');
  });

  it('builds correct CLI args for Claude', () => {
    const prompt = 'Test prompt';
    const args = buildCliArgs('claude', prompt, 'pro');
    expect(args).toContain('-p');
    expect(args).toContain(prompt);
    expect(args).toContain('--model');
    expect(args).toContain('claude-sonnet-4-6');
    expect(args).toContain('--output-format');
    expect(args).toContain('json');
  });
});
