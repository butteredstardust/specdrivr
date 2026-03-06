import { describe, it, expect } from 'vitest';
import { taskStatusColors } from '../../src/lib/ios-styles';

describe('ios-styles', () => {
  describe('taskStatusColors', () => {
    it('should be defined and be an object', () => {
      expect(taskStatusColors).toBeDefined();
      expect(typeof taskStatusColors).toBe('object');
    });

    it('should contain all expected task statuses', () => {
      const expectedStatuses = ['todo', 'in_progress', 'paused', 'blocked', 'done', 'skipped'];
      const actualStatuses = Object.keys(taskStatusColors);

      expect(actualStatuses.length).toBe(expectedStatuses.length);
      expectedStatuses.forEach(status => {
        expect(actualStatuses).toContain(status);
      });
    });

    it('should have correct structure for each status (bg and text properties)', () => {
      Object.values(taskStatusColors).forEach(statusConfig => {
        expect(statusConfig).toHaveProperty('bg');
        expect(typeof statusConfig.bg).toBe('string');
        expect(statusConfig).toHaveProperty('text');
        expect(typeof statusConfig.text).toBe('string');
      });
    });

    it('should have correct values for specific statuses', () => {
      expect(taskStatusColors.todo).toEqual({
        bg: 'bg-[var(--status-todo-bg)]',
        text: 'text-[var(--status-todo-text)]'
      });

      expect(taskStatusColors.in_progress).toEqual({
        bg: 'bg-[var(--status-inprogress-bg)]',
        text: 'text-[var(--status-inprogress-text)]'
      });

      expect(taskStatusColors.done).toEqual({
        bg: 'bg-[var(--status-done-bg)]',
        text: 'text-[var(--status-done-text)]'
      });

      expect(taskStatusColors.paused).toEqual({
        bg: 'bg-[var(--status-paused-bg)]',
        text: 'text-[var(--status-paused-text)]'
      });

      expect(taskStatusColors.blocked).toEqual({
        bg: 'bg-[var(--status-blocked-bg)]',
        text: 'text-[var(--status-blocked-text)]'
      });

      expect(taskStatusColors.skipped).toEqual({
        bg: 'bg-[var(--status-skipped-bg)]',
        text: 'text-[var(--status-skipped-text)]'
      });
    });
  });
});
