import { describe, test, expect } from 'vitest';
import { parseQuickDescription } from '@/components/create-task-dialog';

describe('CreateTaskDialog - parseQuickDescription', () => {
  describe('Priority extraction', () => {
    test('extracts priority 5 from hashtag', () => {
      const result = parseQuickDescription('Fix bug #5 in auth module');
      expect(result.priority).toBe(5);
    });

    test('extracts priority 10 from hashtag', () => {
      const result = parseQuickDescription('Refactor database schema #10');
      expect(result.priority).toBe(10);
    });

    test('handles priority 1', () => {
      const result = parseQuickDescription('Quick fix #1');
      expect(result.priority).toBe(1);
    });

    test('returns priority 5 when no hashtag present', () => {
      const result = parseQuickDescription('No priority mentioned');
      expect(result.priority).toBe(5);
    });
  });

  describe('File path extraction', () => {
    test('extracts single quoted file path', () => {
      const result = parseQuickDescription('Fix bug in "src/auth/login.ts"');
      expect(result.filesInvolved).toEqual(['src/auth/login.ts']);
      expect(result.description).toBe('Fix bug in');
    });

    test('extracts multiple file paths', () => {
      const result = parseQuickDescription('Update paths in "src/utils.ts" and "src/config.json"');
      expect(result.filesInvolved).toEqual(['src/utils.ts', 'src/config.json']);
      expect(result.description).toBe('Update paths in and');
    });
  });

  describe('Combined parsing', () => {
    test('extracts both priority and multiple files', () => {
      const result = parseQuickDescription('Refactor #8: Update "src/app.ts" and "src/utils.ts"');
      expect(result.priority).toBe(8);
      expect(result.filesInvolved).toEqual(['src/app.ts', 'src/utils.ts']);
      expect(result.description).toBe('Refactor : Update and');
    });
  });
});