import { describe, it, expect, beforeEach } from 'vitest';
import { cleanDatabase, testDb } from '../helpers';
import * as schema from '@/db/schema';
import { execSync } from 'child_process';
import { count, eq } from 'drizzle-orm';

describe('Seed Script Smoke Test', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  function runSeed() {
    execSync('pnpm db:seed', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  }

  it('populates the database with expected demo data', async () => {
    runSeed();

    // 3 users
    const [userCount] = await testDb.select({ value: count() }).from(schema.users);
    expect(userCount.value).toBe(3);

    // 2 projects
    const [projectCount] = await testDb.select({ value: count() }).from(schema.projects);
    expect(projectCount.value).toBe(2);

    // 6 specs
    const [specCount] = await testDb.select({ value: count() }).from(schema.specifications);
    expect(specCount.value).toBe(6);

    // 4 plans
    const [planCount] = await testDb.select({ value: count() }).from(schema.plans);
    expect(planCount.value).toBe(4);

    // spec_001 plan status is pending_approval
    const [spec1] = await testDb
      .select()
      .from(schema.specifications)
      .where(eq(schema.specifications.id, 1));
    const [plan1] = await testDb
      .select()
      .from(schema.plans)
      .where(eq(schema.plans.specId, spec1.id));
    expect(plan1.status).toBe('pending_approval');

    // task_105 status is blocked with non-empty blockedReason
    const [task105] = await testDb.select().from(schema.tasks).where(eq(schema.tasks.id, 105));
    expect(task105.status).toBe('blocked');
    expect(task105.blockedReason).toBeTruthy();

    // Exactly one session with status running
    const [runningSessions] = await testDb
      .select({ value: count() })
      .from(schema.agentSessions)
      .where(eq(schema.agentSessions.status, 'running'));
    expect(runningSessions.value).toBe(1);
  });

  it('is idempotent (running twice produces same counts)', async () => {
    runSeed();
    const counts1 = {
      users: (await testDb.select({ v: count() }).from(schema.users))[0].v,
      projects: (await testDb.select({ v: count() }).from(schema.projects))[0].v,
      specs: (await testDb.select({ v: count() }).from(schema.specifications))[0].v,
      plans: (await testDb.select({ v: count() }).from(schema.plans))[0].v,
    };

    runSeed();
    const counts2 = {
      users: (await testDb.select({ v: count() }).from(schema.users))[0].v,
      projects: (await testDb.select({ v: count() }).from(schema.projects))[0].v,
      specs: (await testDb.select({ v: count() }).from(schema.specifications))[0].v,
      plans: (await testDb.select({ v: count() }).from(schema.plans))[0].v,
    };

    expect(counts1).toEqual(counts2);
  });
});
