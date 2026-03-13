import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

// Directly read from process.env to avoid env-core.ts initialization issues during Vitest
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/specdrivr';

const testQueryClient = postgres(databaseUrl, { max: 1 });
export const testDb = drizzle(testQueryClient, { schema });

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
    'verifications'
  ];

  const query = `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`;
  await testDb.execute(sql.raw(query));
}

/**
 * Helper to create a test user
 */
export async function createTestUser(id: string, email: string, role: 'owner' | 'admin' | 'member' | 'viewer' = 'member') {
  const [user] = await testDb.insert(schema.users).values({
    id,
    name: email.split('@')[0],
    email,
    role,
    onboardingStep: 3,
  }).returning();
  return user;
}

/**
 * Helper to create a test project
 */
export async function createTestProject(name: string, ownerId: string) {
  const slug = `${name.toLowerCase().replace(/ /g, '-')}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const [project] = await testDb.insert(schema.projects).values({
    name,
    slug,
    createdBy: ownerId,
    isDemo: true,
  }).returning();

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