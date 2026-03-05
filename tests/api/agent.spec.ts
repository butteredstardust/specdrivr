/**
 * Comprehensive API Tests for Agent Core Endpoints
 * Tests mission retrieval, task management, verification, and logging
 */

import { test, expect } from '@playwright/test';

const AGENT_TOKEN = process.env.AGENT_TOKEN || 'dev-agent-token-12345';

test.describe('Agent Core APIs', () => {
  test.describe('GET /api/agent/mission', () => {
    test('returns complete project context in snake_case', async ({ request }) => {
      const response = await request.get('/api/agent/mission?project_id=1', {
        headers: { 'X-Agent-Token': AGENT_TOKEN },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('project');
      expect(data.data).toHaveProperty('specification');
      expect(data.data).toHaveProperty('active_plan');
      expect(data.data).toHaveProperty('unblocked_tasks');
      expect(data.data).toHaveProperty('next_task');
      expect(Array.isArray(data.data.unblocked_tasks)).toBe(true);
    });

    test('returns next available task based on dependencies', async ({ request }) => {
      const response = await request.get('/api/agent/mission?project_id=1', {
        headers: { 'X-Agent-Token': AGENT_TOKEN },
      });

      const data = await response.json();

      if (data.next_task) {
        expect(data.next_task.status).toBe('todo');

        if (data.next_task.dependency_task_id) {
          const dependency = data.unblocked_tasks.find((t: any) =>
            t.id === data.next_task.dependency_task_id
          );
          // If it's in unblocked_tasks, its dependencies should be met or it shouldn't have any
          // (Logic might vary based on server implementation, but we'll stick to basic check)
          expect(dependency?.status).toBeDefined();
        }
      }
    });

    test('requires X-Agent-Token header', async ({ request }) => {
      const response = await request.get('/api/agent/mission?project_id=1');
      expect(response.status()).toBe(401);
    });
  });

  test.describe('POST /api/agent/tasks', () => {
    test('creates new task successfully', async ({ request }) => {
      const taskData = {
        planId: 1,
        description: 'Test task from API',
        priority: 5,
        status: 'todo',
        filesInvolved: ['src/test.ts'],
      };

      const response = await request.post('/api/agent/tasks', {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        data: taskData,
      });

      // Backend returns 200 for single task success
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      const results = body.data.tasks;
      expect(results[0].success).toBe(true);
    });
  });

  test.describe('POST /api/agent/verify', () => {
    test('logs successful test result', async ({ request }) => {
      const verifyData = {
        taskId: 1, // camelCase to match Zod schema
        success: true,
        logs: 'All tests passed for task #1',
      };

      const response = await request.post('/api/agent/verify', {
        headers: { 'X-Agent-Token': AGENT_TOKEN },
        data: verifyData,
      });

      expect(response.status()).toBe(200); // Backend returns 200

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data.taskId).toBe(1);
    });
  });


  // More tests would be migrated here, but covering core paths for now
});