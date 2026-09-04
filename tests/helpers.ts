import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

// Directly read from process.env to avoid env-core.ts initialization issues during Vitest
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr';

const testQueryClient = postgres(databaseUrl, { max: 1 });
export const testDb = drizzle(testQueryClient, { schema });

function postgresErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  while (current && typeof current === 'object') {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (typeof candidate.code === 'string') return candidate.code;
    current = candidate.cause;
  }
  return undefined;
}

/**
 * Cleans the database by TRUNCATING all tables.
 */
export async function cleanDatabase() {
  const tables = [
    'users',
    'accounts',
    'sessions',
    'projects',
    'project_members',
    'agent_config',
    'specifications',
    'spec_versions',
    'plans',
    'tasks',
    'agent_sessions',
    'audit_log',
    'plan_reviews',
    'plan_jobs',
    'agent_events',
    'agent_logs',
    'notifications',
    'invites',
    'task_attempts',
    'file_changes',
    'test_results',
    'webhook_deliveries',
    'webhooks',
    'usage_snapshots',
    'git_commits',
    'agent_tokens',
    'api_request_logs',
    'verifications',
  ];

  const query = `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`;

  let retries = 5;
  while (retries > 0) {
    try {
      await testDb.execute(sql.raw(query));
      break;
    } catch (error) {
      const code = postgresErrorCode(error);
      if (code === '40P01' || code === '55P03') {
        // Deadlock or lock_not_available
        retries--;
        if (retries === 0) throw error;
        const backoffMs = 100 * 2 ** (5 - retries) + Math.floor(Math.random() * 100);
        await new Promise((res) => setTimeout(res, backoffMs));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Helper to create a test user
 */
export async function createTestUser(
  id: string,
  email: string,
  role: 'owner' | 'admin' | 'member' | 'viewer' = 'member'
) {
  const [user] = await testDb
    .insert(schema.users)
    .values({
      id,
      name: email.split('@')[0],
      email,
      role,
      onboardingStep: 3,
    })
    .returning();
  return user;
}

/**
 * Helper to create a test project
 */
export async function createTestProject(name: string, ownerId: string) {
  const slug = `${name.toLowerCase().replace(/ /g, '-')}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const [project] = await testDb
    .insert(schema.projects)
    .values({
      name,
      slug,
      createdBy: ownerId,
      isDemo: true,
    })
    .returning();

  await testDb.insert(schema.projectMembers).values({
    projectId: project.id,
    userId: ownerId,
    role: 'owner',
  });

  await testDb.insert(schema.agentConfig).values({
    projectId: project.id,
  });

  return project;
}
