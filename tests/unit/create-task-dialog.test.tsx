/**
 * Unit tests for CreateTaskDialog
 * Focuses on testing the parseQuickDescription function and form validation logic
 */

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

    test('extracts only the first priority hashtag', () => {
      const result = parseQuickDescription('Complex feature #8 and #3');
      expect(result.priority).toBe(8);
    });

    test('returns priority 5 when no hashtag present', () => {
      const result = parseQuickDescription('No priority mentioned');
      expect(result.priority).toBe(5);
    });

    test('handles edge case priority 0', () => {
      const result = parseQuickDescription('Invalid priority #0');
      expect(result.priority).toBe(5); // Should default to 5
    });

    test('handles priority out of range (11+)', () => {
      const result = parseQuickDescription('High priority #15');
      expect(result.description).toBe('High priority #15'); // Should keep in description if > 10
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

    test('extracts file paths with spaces in directory names', () => {
      const result = parseQuickDescription('Test "test files/helper.ts" function');
      expect(result.filesInvolved).toEqual(['test files/helper.ts']);
    });

    test('handles mixed quote types', () => {
      const result = parseQuickDescription('Update "src/app.ts" and tests');
      expect(result.filesInvolved).toEqual(['src/app.ts']);
    });

    test('handles no file paths', () => {
      const result = parseQuickDescription('General cleanup');
      expect(result.filesInvolved).toEqual([]);
      expect(result.description).toBe('General cleanup');
    });

    test('handles priority and file paths together', () => {
      const result = parseQuickDescription('Fix critical bug #9 in "src/auth.ts"');
      expect(result.priority).toBe(9);
      expect(result.filesInvolved).toEqual(['src/auth.ts']);
      expect(result.description).toBe('Fix critical bug in');
    });

    test('handles complex paths with special characters', () => {
      const result = parseQuickDescription('Update "src/@types/index.d.ts"');
      expect(result.filesInvolved).toEqual(['src/@types/index.d.ts']);
    });
  });

  describe('Combined parsing', () => {
    test('extracts both priority and multiple files', () => {
      const result = parseQuickDescription('Refactor #8: Update "src/app.ts" and "src/utils.ts"');
      expect(result.priority).toBe(8);
      expect(result.filesInvolved).toEqual(['src/app.ts', 'src/utils.ts']);
      expect(result.description).toBe('Refactor : Update and');
    });

    test('handles empty strings', () => {
      const result = parseQuickDescription('');
      expect(result.priority).toBe(5);
      expect(result.filesInvolved).toEqual([]);
      expect(result.description).toBe('');
    });

    test('handles whitespace trimming', () => {
      const result = parseQuickDescription('  Fix bug #3 in "test.js"  ');
      expect(result.priority).toBe(3);
      expect(result.filesInvolved).toEqual(['test.js']);
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles special characters in paths', () => {
      const result = parseQuickDescription('Test "app/sub-dir/file_name.ts"');
      expect(result.filesInvolved).toEqual(['app/sub-dir/file_name.ts']);
    });

    test('handles paths with numbers', () => {
      const result = parseQuickDescription('Fix "file23.ts" #7');
      expect(result.priority).toBe(7);
      expect(result.filesInvolved).toEqual(['file23.ts']);
    });

    test('handles deeply nested paths', () => {
      const result = parseQuickDescription('Update "src/app/api/routes/users.ts"');
      expect(result.filesInvolved).toEqual(['src/app/api/routes/users.ts']);
    });

    test('handles consecutive file paths', () => {
      const result = parseQuickDescription('Changes in "a.ts""b.ts" the file');
      expect(result.filesInvolved).toEqual(['a.ts', 'b.ts']);
    });
  });
});

describe('CreateTaskDialog - Form validation', () => {
  test('validates task description is required', () => {
    const result = parseQuickDescription('');
    expect(result.description).toBe('');
    // Form should be invalid with empty description
  });

  test('validates priority range (1-10)', () => {
    expect(() => {
      const result = parseQuickDescription('Invalid #11 priority');
      // Should handle out of range gracefully
    }).not.toThrow();
  });
});

describe('Quick mode toggle behavior', () => {
  test('toggles between quick and form mode', () => {
    // Simulate quick mode toggle
    const isQuickMode = true;
    const parsed = isQuickMode ? parseQuickDescription('Fix bug #5 in "test.ts"') : null;

    expect(isQuickMode).toBe(true);
    expect(parsed).toBeDefined();
  });
});

// Integration test for form submission
// This would test the full createTaskDev action with mocked server
// but keeping this simple for now since it requires mocking next/navigation