/**
 * API tests for project management endpoints
 * Tests project listing, retrieval, and management
 */

import { test, expect } from '@playwright/test';

test.describe('Projects API', () => {
  test('GET /api/projects returns list of all projects', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/projects');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Verify project structure
    const project = data[0];
    expect(project).toHaveProperty('id');
    expect(project).toHaveProperty('name');
    expect(project).toHaveProperty('description');
    expect(project).toHaveProperty('agentStatus');
  });

  test('GET /api/projects returns correct project structure', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/projects');

    const projects = await response.json();
    const project = projects[0];

    expect(project).toHaveProperty('id');
    expect(typeof project.id).toBe('number');
    expect(project).toHaveProperty('name');
    expect(typeof project.name).toBe('string');
    expect(project).toHaveProperty('description');
    expect(typeof project.description).toBe('string');
    expect(project).toHaveProperty('mission');
    expect(typeof project.mission).toBe('string');
    expect(project).toHaveProperty('createdAt');
    expect(typeof project.createdAt).toBe('string');
    expect(project).toHaveProperty('updatedAt');
    expect(typeof project.updatedAt).toBe('string');
  });
});

test.describe('Tasks API', () => {
  test('GET /api/tasks returns all tasks across projects', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/tasks');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // Verify task structure
    const task = data[0];
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('description');
    expect(task).toHaveProperty('status');
    expect(task).toHaveProperty('priority');
  });

  test('GET /api/tasks includes project information', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/tasks');

    const tasks = await response.json();

    if (tasks.length > 0) {
      const task = tasks[0];
      expect(task).toHaveProperty('projectId');
      expect(typeof task.projectId).toBe('number');
    }
  });
});

import { Agent, Task, Plan, Log } from '@/db/schema';

interface WaveSyncData {
  agent: Agent;
  tasks: Array<Task>;
  logs: Array<Log>;
  plans: Array<Plan>;
  projectId: number;
}

test.describe('Agent Wave Sync API', () => {
  test('POST /api/agent/wave returns agent state data', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/agent/wave', {
      data: { projectId: 1 },
    });

    expect(response.status()).toBe(200);

    const data: WaveSyncData = await response.json();
    expect(data).toHaveProperty('agent');
    expect(data).toHaveProperty('tasks');
    expect(data).toHaveProperty('logs');
    expect(data).toHaveProperty('plans');
    expect(data).toHaveProperty('projectId', 1);

    expect(Array.isArray(data.tasks)).toBe(true);
    expect(Array.isArray(data.logs)).toBe(true);
    expect(Array.isArray(data.plans)).toBe(true);
  });
});
