import { test, expect } from '@playwright/test';

const AGENT_TOKEN = process.env.AGENT_TOKEN || 'dev-agent-token-12345';

test.test.describe('Projects & Tasks Management', () => {

  test.test.describe('POST /api/agent/projects', () => {
    test('creates project, spec, and plan in a single transaction', async ({ request }) => {
      const payload = {
        name: 'Automated Test Project',
        description: 'Testing the multi-record transaction',
        mission: 'Successfully test the project creation loop',
        tech_stack: ['Next.js', 'Playwright', 'Vitest'],
        plan_status: 'active'
      };

      const response = await request.post('/api/agent/projects', {
        headers: { 'X-Agent-Token': AGENT_TOKEN },
        data: payload
      });

      expect(response.status()).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('project_id');
      expect(body.data).toHaveProperty('specification_id');
      expect(body.data).toHaveProperty('plan_id');
      expect(body.data).toHaveProperty('mission_url');
    });

    test('automatically creates the initial analysis task when base_path is provided', async ({ request }) => {
      const payload = {
        name: 'Project with Base Path',
        base_path: '/tmp/test-project-path',
        mission: 'Testing auto-task generation'
      };

      const response = await request.post('/api/agent/projects', {
        headers: { 'X-Agent-Token': AGENT_TOKEN },
        data: payload
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      const projectId = body.data.project_id;

      // Verify task creation via mission endpoint
      const missionRes = await request.get(`/api/agent/mission?project_id=${projectId}`, {
        headers: { 'X-Agent-Token': AGENT_TOKEN }
      });
      const missionData = await missionRes.json();

      expect(missionData.data.unblocked_tasks.length).toBeGreaterThan(0);
      expect(missionData.data.unblocked_tasks[0].description).toContain('Analyse codebase at /tmp/test-project-path');
    });

    test('returns 400 when required fields are missing', async ({ request }) => {
      const response = await request.post('/api/agent/projects', {
        headers: { 'X-Agent-Token': AGENT_TOKEN },
        data: {
          // Missing 'name'
          description: 'Invalid project'
        }
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
    });

    test('protects endpoint with X-Agent-Token', async ({ request }) => {
      const response = await request.post('/api/agent/projects', {
        data: { name: 'Unauthorized project' }
      });
      expect(response.status()).toBe(401);
    });
  });

  test.test.describe('GET /api/projects', () => {
    test('returns list of projects', async ({ request }) => {
      const response = await request.get('/api/projects');
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
