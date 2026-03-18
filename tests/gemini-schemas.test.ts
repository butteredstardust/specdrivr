import { describe, it, expect } from 'vitest';
import { GeneratedPlanSchema, GeneratedTaskListSchema } from '../src/lib/gemini';

describe('Gemini Schema Validation', () => {
  it('validates a correct generated plan', () => {
    const validPlan = {
      intent: 'Test approach',
      phaseLabel: 'Phase 1',
      architectureDecisions: [{ title: 'Decision 1', rationale: 'Reason 1', tradeoffs: 'Trade 1' }],
      estimatedTotalMinutes: 60,
    };
    expect(() => GeneratedPlanSchema.parse(validPlan)).not.toThrow();
  });

  it('fails on invalid plan structure', () => {
    const invalidPlan = {
      intent: 'Missing fields',
    };
    expect(() => GeneratedPlanSchema.parse(invalidPlan)).toThrow();
  });

  it('validates a correct task list', () => {
    const validTasks = {
      tasks: [
        {
          title: 'Task 1',
          description: 'Desc 1',
          filesInvolved: ['file1.ts'],
          dependsOnIndex: null,
          estimatedMinutes: 30,
          doneCriteria: 'Works',
          verifyCommand: 'npm test',
          recommendedModel: 'flash',
        },
      ],
    };
    expect(() => GeneratedTaskListSchema.parse(validTasks)).not.toThrow();
  });

  it('fails on invalid task list', () => {
    const invalidTasks = {
      tasks: [{ title: 'Missing description' }],
    };
    expect(() => GeneratedTaskListSchema.parse(invalidTasks)).toThrow();
  });
});
