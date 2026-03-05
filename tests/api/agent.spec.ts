/**
 * Comprehensive API Tests for Agent Core Endpoints
 * Tests mission retrieval, task management, verification, and logging
 */

import { describe, test, expect, beforeAll } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const AGENT_TOKEN = process.env.AGENT_TOKEN || 'dev-agent-token-12345';

describe('Agent Core APIs', () => {
  describe('GET /api/agent/mission', () => {
    test('returns complete project context', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/mission?project_id=1`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('project');
      expect(data).toHaveProperty('specification');
      expect(data).toHaveProperty('plan');
      expect(data).toHaveProperty('tasks');
      expect(data).toHaveProperty('nextTask');
      expect(data).toHaveProperty('context');
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    test('returns next available task based on dependencies', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/mission?project_id=1`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      const data = await response.json();

      // If there's a next task, verify its status
      if (data.nextTask) {
        expect(data.nextTask.status).toBe('todo');

        // If it has dependencies, verify they're completed
        if (data.nextTask.dependency_task_id) {
          const dependency = data.tasks.find((t: any) =>
            t.id === data.nextTask.dependency_task_id
          );
          expect(dependency?.status).toBe('done');
        }
      }
    });

    test('requires X-Agent-Token header', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/mission?project_id=1`);
      expect(response.status).toBe(401);
    });

    test('handles invalid project_id gracefully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/mission?project_id=99999`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.tasks).toHaveLength(0);
      expect(data.nextTask).toBeNull();
    });

    test('returns active specification only', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/mission?project_id=1`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      const data = await response.json();
      expect(data.specification).toBeDefined();
      expect(data.specification.isActive).toBe(true);
    });
  });

  describe('POST /api/agent/tasks', () => {
    test('creates new task successfully', async () => {
      const taskData = {
        projectId: 1,
        description: 'Test task from API',
        priority: 'medium',
        status: 'todo',
        filesInvolved: ['src/test.ts'],
      };

      const response = await fetch(`${API_BASE_URL}/api/agent/tasks`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(201);

      const createdTask = await response.json();
      expect(createdTask.description).toBe(taskData.description);
      expect(createdTask.priority).toBe(taskData.priority);
      expect(createdTask.status).toBe('todo');
    });

    test('requires authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Test',
        }),
      });

      expect(response.status).toBe(401);
    });

    test('validates required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/tasks`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect(response.status).toBe(400);
    });

    test('accepts optional dependencies', async () => {
      const taskData = {
        projectId: 1,
        description: 'Task with dependency',
        priority: 'high',
        status: 'todo',
        dependencyTaskId: 1,
      };

      const response = await fetch(`${API_BASE_URL}/api/agent/tasks`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(201);

      const task = await response.json();
      expect(task.dependency_task_id).toBe(1);
    });
  });

  describe('PATCH /api/agent/tasks/:id', () => {
    let testTaskId: number;

    beforeAll(async () => {
      // Create a test task
      const response = await fetch(`${API_BASE_URL}/api/agent/tasks`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 1,
          description: 'Task to update',
          priority: 'low',
        }),
      });

      const task = await response.json();
      testTaskId = task.id;
    });

    test('updates task status successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/tasks/${testTaskId}`, {
        method: 'PATCH',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);

      const updatedTask = await response.json();
      expect(updatedTask.status).toBe('in_progress');
    });

    test('validates status enum values', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/tasks/${testTaskId}`, {
        method: 'PATCH',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'invalid_status',
        }),
      });

      expect([400, 422]).toContain(response.status);
    });

    test('updates task completion time when status changes to done', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/tasks/${testTaskId}`, {
        method: 'PATCH',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'done',
          completed_at: new Date().toISOString(),
        }),
      });

      expect(response.status).toBe(200);

      const task = await response.json();
      expect(task.status).toBe('done');
      expect(task.completed_at).toBeDefined();
    });
  });

  describe('POST /api/agent/verify', () => {
    test('logs successful test result', async () => {
      const verifyData = {
        task_id: 1,
        success: true,
        logs: 'All tests passed for task #1',
      };

      const response = await fetch(`${API_BASE_URL}/api/agent/verify`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyData),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.task_id).toBe(1);
    });

    test('logs failed test result', async () => {
      const verifyData = {
        task_id: 1,
        success: false,
        logs: 'Tests failed: authentication error',
      };

      const response = await fetch(`${API_BASE_URL}/api/agent/verify`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyData),
      });

      expect(response.status).toBe(201);

      const result = await response.json();
      expect(result.success).toBe(false);
    });

    test('validates required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/verify`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/agent/logs', () => {
    test('adds agent log entry', async () => {
      const logData = {
        task_id: 1,
        level: 'info',
        message: 'Task execution started',
        context: {
          step: 'initialization',
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/agent/logs`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      expect(response.status).toBe(201);

      const log = await response.json();
      expect(log.level).toBe('info');
      expect(log.task_id).toBe(1);
      expect(log.context).toBeDefined();
    });

    test('validates log level enum', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/logs`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: 1,
          level: 'invalid_level',
          message: 'Test',
        }),
      });

      expect([400, 422]).toContain(response.status);
    });

    test('requires task_id', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/logs`, {
        method: 'POST',
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'info',
          message: 'Test without task',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/agent/wave', () => {
    test('returns parallel execution wave (unblocked tasks)', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/wave?project_id=1`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // All returned tasks should have no dependencies or all dependencies completed
      if (data.length > 0) {
        const task = data[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('description');

        // If has dependency, verify it's completed
        if (task.dependency_task_id) {
          const dep = await fetch(`${API_BASE_URL}/api/agent/tasks/${task.dependency_task_id}`, {
            headers: {
              'X-Agent-Token': AGENT_TOKEN,
            },
          });
          const depTask = await dep.json();
          expect(depTask.status).toBe('done');
        }
      }
    });

    test('returns empty array for project with no available tasks', async () => {
      // This would test a project where all tasks are blocked or have unmet dependencies
      const response = await fetch(`${API_BASE_URL}/api/agent/wave?project_id=999`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    });

    test('requires authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/wave?project_id=1`);
      expect(response.status).toBe(401);
    });
  });

  describe('Error handling', () => {
    test('returns 401 without X-Agent-Token for all endpoints', async () => {
      const endpoints = [
        { url: `${API_BASE_URL}/api/agent/mission?project_id=1`, method: 'GET' },
        { url: `${API_BASE_URL}/api/agent/tasks`, method: 'POST' },
        { url: `${API_BASE_URL}/api/agent/tasks/1`, method: 'PATCH' },
        { url: `${API_BASE_URL}/api/agent/verify`, method: 'POST' },
        { url: `${API_BASE_URL}/api/agent/logs`, method: 'POST' },
        { url: `${API_BASE_URL}/api/agent/wave?project_id=1`, method: 'GET' },
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: endpoint.method === 'POST' || endpoint.method === 'PATCH'
            ? { 'Content-Type': 'application/json' }
            : {},
        });

        expect(response.status).toBe(401);
      }
    });

    test('validates project_id is required', async () => {
      const response = await fetch(`${API_BASE_URL}/api/agent/mission`, {
        headers: {
          'X-Agent-Token': AGENT_TOKEN,
        },
      });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    test('creates multiple tasks in sequence', async () => {
      const tasks = [
        { projectId: 1, description: 'Task 1', priority: 'high' },
        { projectId: 1, description: 'Task 2', priority: 'medium' },
        { projectId: 1, description: 'Task 3', priority: 'low' },
      ];

      const createdTasks = [];

      for (const taskData of tasks) {
        const response = await fetch(`${API_BASE_URL}/api/agent/tasks`, {
          method: 'POST',
          headers: {
            'X-Agent-Token': AGENT_TOKEN,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(taskData),
        });

        expect(response.status).toBe(201);
        const task = await response.json();
        createdTasks.push(task);
      }

      // Verify all tasks created
      expect(createdTasks).toHaveLength(3);
      expect(createdTasks[0].description).toBe('Task 1');
      expect(createdTasks[1].description).toBe('Task 2');
      expect(createdTasks[2].description).toBe('Task 3');
    });
  });
});

// Run tests directly if needed
if (require.main === module) {
  console.log('Running Agent API tests...');
}