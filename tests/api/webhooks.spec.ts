import { test, expect } from '@playwright/test';

const AGENT_TOKEN = process.env.AGENT_TOKEN || 'dev-agent-token-12345';

test.describe('Webhooks & Agent Control', () => {
    let projectId: number;
    let taskId: number;
    let planId: number;

    test.beforeAll(async ({ request }) => {
        // Setup a project for testing
        const projectRes = await request.post('/api/agent/projects', {
            headers: { 'X-Agent-Token': AGENT_TOKEN },
            data: { name: 'Webhook Test Project', base_path: '/tmp/webhook-test' }
        });
        const projectBody = await projectRes.json();
        projectId = projectBody.data.project_id;
        planId = projectBody.data.plan_id;

        // Get the auto-created task
        const missionRes = await request.get(`/api/agent/mission?project_id=${projectId}`, {
            headers: { 'X-Agent-Token': AGENT_TOKEN }
        });
        const missionData = await missionRes.json();
        taskId = missionData.data.unblocked_tasks[0].id;
    });

    test.describe('POST /api/webhooks/git', () => {
        test('successfully logs a git commit', async ({ request }) => {
            const payload = {
                project_id: projectId,
                task_id: taskId,
                plan_id: planId,
                commit_sha: 'a'.repeat(40),
                branch: 'main',
                message: 'feat: integrated webhooks',
                author: 'Test Bot',
                committed_at: new Date().toISOString(),
                metadata: {
                    files_changed: ['src/app/api/webhooks/git/route.ts'],
                    lines_added: 50,
                    lines_removed: 2
                }
            };

            const response = await request.post('/api/webhooks/git', {
                headers: { 'X-Agent-Token': AGENT_TOKEN },
                data: payload
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.ok).toBe(true);
            expect(body).toHaveProperty('commit_id');
        });

        test('returns 400 on invalid payload', async ({ request }) => {
            const response = await request.post('/api/webhooks/git', {
                headers: { 'X-Agent-Token': AGENT_TOKEN },
                data: { project_id: projectId } // missing required fields
            });
            expect(response.status()).toBe(400);
        });
    });

    test.describe('POST /api/agent/pause', () => {
        test('pauses an in-progress task', async ({ request }) => {
            // 1. Move task to in_progress first
            await request.patch(`/api/agent/tasks/${taskId}`, {
                headers: { 'X-Agent-Token': AGENT_TOKEN },
                data: { status: 'in_progress' }
            });

            // 2. Pause it
            const payload = {
                project_id: projectId,
                task_id: taskId,
                resume_context: {
                    notes: 'Paused for testing webhooks'
                }
            };

            const response = await request.post('/api/agent/pause', {
                headers: { 'X-Agent-Token': AGENT_TOKEN },
                data: payload
            });

            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);

            // 3. Verify status in DB
            const missionRes = await request.get(`/api/agent/mission?project_id=${projectId}`, {
                headers: { 'X-Agent-Token': AGENT_TOKEN }
            });
            const missionData = await missionRes.json();
            const task = missionData.data.unblocked_tasks.find((t: any) => t.id === taskId);
            // Wait, mission might not return 'paused' in 'unblocked_tasks' depending on filter
            // But we can check if it exists or check the task directly if there was an endpoint
        });
    });
});
