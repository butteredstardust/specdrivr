import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  users,
  projects,
  specifications,
  plans,
  tasks,
  agentSessions,
  specVersions,
  accounts,
  projectMembers,
  agentConfig,
  webhooks,
} from '../src/db/schema';
import { env } from '../src/lib/env-script';
import * as schema from '../src/db/schema';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { eq } from 'drizzle-orm';
import { logger } from '../src/lib/logger-cli';

const queryClient = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema });

const scryptParams = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

async function scryptHash(password: string): Promise<string> {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const salt = Buffer.from(saltBuf).toString('hex');
  const key = await scryptAsync(password.normalize('NFKC'), salt, {
    N: scryptParams.N,
    p: scryptParams.p,
    r: scryptParams.r,
    dkLen: scryptParams.dkLen,
    maxmem: 128 * scryptParams.N * scryptParams.r * 2,
  });
  return `${salt}:${Buffer.from(key).toString('hex')}`;
}

async function main() {
  logger.info('Starting database seed...');

  try {
    await db.transaction(async (tx) => {
      // 1. Users
      const passwordHash = await scryptHash('Password123!');

      const demoUsers = [
        {
          id: 'user_alex',
          name: 'Alex Rivera',
          email: 'alex@specdrivr.dev',
          role: 'owner' as const,
          onboardingStep: 3,
        },
        {
          id: 'user_sam',
          name: 'Sam Okafor',
          email: 'sam@specdrivr.dev',
          role: 'admin' as const,
          onboardingStep: 3,
        },
        {
          id: 'user_jordan',
          name: 'Jordan Chen',
          email: 'jordan@specdrivr.dev',
          role: 'member' as const,
          onboardingStep: 3,
        },
      ];

      for (const u of demoUsers) {
        await tx.insert(users).values(u).onConflictDoNothing();
        await tx
          .insert(accounts)
          .values({
            id: `acc_${u.id}`,
            accountId: u.id,
            providerId: 'credential',
            userId: u.id,
            password: passwordHash,
          })
          .onConflictDoNothing();
      }

      // 2. Projects
      const demoProjects = [
        {
          id: 1,
          name: 'Project Alpha',
          slug: 'project-alpha',
          createdBy: 'user_alex',
          isDemo: true,
        },
        { id: 2, name: 'Project Beta', slug: 'project-beta', createdBy: 'user_sam', isDemo: true },
      ];

      for (const p of demoProjects) {
        await tx.insert(projects).values(p).onConflictDoNothing();
        // Ensure agent config exists for projects
        await tx
          .insert(agentConfig)
          .values({
            projectId: p.id,
          })
          .onConflictDoNothing();
      }

      // 3. Project Members
      const members = [
        { projectId: 1, userId: 'user_alex', role: 'owner' as const },
        { projectId: 1, userId: 'user_sam', role: 'admin' as const },
        { projectId: 1, userId: 'user_jordan', role: 'member' as const },
        { projectId: 2, userId: 'user_sam', role: 'owner' as const },
        { projectId: 2, userId: 'user_jordan', role: 'admin' as const },
      ];

      for (const m of members) {
        await tx.insert(projectMembers).values(m).onConflictDoNothing();
      }

      // 4. Specifications
      const demoSpecs = [
        { id: 1, projectId: 1, name: 'Authentication System', status: 'pending_approval' as const },
        { id: 2, projectId: 1, name: 'Payment Integration', status: 'executing' as const },
        { id: 3, projectId: 1, name: 'Dashboard UI', status: 'drafting' as const },
        { id: 4, projectId: 2, name: 'API Gateway', status: 'pending_approval' as const },
        { id: 5, projectId: 2, name: 'Data Pipeline', status: 'drafting' as const },
        { id: 6, projectId: 2, name: 'Notification Service', status: 'drafting' as const },
      ];

      const specContents: Record<number, string> = {
        1: 'The authentication system must support OAuth2 and traditional email/password flows. Security is a top priority for this module. We need robust session management.',
        2: 'Integrating Stripe for all payment processing. This includes handling one-time payments and recurring subscriptions. Webhook security must be strictly enforced.',
        3: 'A modern, responsive dashboard providing high-level metrics at a glance. It should support both light and dark modes. Performance should be optimized for large datasets.',
        4: 'Centralized entry point for all API requests. It handles rate limiting, authentication, and request routing to microservices. High availability is mandatory.',
        5: 'Ingests raw data from multiple sources, cleans it, and stores it in the data warehouse. Scalability and data integrity are key requirements. Supports batch and stream processing.',
        6: 'Unified service for sending emails, SMS, and push notifications. It should handle delivery retries and provide detailed logging for audit purposes.',
      };

      for (const s of demoSpecs) {
        await tx.insert(specifications).values(s).onConflictDoNothing();

        // Spec Version 1
        const [v1] = await tx
          .insert(specVersions)
          .values({
            id: s.id, // using same ID for simplicity in seed
            specId: s.id,
            versionNumber: 1,
            markdownContent: specContents[s.id],
          })
          .onConflictDoNothing()
          .returning();

        if (v1) {
          await tx
            .update(specifications)
            .set({ currentVersionId: v1.id })
            .where(eq(specifications.id, s.id));
        }
      }

      const demoPlans = [
        { id: 1, specId: 1, status: 'pending_approval' as const, specVersionId: 1 },
        {
          id: 2,
          specId: 2,
          status: 'executing' as const,
          reviewerNotes: 'Approved by Alex',
          specVersionId: 2,
          approvedAt: new Date(),
        },
        {
          id: 3,
          specId: 3,
          status: 'abandoned' as const,
          reviewerNotes: 'Spec was revised',
          specVersionId: 3,
        },
        { id: 4, specId: 4, status: 'pending_approval' as const, specVersionId: 4 },
      ];

      for (const p of demoPlans) {
        await tx.insert(plans).values(p).onConflictDoNothing();
      }

      // 6. Agent Session
      const session = {
        id: 1,
        specId: 2,
        planId: 2,
        status: 'running' as const,
        projectId: 1,
        lastHeartbeatAt: new Date(),
        startedAt: new Date(),
      };
      await tx.insert(agentSessions).values(session).onConflictDoNothing();

      // 7. Tasks (Minimum 6 for plan_002 / spec_002)
      const demoTasks = [
        {
          id: 101,
          planId: 2,
          specId: 2,
          externalId: 'T-101',
          title: 'Setup payment provider SDK',
          status: 'done' as const,
          executionOrder: 1,
        },
        {
          id: 102,
          planId: 2,
          specId: 2,
          externalId: 'T-102',
          title: 'Implement checkout API',
          status: 'done' as const,
          executionOrder: 2,
          dependsOn: ['T-101'],
        },
        {
          id: 103,
          planId: 2,
          specId: 2,
          externalId: 'T-103',
          title: 'Add webhook handler',
          status: 'in_progress' as const,
          executionOrder: 3,
          dependsOn: ['T-102'],
        },
        {
          id: 104,
          planId: 2,
          specId: 2,
          externalId: 'T-104',
          title: 'Write payment tests',
          status: 'todo' as const,
          executionOrder: 4,
          dependsOn: ['T-103'],
        },
        {
          id: 105,
          planId: 2,
          specId: 2,
          externalId: 'T-105',
          title: 'Handle refund flow',
          status: 'blocked' as const,
          blockedReason:
            'Cannot proceed — refund policy not defined in spec. Requires product decision before implementation.',
          executionOrder: 5,
        },
        {
          id: 106,
          planId: 2,
          specId: 2,
          externalId: 'T-106',
          title: 'Update documentation',
          status: 'todo' as const,
          executionOrder: 6,
          dependsOn: ['T-104', 'T-105'],
        },
      ];

      for (const t of demoTasks) {
        await tx.insert(tasks).values(t).onConflictDoNothing();
      }

      // 8. Webhooks
      const demoWebhooks = [
        {
          id: 1,
          projectId: 1,
          url: 'https://webhook.site/demo-active',
          events: ['plan.approved', 'task.blocked'],
          isActive: true,
          status: 'active' as const,
        },
        {
          id: 2,
          projectId: 1,
          url: 'https://webhook.site/demo-error',
          events: ['*'],
          isActive: false,
          status: 'error' as const,
        },
      ];

      for (const w of demoWebhooks) {
        await tx.insert(webhooks).values(w).onConflictDoNothing();
      }

      logger.info(
        { users: 3, projects: 2, specs: 6, plans: 4, tasks: 6, sessions: 1, webhooks: 2 },
        'Seed complete'
      );
    });
  } catch (error) {
    logger.error(error, 'Seed failed');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
