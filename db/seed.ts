import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  users,
  accounts,
  projects,
  projectMembers,
  invites,
  agentTokens,
  specifications,
  specVersions,
  plans,
  planReviews,
  tasks,
  taskAttempts,
  fileChanges,
  agentSessions,
  agentEvents,
  agentLogs,
  agentConfig,
  notifications,
  notificationPreferences,
  webhooks,
  webhookDeliveries,
  usageSnapshots,
  gitCommits,
  apiRequestLogs,
  auditLog,
  testResults,
} from '../src/db/schema';
import { env } from '../src/lib/env-script';
import * as schema from '../src/db/schema';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { eq, sql } from 'drizzle-orm';
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

/**
 * Reference date: whenever the seed runs. It used to be pinned to
 * 2026-03-15, which meant a demo database aged badly — every activity row
 * read "6 months ago" and the running sessions' `lastHeartbeatAt` was far
 * outside the 15-minute window `useSystemHealth` allows, so the agent health
 * dot was permanently red on an otherwise healthy demo.
 */
const SEED_NOW = new Date();

const daysAgo = (n: number): Date => {
  const d = new Date(SEED_NOW);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

const hoursAgo = (h: number): Date => {
  return new Date(SEED_NOW.getTime() - h * 60 * 60 * 1000);
};

async function resetSequences() {
  logger.info('Resetting sequences...');
  const tables = [
    'projects',
    'specifications',
    'spec_versions',
    'plans',
    'plan_reviews',
    'tasks',
    'task_attempts',
    'file_changes',
    'agent_sessions',
    'agent_events',
    'agent_logs',
    'notifications',
    'notification_preferences',
    'webhooks',
    'webhook_deliveries',
    'usage_snapshots',
    'git_commits',
    'api_request_logs',
    'audit_log',
    'test_results',
    'agent_tokens',
    'invites',
    'project_members',
    'agent_config',
  ];

  for (const table of tables) {
    try {
      await db.execute(
        sql.raw(
          `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM "${table}";`
        )
      );
    } catch {
      logger.debug({ table }, 'Skipped sequence reset for table (likely no serial id)');
    }
  }
}

async function main() {
  logger.info('Starting database seed...');

  try {
    // Truncate all relevant tables to ensure a clean start
    const tablesToReset = [
      'test_results',
      'audit_log',
      'api_request_logs',
      'git_commits',
      'usage_snapshots',
      'webhook_deliveries',
      'webhooks',
      'notification_preferences',
      'notifications',
      'agent_logs',
      'agent_events',
      'agent_sessions',
      'file_changes',
      'task_attempts',
      'tasks',
      'plan_reviews',
      'plans',
      'spec_versions',
      'specifications',
      'project_members',
      'agent_config',
      'invites',
      'projects',
      'accounts',
      'users',
    ];

    logger.info('Truncating existing data...');
    for (const table of tablesToReset) {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE;`));
    }

    await db.transaction(async (tx) => {
      // -------------------------------------------------------------------------
      // 1. Users + Accounts
      // -------------------------------------------------------------------------
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
            // better-auth resolves the credential account by issuer as well as
            // provider id; this is `createLocalAccountIssuer('credential')`.
            // Seeded users cannot sign in without it.
            issuer: 'local:credential',
            userId: u.id,
            password: passwordHash,
          })
          .onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 2. Projects (5 projects, distinct completion states)
      // -------------------------------------------------------------------------
      const demoProjects = [
        {
          id: 1,
          name: 'Blaze UI Redesign',
          slug: 'blaze-ui',
          description: 'Full component library redesign with dark mode system.',
          createdBy: 'user_alex',
          isDemo: true,
          createdAt: daysAgo(5),
        },
        {
          id: 2,
          name: 'Auth Service',
          slug: 'auth-service',
          description: 'OAuth2 integration and session management overhaul.',
          createdBy: 'user_sam',
          isDemo: true,
          createdAt: daysAgo(5),
        },
        {
          id: 3,
          name: 'Payments v2',
          slug: 'payments-v2',
          description: 'Stripe checkout flow and subscription billing.',
          createdBy: 'user_alex',
          isDemo: true,
          createdAt: daysAgo(4),
        },
        {
          id: 4,
          name: 'Data Pipeline',
          slug: 'data-pipeline',
          description: 'Batch processor and stream ingestion infrastructure.',
          createdBy: 'user_jordan',
          isDemo: true,
          createdAt: daysAgo(4),
        },
        {
          id: 5,
          name: 'API Gateway',
          slug: 'api-gateway',
          description: 'Centralized routing layer with rate limiting.',
          createdBy: 'user_alex',
          isDemo: true,
          createdAt: daysAgo(1),
        },
      ];

      for (const p of demoProjects) {
        await tx.insert(projects).values(p).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 3. Agent Config (one per project, with per-project variations)
      // -------------------------------------------------------------------------
      await tx
        .insert(agentConfig)
        .values({
          projectId: 1,
          testCommand: 'pnpm test',
          lintCommand: 'pnpm lint',
        })
        .onConflictDoNothing();

      await tx
        .insert(agentConfig)
        .values({
          projectId: 2,
          requireApproval: true,
          maxConcurrentTasks: 2,
        })
        .onConflictDoNothing();

      await tx
        .insert(agentConfig)
        .values({
          projectId: 3,
          autoGeneratePlan: false,
        })
        .onConflictDoNothing();

      await tx
        .insert(agentConfig)
        .values({
          projectId: 4,
          maxRetriesPerTask: 3,
          taskTimeoutSeconds: 600,
        })
        .onConflictDoNothing();

      await tx.insert(agentConfig).values({ projectId: 5 }).onConflictDoNothing();

      // Ensure all demo users are members of ALL projects
      const allProjectIds = demoProjects.map((p) => p.id);
      const allUserIds = demoUsers.map((u) => u.id);

      for (const projectId of allProjectIds) {
        for (const userId of allUserIds) {
          const isOwner =
            (projectId === 1 && userId === 'user_alex') ||
            (projectId === 2 && userId === 'user_sam') ||
            (projectId === 4 && userId === 'user_jordan');

          await tx
            .insert(projectMembers)
            .values({
              projectId,
              userId,
              role: isOwner ? 'owner' : userId === 'user_jordan' ? 'member' : 'admin',
              joinedAt: daysAgo(5),
            })
            .onConflictDoNothing();
        }
      }

      // -------------------------------------------------------------------------
      // 5. Invites (2 pending)
      // -------------------------------------------------------------------------
      await tx
        .insert(invites)
        .values({
          id: 1,
          projectId: 3,
          email: 'riley@example.com',
          role: 'member' as const,
          token: 'invite_token_riley_p3_seed',
          invitedBy: 'user_alex',
          expiresAt: daysAgo(-7),
          createdAt: daysAgo(1),
        })
        .onConflictDoNothing();

      await tx
        .insert(invites)
        .values({
          id: 2,
          projectId: 5,
          email: 'morgan@example.com',
          role: 'admin' as const,
          token: 'invite_token_morgan_p5_seed',
          invitedBy: 'user_alex',
          expiresAt: daysAgo(-7),
          createdAt: daysAgo(0),
        })
        .onConflictDoNothing();

      // -------------------------------------------------------------------------
      // 6. Agent Tokens
      // -------------------------------------------------------------------------
      await tx
        .insert(agentTokens)
        .values({
          id: 1,
          userId: 'user_alex',
          projectId: 2,
          name: 'CI Runner',
          tokenHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          prefix: 'spd_ci_',
          createdAt: daysAgo(4),
        })
        .onConflictDoNothing();

      await tx
        .insert(agentTokens)
        .values({
          id: 2,
          userId: 'user_jordan',
          projectId: 4,
          name: 'Pipeline Bot',
          tokenHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
          prefix: 'spd_pp_',
          createdAt: daysAgo(4),
        })
        .onConflictDoNothing();

      // -------------------------------------------------------------------------
      // 7. Specifications (insert without currentVersionId first)
      // -------------------------------------------------------------------------
      const demoSpecs = [
        // P1: Blaze UI — all completed
        {
          id: 1,
          projectId: 1,
          name: 'Component Library Refactor',
          status: 'completed' as const,
          createdBy: 'user_alex',
          createdAt: daysAgo(5),
        },
        {
          id: 2,
          projectId: 1,
          name: 'Dark Mode System',
          status: 'completed' as const,
          createdBy: 'user_alex',
          createdAt: daysAgo(5),
        },
        // P2: Auth Service — one executing, one drafting
        {
          id: 3,
          projectId: 2,
          name: 'OAuth2 Integration',
          status: 'executing' as const,
          createdBy: 'user_sam',
          createdAt: daysAgo(5),
        },
        {
          id: 4,
          projectId: 2,
          name: 'Session Management',
          status: 'drafting' as const,
          createdBy: 'user_sam',
          createdAt: daysAgo(3),
        },
        // P3: Payments v2 — pending_approval + drafting
        {
          id: 5,
          projectId: 3,
          name: 'Stripe Checkout Flow',
          status: 'pending_approval' as const,
          createdBy: 'user_alex',
          createdAt: daysAgo(4),
        },
        {
          id: 6,
          projectId: 3,
          name: 'Subscription Billing',
          status: 'drafting' as const,
          createdBy: 'user_alex',
          createdAt: daysAgo(1),
        },
        // P4: Data Pipeline — stalled + drafting
        {
          id: 7,
          projectId: 4,
          name: 'Batch Processor',
          status: 'stalled' as const,
          createdBy: 'user_jordan',
          createdAt: daysAgo(4),
        },
        {
          id: 8,
          projectId: 4,
          name: 'Stream Ingestion',
          status: 'drafting' as const,
          createdBy: 'user_jordan',
          createdAt: daysAgo(2),
        },
        // P5: API Gateway — drafting + pending_plan
        {
          id: 9,
          projectId: 5,
          name: 'Gateway Routing Layer',
          status: 'drafting' as const,
          createdBy: 'user_alex',
          createdAt: daysAgo(1),
        },
        {
          id: 10,
          projectId: 5,
          name: 'Rate Limiting Module',
          status: 'pending_plan' as const,
          createdBy: 'user_alex',
          createdAt: daysAgo(0),
        },
      ];

      for (const s of demoSpecs) {
        await tx.insert(specifications).values(s).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 8. Spec Versions
      //    IDs 1-11 mapped to specs 1-10 (spec 1 has two versions: v1=id1, v2=id2)
      // -------------------------------------------------------------------------
      const specVersionsData = [
        {
          id: 1,
          specId: 1,
          versionNumber: 1,
          markdownContent:
            '# Component Library Refactor\n\nInitial draft. Audit all existing components and extract design tokens. Build new Button and Form component variants, write Storybook stories, and update documentation.',
          createdBy: 'user_alex',
          createdAt: daysAgo(5),
        },
        {
          id: 2,
          specId: 1,
          versionNumber: 2,
          markdownContent:
            '# Component Library Refactor (v2)\n\nUpdated after review feedback. Audit all existing components and extract design tokens. Build new Button and Form component variants with accessibility improvements, write Storybook stories with interaction tests, and update documentation with migration guide.',
          createdBy: 'user_alex',
          createdAt: daysAgo(4),
        },
        {
          id: 3,
          specId: 2,
          versionNumber: 1,
          markdownContent:
            '# Dark Mode System\n\nCreate a CSS variable system for theming. Implement a ThemeProvider component, apply dark tokens across all layouts, and test across major browsers.',
          createdBy: 'user_alex',
          createdAt: daysAgo(4),
        },
        {
          id: 4,
          specId: 3,
          versionNumber: 1,
          markdownContent:
            '# OAuth2 Integration (In Progress)\n\n## Architecture Overview\nImplement OAuth 2.0 with Authorization Code Flow for secure third-party authentication. Support Google, GitHub, and Microsoft as initial providers. Implement proper token management with secure storage in HTTP-only cookies and Redis caching layer for session state. Establish clear security boundaries and error handling protocols.\n\n## Provider Configuration\nConfigure each OAuth provider: client_id, client_secret, redirect_uri management. Implement dynamic provider discovery for future extensibility. Set up secure credential rotation strategies. Define scopes for user data access: email, profile, openid. Handle provider-specific quirks and response formats.\n\n## Token Management\nImplement access token caching with TTL-based expiration. Design refresh token rotation strategy with security considerations. Store tokens in Redis with encrypted values. Implement automatic token refresh before expiration with retry logic for edge cases. Handle token revocation on logout.\n\n## Integration Points\nBuild OAuth callback handler route for post-authentication token exchange. Implement user creation/lookup logic based on provider claims. Establish user profile synchronization strategy. Set up session initialization after successful authentication. Define rollback procedures for failed authentications.\n\n## Security & Testing\nImplement PKCE (Proof Key for Code Exchange) for mobile clients. Add CSRF protection on callback routes. Write comprehensive integration tests for each provider. Perform security audit of token storage mechanisms. Load test authentication flows under peak conditions.',
          createdBy: 'user_sam',
          createdAt: daysAgo(5),
        },
        {
          id: 5,
          specId: 4,
          versionNumber: 1,
          markdownContent:
            '# Session Management\n\nDesign and implement a robust session lifecycle with sliding expiry, device tracking, and forced logout capabilities.',
          createdBy: 'user_sam',
          createdAt: daysAgo(3),
        },
        {
          id: 6,
          specId: 5,
          versionNumber: 1,
          markdownContent:
            '# Stripe Checkout Flow\n\nIntegrate Stripe Elements for secure card collection. Implement order creation, payment confirmation, and webhook handling for async events.',
          createdBy: 'user_alex',
          createdAt: daysAgo(4),
        },
        {
          id: 7,
          specId: 6,
          versionNumber: 1,
          markdownContent:
            '# Subscription Billing\n\nImplement recurring billing using Stripe Subscriptions. Handle plan upgrades, downgrades, cancellations, and invoice webhooks.',
          createdBy: 'user_alex',
          createdAt: daysAgo(1),
        },
        {
          id: 8,
          specId: 7,
          versionNumber: 1,
          markdownContent:
            '# Batch Processor\n\nBuild a job queue with worker logic, retry mechanism, and monitoring hooks. Load test to validate throughput requirements.',
          createdBy: 'user_jordan',
          createdAt: daysAgo(4),
        },
        {
          id: 9,
          specId: 8,
          versionNumber: 1,
          markdownContent:
            '# Stream Ingestion\n\nReal-time event stream ingestion using Kafka. Handle back-pressure, dead-letter queues, and schema evolution.',
          createdBy: 'user_jordan',
          createdAt: daysAgo(2),
        },
        {
          id: 10,
          specId: 9,
          versionNumber: 1,
          markdownContent:
            '# Gateway Routing Layer\n\nCentralized reverse proxy with path-based routing, header injection, and upstream health checks.',
          createdBy: 'user_alex',
          createdAt: daysAgo(1),
        },
        {
          id: 11,
          specId: 10,
          versionNumber: 1,
          markdownContent:
            '# Rate Limiting Module\n\nToken bucket rate limiting per API key and IP. Redis-backed counters with configurable limits and burst allowance.',
          createdBy: 'user_alex',
          createdAt: daysAgo(0),
        },
      ];

      for (const sv of specVersionsData) {
        await tx.insert(specVersions).values(sv).onConflictDoNothing();
      }

      // Update currentVersionId on each spec
      // spec 1 → v2 (id=2), all others → their single v1
      const specCurrentVersionMap: Record<number, number> = {
        1: 2,
        2: 3,
        3: 4,
        4: 5,
        5: 6,
        6: 7,
        7: 8,
        8: 9,
        9: 10,
        10: 11,
      };

      for (const [specId, versionId] of Object.entries(specCurrentVersionMap)) {
        await tx
          .update(specifications)
          .set({ currentVersionId: versionId })
          .where(eq(specifications.id, Number(specId)));
      }

      // -------------------------------------------------------------------------
      // 9. Plans
      // -------------------------------------------------------------------------
      const demoPlans = [
        {
          id: 1,
          specId: 1,
          specVersionId: 2, // v2 of Component Library
          status: 'completed' as const,
          markdownContent:
            '## Plan: Component Library Refactor\n\n1. Audit existing components\n2. Extract design tokens\n3. Build Button variants\n4. Build Form components\n5. Write Storybook stories\n6. Update documentation',
          approvedAt: daysAgo(3),
          approvedBy: 'user_sam',
          taskCount: 6,
          totalEstimatedMinutes: 240,
          createdBy: 'user_alex',
          createdAt: daysAgo(4),
        },
        {
          id: 2,
          specId: 2,
          specVersionId: 3, // v1 of Dark Mode
          status: 'completed' as const,
          markdownContent:
            '## Plan: Dark Mode System\n\n1. Create CSS variable system\n2. Implement ThemeProvider\n3. Apply dark tokens to layouts\n4. Test across browsers',
          approvedAt: daysAgo(3),
          approvedBy: 'user_sam',
          taskCount: 4,
          totalEstimatedMinutes: 160,
          createdBy: 'user_alex',
          createdAt: daysAgo(4),
        },
        {
          id: 3,
          specId: 3,
          specVersionId: 4, // v1 of OAuth2
          status: 'executing' as const,
          markdownContent:
            '# Plan: OAuth2 Integration for Auth Service\n\n## Breakdown of Work\n\n### Phase 1: Provider Setup (Estimated: 8 hours)\n- Configure Google OAuth application in Google Cloud Console\n- Set up GitHub OAuth application in developer settings\n- Configure Microsoft Azure AD application registration\n- Create secure credential storage for client secrets\n- Implement environment variable management for multi-environment support\n- Write provider configuration abstraction layer\n\n### Phase 2: Core OAuth Flow (Estimated: 16 hours)\n- Implement Authorization Code Flow with PKCE support\n- Build OAuth callback handler route with secure state validation\n- Implement token exchange logic from authorization code\n- Create access/refresh token storage strategy in Redis\n- Build user session initialization after token acquisition\n- Implement logout and token revocation flows\n\n### Phase 3: User Integration (Estimated: 12 hours)\n- Implement user creation from provider claims (sub, email, name)\n- Build user lookup by provider ID and email\n- Create user profile synchronization from provider data\n- Implement link/unlink accounts functionality\n- Handle edge case: existing user email from different provider\n- Build test user data fixtures for each provider\n\n### Phase 4: Security Hardening (Estimated: 10 hours)\n- Implement CSRF token validation on callback routes\n- Set up HTTP-only cookie configuration for token storage\n- Implement rate limiting on auth endpoints\n- Add security headers (CSP, X-Frame-Options, etc.)\n- Perform OWASP Top 10 security review\n- Document security architecture and threat model\n\n### Phase 5: Testing & Documentation (Estimated: 10 hours)\n- Write integration tests for each OAuth provider\n- Create end-to-end test flows for success and failure paths\n- Document provider-specific setup instructions\n- Create troubleshooting guide for common OAuth issues\n- Write API documentation for auth endpoints\n- Perform load testing on authentication endpoints\n\n## Risk Mitigation\n- Provider API changes: Implement adapter pattern for provider-specific logic\n- Token expiration: Implement automatic refresh with user notification\n- Third-party outages: Design fallback authentication mechanisms\n- Security vulnerabilities: Subscribe to OAuth/OIDC security bulletins',
          approvedAt: daysAgo(3),
          approvedBy: 'user_alex',
          taskCount: 5,
          totalEstimatedMinutes: 200,
          createdBy: 'user_sam',
          createdAt: daysAgo(4),
        },
        {
          id: 4,
          specId: 4,
          specVersionId: 5, // v1 of Session Management
          status: 'pending_approval' as const,
          markdownContent:
            '# Plan: Session Management Implementation\n\n## Breakdown of Work\n\n### Phase 1: Session Schema & Storage (Estimated: 6 hours)\n- Design session table schema with TTL and device tracking\n- Implement Redis cache layer for active sessions\n- Create session lifecycle state machine\n- Build session lookup and validation logic\n- Implement session cleanup for expired records\n- Set up session activity audit logging\n\n### Phase 2: Session Lifecycle (Estimated: 8 hours)\n- Implement session creation on login with device fingerprinting\n- Build session refresh logic with sliding expiry window\n- Implement session invalidation on logout\n- Create forced logout (admin-triggered) capability\n- Build session lock/unlock for 2FA flows\n- Implement multi-device session management\n\n### Phase 3: Device & Security Tracking (Estimated: 7 hours)\n- Implement device identification and tracking\n- Build suspicious activity detection (IP change, user agent mismatch)\n- Create session suspension workflow\n- Implement concurrent session limits per user\n- Build session conflict resolution\n- Add geolocation-based session validation\n\n### Phase 4: Admin & Monitoring Tools (Estimated: 5 hours)\n- Build admin session dashboard (active sessions per user)\n- Implement bulk session termination\n- Create session audit trail view\n- Build session anomaly alerts\n- Implement rate limiting on session creation\n- Add monitoring/alerting for high-risk activities\n\n### Phase 5: Testing & Documentation (Estimated: 6 hours)\n- Write integration tests for session lifecycle\n- Create load tests for concurrent session handling\n- Test session expiry and cleanup edge cases\n- Build end-to-end test flows for multi-device scenarios\n- Write API documentation for session endpoints\n- Document security considerations and threat model\n\n## Risk Mitigation\n- Session fixation attacks: Use cryptographically secure random tokens with rotation\n- Concurrent session abuse: Implement device fingerprinting and geo-location validation\n- Session storage failure: Redis cluster with failover and database fallback\n- Expired session cleanup: Implement async cleanup jobs with monitoring',
          taskCount: 0,
          totalEstimatedMinutes: 200,
          createdBy: 'user_sam',
          createdAt: daysAgo(2),
        },
        {
          id: 5,
          specId: 5,
          specVersionId: 6, // v1 of Stripe Checkout
          status: 'pending_approval' as const,
          markdownContent:
            '## Plan: Stripe Checkout Flow\n\n1. Setup Stripe SDK\n2. Implement checkout session API\n3. Add webhook endpoint\n4. Handle payment confirmation\n5. Write E2E tests',
          taskCount: 0,
          totalEstimatedMinutes: 180,
          createdBy: 'user_alex',
          createdAt: daysAgo(1),
        },
        {
          id: 6,
          specId: 7,
          specVersionId: 8, // v1 of Batch Processor
          status: 'executing' as const,
          markdownContent:
            '## Plan: Batch Processor\n\n1. Setup job queue\n2. Implement worker logic\n3. Add retry mechanism\n4. Add monitoring hooks\n5. Write load tests',
          approvedAt: daysAgo(3),
          approvedBy: 'user_alex',
          taskCount: 5,
          totalEstimatedMinutes: 220,
          createdBy: 'user_jordan',
          createdAt: daysAgo(4),
        },
        {
          id: 7,
          specId: 1,
          specVersionId: 1, // v1 of Component Library (old plan, replaced)
          status: 'abandoned' as const,
          reviewerNotes: 'Abandoned — spec updated to v2, new plan generated.',
          taskCount: 0,
          createdBy: 'user_alex',
          createdAt: daysAgo(5),
        },
      ];

      for (const p of demoPlans) {
        await tx.insert(plans).values(p).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 10. Plan Reviews
      // -------------------------------------------------------------------------
      const planReviewsData = [
        // Plan 1: approved by Sam (day -3)
        {
          planId: 1,
          userId: 'user_sam',
          action: 'approved',
          notes: 'LGTM — the v2 spec is much cleaner. Ship it.',
          createdAt: daysAgo(3),
        },
        // Plan 2: approved by Sam (day -3)
        {
          planId: 2,
          userId: 'user_sam',
          action: 'approved',
          notes: 'Good plan. Go ahead.',
          createdAt: daysAgo(3),
        },
        // Plan 3: changes_requested by Sam (day -4), then approved by Alex (day -3)
        {
          planId: 3,
          userId: 'user_sam',
          action: 'changes_requested',
          notes: 'Please add token rotation step and more thorough integration tests.',
          createdAt: daysAgo(4),
        },
        {
          planId: 3,
          userId: 'user_alex',
          action: 'approved',
          notes: 'Updated plan looks good. Approved.',
          createdAt: daysAgo(3),
        },
        // Plan 6: approved by Alex (day -3)
        {
          planId: 6,
          userId: 'user_alex',
          action: 'approved',
          notes: 'Solid plan. Watch the OOM risk on the worker.',
          createdAt: daysAgo(3),
        },
        // Plan 7: abandoned by Sam (day -4)
        {
          planId: 7,
          userId: 'user_sam',
          action: 'abandoned',
          notes: 'Abandoning — spec was revised to v2. Use the new plan.',
          createdAt: daysAgo(4),
        },
      ];

      for (const r of planReviewsData) {
        await tx.insert(planReviews).values(r).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 11. Tasks
      // -------------------------------------------------------------------------
      const demoTasks = [
        // Plan 1 — Component Library (all done)
        {
          id: 101,
          planId: 1,
          specId: 1,
          externalId: 'T-101',
          title: 'Audit existing components',
          description:
            'Review all existing UI components across the codebase. Document their current state, usage patterns, and potential for consolidation.',
          status: 'done' as const,
          executionOrder: 1,
          startedAt: daysAgo(3),
          completedAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        },
        {
          id: 102,
          planId: 1,
          specId: 1,
          externalId: 'T-102',
          title: 'Extract design tokens',
          description:
            'Extract color, spacing, typography, and sizing tokens from the design system. Create a comprehensive token list in JSON format for use across components.',
          status: 'done' as const,
          executionOrder: 2,
          dependsOn: ['T-101'],
          startedAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
          completedAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
        },
        {
          id: 103,
          planId: 1,
          specId: 1,
          externalId: 'T-103',
          title: 'Build Button variants',
          description:
            'Create Button component with variants for primary, secondary, danger, and ghost. Include support for sizes (sm, md, lg) and loading states.',
          status: 'done' as const,
          executionOrder: 3,
          dependsOn: ['T-102'],
          startedAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 2 * 3600 * 1000),
        },
        {
          id: 104,
          planId: 1,
          specId: 1,
          externalId: 'T-104',
          title: 'Build Form components',
          status: 'done' as const,
          executionOrder: 4,
          dependsOn: ['T-102'],
          startedAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
        },
        {
          id: 105,
          planId: 1,
          specId: 1,
          externalId: 'T-105',
          title: 'Write Storybook stories',
          status: 'done' as const,
          executionOrder: 5,
          dependsOn: ['T-103', 'T-104'],
          startedAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 7 * 3600 * 1000),
        },
        {
          id: 106,
          planId: 1,
          specId: 1,
          externalId: 'T-106',
          title: 'Update documentation',
          status: 'done' as const,
          executionOrder: 6,
          dependsOn: ['T-105'],
          startedAt: new Date(daysAgo(2).getTime() + 7 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 9 * 3600 * 1000),
        },

        // Plan 2 — Dark Mode (all done)
        {
          id: 201,
          planId: 2,
          specId: 2,
          externalId: 'T-201',
          title: 'Create CSS variable system',
          description:
            'Set up CSS custom properties for colors, spacing, typography, shadows, and transitions. Update globals.css with theme variables that support light and dark modes.',
          status: 'done' as const,
          executionOrder: 1,
          startedAt: daysAgo(3),
          completedAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
        },
        {
          id: 202,
          planId: 2,
          specId: 2,
          externalId: 'T-202',
          title: 'Implement ThemeProvider',
          status: 'done' as const,
          executionOrder: 2,
          dependsOn: ['T-201'],
          startedAt: new Date(daysAgo(2).getTime() + 1 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
        },
        {
          id: 203,
          planId: 2,
          specId: 2,
          externalId: 'T-203',
          title: 'Apply dark tokens to layouts',
          status: 'done' as const,
          executionOrder: 3,
          dependsOn: ['T-202'],
          startedAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 8 * 3600 * 1000),
        },
        {
          id: 204,
          planId: 2,
          specId: 2,
          externalId: 'T-204',
          title: 'Test across browsers',
          status: 'done' as const,
          executionOrder: 4,
          dependsOn: ['T-203'],
          startedAt: new Date(daysAgo(1).getTime() + 1 * 3600 * 1000),
          completedAt: new Date(daysAgo(1).getTime() + 4 * 3600 * 1000),
        },

        // Plan 3 — OAuth2 (in-progress)
        {
          id: 301,
          planId: 3,
          specId: 3,
          externalId: 'T-301',
          title: 'Configure OAuth2 provider',
          description:
            'Set up OAuth 2.0 provider configuration for Google and GitHub. Create OAuth applications in provider consoles and store client credentials securely in environment variables.',
          status: 'done' as const,
          executionOrder: 1,
          startedAt: daysAgo(3),
          completedAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
          currentAttemptId: 1,
        },
        {
          id: 302,
          planId: 3,
          specId: 3,
          externalId: 'T-302',
          title: 'Implement callback handler',
          status: 'done' as const,
          executionOrder: 2,
          dependsOn: ['T-301'],
          startedAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
          completedAt: new Date(daysAgo(3).getTime() + 6 * 3600 * 1000),
        },
        {
          id: 303,
          planId: 3,
          specId: 3,
          externalId: 'T-303',
          title: 'Store OAuth tokens securely',
          status: 'in_progress' as const,
          executionOrder: 3,
          dependsOn: ['T-302'],
          startedAt: hoursAgo(2),
          currentAttemptId: 2,
        },
        {
          id: 304,
          planId: 3,
          specId: 3,
          externalId: 'T-304',
          title: 'Add refresh token rotation',
          status: 'blocked' as const,
          executionOrder: 4,
          dependsOn: ['T-303'],
          blockedReason: 'Waiting for T-303 (token storage) to complete first',
        },
        {
          id: 305,
          planId: 3,
          specId: 3,
          externalId: 'T-305',
          title: 'Write integration tests',
          status: 'todo' as const,
          executionOrder: 5,
          dependsOn: ['T-304'],
        },

        // Plan 5 — Batch Processor (stalled/failed)
        {
          id: 501,
          planId: 5,
          specId: 7,
          externalId: 'T-501',
          title: 'Setup job queue',
          status: 'done' as const,
          executionOrder: 1,
          startedAt: daysAgo(3),
          completedAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        },
        {
          id: 502,
          planId: 5,
          specId: 7,
          externalId: 'T-502',
          title: 'Implement worker logic',
          status: 'done' as const,
          executionOrder: 2,
          dependsOn: ['T-501'],
          startedAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
          completedAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
        },
        {
          id: 503,
          planId: 5,
          specId: 7,
          externalId: 'T-503',
          title: 'Add retry mechanism',
          status: 'failed' as const,
          executionOrder: 3,
          dependsOn: ['T-502'],
          startedAt: new Date(daysAgo(2).getTime() + 1 * 3600 * 1000),
          completedAt: new Date(daysAgo(2).getTime() + 3 * 3600 * 1000),
          currentAttemptId: 4,
          attemptCount: 2,
        },
        {
          id: 504,
          planId: 5,
          specId: 7,
          externalId: 'T-504',
          title: 'Add monitoring hooks',
          status: 'blocked' as const,
          executionOrder: 4,
          blockedReason:
            'Blocked pending T-503 failure resolution — need to decide on retry strategy before instrumentation.',
        },
        {
          id: 505,
          planId: 5,
          specId: 7,
          externalId: 'T-505',
          title: 'Write load tests',
          status: 'todo' as const,
          executionOrder: 5,
          dependsOn: ['T-503'],
        },
      ];

      for (const t of demoTasks) {
        await tx.insert(tasks).values(t).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 12. Task Attempts
      // -------------------------------------------------------------------------
      const taskAttemptsData = [
        // T-102: 1 succeeded attempt (id=1)
        {
          id: 1,
          taskId: 102,
          seq: 1,
          status: 'succeeded' as const,
          startedAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
          endedAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
          exitCode: 0,
          workingDirectory: '/workspace/blaze-ui',
        },
        // T-301: 1 succeeded attempt (id=5)
        {
          id: 5,
          taskId: 301,
          seq: 1,
          status: 'succeeded' as const,
          startedAt: new Date(daysAgo(3).getTime() + 0 * 3600 * 1000),
          endedAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
          exitCode: 0,
          workingDirectory: '/workspace/auth-service',
          logLines: [
            '[2026-03-12T18:45:00Z] Starting OAuth provider configuration task',
            '[2026-03-12T18:45:15Z] Checking Google Cloud project setup...',
            '[2026-03-12T18:45:32Z] ✓ Google OAuth application created',
            '[2026-03-12T18:46:01Z] Client ID: 123456789-abcdefghijk.apps.googleusercontent.com',
            '[2026-03-12T18:46:15Z] Client Secret: gocspx-xxxxxxxxxxxxxxxxxxxxx',
            '[2026-03-12T18:46:45Z] Checking GitHub OAuth app setup...',
            '[2026-03-12T18:47:02Z] ✓ GitHub OAuth application created',
            '[2026-03-12T18:47:18Z] Client ID: Iv1.xxxxxxxxxxxxxxxx',
            '[2026-03-12T18:47:35Z] Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            '[2026-03-12T18:48:01Z] Writing credentials to .env file...',
            '[2026-03-12T18:48:15Z] ✓ Environment variables configured',
            '[2026-03-12T18:48:32Z] Validating OAuth provider connections...',
            '[2026-03-12T18:49:01Z] ✓ Google provider validated',
            '[2026-03-12T18:49:15Z] ✓ GitHub provider validated',
            '[2026-03-12T18:49:45Z] Task completed successfully in 3 hours',
          ],
          agentVersion: 'specdrivr-agent/1.3.0',
          promptTokensUsed: 2845,
          completionTokensUsed: 1203,
        },
        // T-303: 1 running attempt (id=2)
        {
          id: 2,
          taskId: 303,
          seq: 1,
          status: 'running' as const,
          startedAt: hoursAgo(2),
          workingDirectory: '/workspace/auth-service',
        },
        // T-503: 2 failed attempts (id=3, id=4)
        {
          id: 3,
          taskId: 503,
          seq: 1,
          status: 'failed' as const,
          startedAt: new Date(daysAgo(2).getTime() + 1 * 3600 * 1000),
          endedAt: new Date(daysAgo(2).getTime() + 2 * 3600 * 1000),
          exitCode: 1,
          workingDirectory: '/workspace/data-pipeline',
          errorMessage: 'Process killed — exceeded memory limit',
        },
        {
          id: 4,
          taskId: 503,
          seq: 2,
          status: 'failed' as const,
          startedAt: new Date(daysAgo(2).getTime() + 2 * 3600 * 1000),
          endedAt: new Date(daysAgo(2).getTime() + 3 * 3600 * 1000),
          exitCode: 137,
          workingDirectory: '/workspace/data-pipeline',
          errorMessage:
            'Worker process OOM killed (exit code 137) on retry attempt 2. Memory ceiling 512MB exceeded during retry loop initialization.',
        },
      ];

      for (const a of taskAttemptsData) {
        await tx.insert(taskAttempts).values(a).onConflictDoNothing();
      }

      // Update T-102 currentAttemptId now that attempt exists
      await tx.update(tasks).set({ currentAttemptId: 1 }).where(eq(tasks.id, 102));

      // -------------------------------------------------------------------------
      // 13. File Changes
      // -------------------------------------------------------------------------
      const fileChangesData = [
        // T-101: audit pass
        {
          taskId: 101,
          filePath: 'src/components/index.ts',
          changeType: 'modified',
          language: 'typescript',
          linesAdded: 42,
          linesRemoved: 8,
          diff: `diff --git a/src/components/index.ts b/src/components/index.ts
index 8234fed..9234fed 100644
--- a/src/components/index.ts
+++ b/src/components/index.ts
@@ -1,8 +1,42 @@
-export * from './button';
-export * from './input';
-export * from './card';
export { Button } from './ui/button';
export { Input } from './ui/input';
export { Card, CardHeader, CardTitle, CardContent } from './ui/card';
export { Badge } from './ui/badge';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
export { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

// New speculative components
export * from './agent/daemon-status';
export * from './agent/task-inspector';
export * from './audit/audit-list';
export * from './audit/audit-detail-view';`,
        },
        {
          taskId: 101,
          filePath: 'src/components/audit-report.md',
          changeType: 'created',
          language: 'markdown',
          linesAdded: 127,
          linesRemoved: 0,
          diff: `diff --git a/src/components/audit-report.md b/src/components/audit-report.md
new file mode 100644
index 0000000..8877665
--- /dev/null
+++ b/src/components/audit-report.md
@@ -0,0 +1,127 @@
# Specdrivr Audit Report

## Overview
This report details the findings of the architectural audit.

### Key Findings
1. **Modular Enforcement**: Standardized component paths.
2. **Type Safety**: Enforced Zod schemas at boundaries.
3. **Security**: Mandatory auth checks.`,
        },
        // T-201: CSS tokens
        {
          taskId: 201,
          filePath: 'src/styles/tokens.css',
          changeType: 'created',
          language: 'css',
          linesAdded: 89,
          linesRemoved: 0,
          diff: `diff --git a/src/styles/tokens.css b/src/styles/tokens.css
new file mode 100644
index 0000000..aabbcc1
--- /dev/null
+++ b/src/styles/tokens.css
@@ -0,0 +1,89 @@
:root {
  --bg-base: 0 0% 100%;
  --bg-elevated: 0 0% 98%;
  --text-primary: 0 0% 9%;
  --accent-violet: 262 83% 58%;
}

.dark {
  --bg-base: 240 10% 4%;
  --bg-elevated: 240 10% 6%;
  --text-primary: 0 0% 98%;
}`,
        },
        {
          taskId: 201,
          filePath: 'tailwind.config.ts',
          changeType: 'modified',
          language: 'typescript',
          linesAdded: 34,
          linesRemoved: 12,
          diff: `diff --git a/tailwind.config.ts b/tailwind.config.ts
index 5566778..6677889 100644
--- a/tailwind.config.ts
+++ b/tailwind.config.ts
@@ -12,4 +12,34 @@
     extend: {
       colors: {
         base: 'hsl(var(--bg-base))',
        elevated: 'hsl(var(--bg-elevated))',
        violet: 'hsl(var(--accent-violet))',
       }
     }
   }
 }`,
        },
        // T-301: OAuth provider configuration
        {
          taskId: 301,
          attemptId: 5,
          filePath: 'src/lib/oauth-config.ts',
          changeType: 'created',
          language: 'typescript',
          linesAdded: 89,
          linesRemoved: 0,
          diff: `diff --git a/src/lib/oauth-config.ts b/src/lib/oauth-config.ts
new file mode 100644
index 0000000..9988776
--- /dev/null
+++ b/src/lib/oauth-config.ts
@@ -0,0 +1,89 @@
export const oauthConfig = {
  providers: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  }
};`,
        },
        {
          taskId: 301,
          attemptId: 5,
          filePath: '.env.example',
          changeType: 'modified',
          language: 'text',
          linesAdded: 5,
          linesRemoved: 0,
          diff: `diff --git a/.env.example b/.env.example
index 1122334..2233445 100644
--- a/.env.example
+++ b/.env.example
@@ -5,3 +5,8 @@
 NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret`,
        },
        // T-302: OAuth callback
        {
          taskId: 302,
          filePath: 'src/app/api/auth/callback/route.ts',
          changeType: 'created',
          language: 'typescript',
          linesAdded: 76,
          linesRemoved: 0,
          diff: `diff --git a/src/app/api/auth/callback/route.ts b/src/app/api/auth/callback/route.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/app/api/auth/callback/route.ts
@@ -0,0 +1,76 @@
'use server';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// OAuth callback handler for authorization code exchange
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error(\`OAuth error: \${error} - \${errorDescription}\`);
    return NextResponse.redirect(new URL(\`/auth/error?error=\${error}\`, request.url));
  }

  // Validate state parameter to prevent CSRF
  const sessionState = request.cookies.get('oauth_state')?.value;
  if (!state || state !== sessionState) {
    console.error('State mismatch - potential CSRF attack');
    return NextResponse.redirect(new URL('/auth/error?error=invalid_state', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?error=missing_code', request.url));
  }

  try {
    // Exchange authorization code for access token
    const provider = request.cookies.get('oauth_provider')?.value || 'google';
    const tokenResponse = await exchangeCodeForToken(code, provider);

    if (!tokenResponse.access_token) {
      throw new Error('No access token in response');
    }

    // Fetch user profile from OAuth provider
    const userProfile = await fetchUserProfile(tokenResponse.access_token, provider);

    // Create or update user in database
    const user = await createOrUpdateUser(userProfile, provider);

    // Create session
    const session = await createSession(user.id);

    // Clear OAuth temp cookies
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_provider');
    response.cookies.set('session', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}

async function exchangeCodeForToken(code: string, provider: string) {
  // Implementation for token exchange
  // Varies by OAuth provider
  return {};
}

async function fetchUserProfile(token: string, provider: string) {
  // Implementation for fetching user profile
  return {};
}`,
        },
        // T-501: job queue
        {
          taskId: 501,
          filePath: 'src/lib/queue.ts',
          changeType: 'created',
          language: 'typescript',
          linesAdded: 143,
          linesRemoved: 0,
          diff: `diff --git a/src/lib/queue.ts b/src/lib/queue.ts
new file mode 100644
index 0000000..2345678
--- /dev/null
+++ b/src/lib/queue.ts
@@ -0,0 +1,143 @@
import Bull from 'bull';
import { redis } from './redis';

// Job queue for async task processing
export const jobQueue = new Bull('jobs', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

export interface JobData {
  type: string;
  payload: Record<string, unknown>;
  retryCount?: number;
  maxRetries?: number;
}

// Process jobs with error handling and retry logic
jobQueue.process(async (job) => {
  const { type, payload, retryCount = 0, maxRetries = 3 } = job.data as JobData;

  try {
    switch (type) {
      case 'send_email':
        return await sendEmailJob(payload);
      case 'generate_report':
        return await generateReportJob(payload);
      case 'sync_external_data':
        return await syncExternalDataJob(payload);
      default:
        throw new Error(\`Unknown job type: \${type}\`);
    }
  } catch (error) {
    if (retryCount < maxRetries) {
      throw error; // Bull will retry
    }
    // Max retries exceeded
    console.error(\`Job \${job.id} failed after \${retryCount} retries\`, error);
    throw error;
  }
});

// Job completion and failure handlers
jobQueue.on('completed', (job) => {
  console.log(\`Job \${job.id} completed\`, job.data);
});

jobQueue.on('failed', (job, error) => {
  console.error(\`Job \${job.id} failed\`, error);
});

// Queue job for processing
export async function enqueueJob(type: string, payload: Record<string, unknown>) {
  return await jobQueue.add({ type, payload }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  });
}

// Implementation for email sending job
async function sendEmailJob(payload: Record<string, unknown>) {
  const { to, subject, body } = payload;
  // Send email implementation
  return { sent: true };
}

// Implementation for report generation job
async function generateReportJob(payload: Record<string, unknown>) {
  const { reportId, format } = payload;
  // Generate report implementation
  return { reportId, format };
}

// Implementation for external data sync job
async function syncExternalDataJob(payload: Record<string, unknown>) {
  const { source, destination } = payload;
  // Sync data implementation
  return { synced: true };
}`,
        },
        {
          taskId: 501,
          filePath: 'docker-compose.yml',
          changeType: 'modified',
          language: 'yaml',
          linesAdded: 18,
          linesRemoved: 2,
          diff: `diff --git a/docker-compose.yml b/docker-compose.yml
index 4433221..5544332 100644
--- a/docker-compose.yml
+++ b/docker-compose.yml
@@ -10,6 +10,18 @@
       - POSTGRES_PASSWORD=specdrivr_password
       - POSTGRES_DB=specdrivr
 
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:`,
        },
      ];

      for (const fc of fileChangesData) {
        await tx.insert(fileChanges).values(fc).onConflictDoNothing();
      }
      // -------------------------------------------------------------------------
      // 14. Agent Sessions
      // -------------------------------------------------------------------------
      const agentSessionsData = [
        {
          id: 1,
          projectId: 1,
          specId: 1,
          planId: 1,
          status: 'completed' as const,
          tasksExecuted: 6,
          tasksSucceeded: 6,
          tasksFailed: 0,
          startedBy: 'user_alex',
          startedAt: daysAgo(3),
          endedAt: daysAgo(2),
          gitBaseBranch: 'main',
          agentVersion: 'specdrivr-agent/1.2.0',
        },
        {
          id: 2,
          projectId: 1,
          specId: 2,
          planId: 2,
          status: 'completed' as const,
          tasksExecuted: 4,
          tasksSucceeded: 4,
          tasksFailed: 0,
          startedBy: 'user_alex',
          startedAt: daysAgo(3),
          endedAt: daysAgo(1),
          gitBaseBranch: 'main',
          agentVersion: 'specdrivr-agent/1.2.0',
        },
        {
          id: 3,
          projectId: 2,
          specId: 3,
          planId: 3,
          status: 'running' as const,
          tasksExecuted: 2,
          tasksSucceeded: 2,
          tasksFailed: 0,
          startedBy: 'user_sam',
          startedAt: daysAgo(3),
          lastHeartbeatAt: hoursAgo(0),
          gitBaseBranch: 'main',
          agentVersion: 'specdrivr-agent/1.2.1',
        },
        {
          id: 4,
          projectId: 4,
          specId: 7,
          planId: 5,
          status: 'failed' as const,
          tasksExecuted: 3,
          tasksSucceeded: 2,
          tasksFailed: 1,
          errorMessage: 'Worker process OOM killed',
          startedBy: 'user_jordan',
          startedAt: daysAgo(3),
          endedAt: daysAgo(2),
          gitBaseBranch: 'main',
          agentVersion: 'specdrivr-agent/1.2.0',
        },
        {
          id: 5,
          projectId: 2,
          specId: 3,
          planId: 3,
          status: 'running' as const,
          currentTaskId: 303,
          tasksExecuted: 2,
          tasksSucceeded: 2,
          tasksFailed: 0,
          startedBy: 'user_sam',
          startedAt: hoursAgo(2),
          lastHeartbeatAt: hoursAgo(0),
          gitBaseBranch: 'feat/oauth2-integration',
          agentVersion: 'specdrivr-agent/1.3.0',
        },
      ];

      for (const s of agentSessionsData) {
        await tx.insert(agentSessions).values(s).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 15. Agent Events
      // -------------------------------------------------------------------------
      const agentEventsData = [
        // Session 1 — Component Library (completed)
        {
          sessionId: 1,
          specId: 1,
          eventType: 'SESSION_STARTED',
          message: 'Agent session started for Component Library Refactor',
          createdAt: daysAgo(3),
        },
        {
          sessionId: 1,
          specId: 1,
          taskId: 101,
          eventType: 'TASK_DONE',
          message: 'T-101 Audit existing components — completed',
          createdAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        },
        {
          sessionId: 1,
          specId: 1,
          taskId: 102,
          eventType: 'TASK_DONE',
          message: 'T-102 Extract design tokens — completed',
          createdAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
        },
        {
          sessionId: 1,
          specId: 1,
          taskId: 103,
          eventType: 'TASK_DONE',
          message: 'T-103 Build Button variants — completed',
          createdAt: new Date(daysAgo(2).getTime() + 2 * 3600 * 1000),
        },
        {
          sessionId: 1,
          specId: 1,
          taskId: 104,
          eventType: 'TASK_DONE',
          message: 'T-104 Build Form components — completed',
          createdAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
        },
        {
          sessionId: 1,
          specId: 1,
          taskId: 105,
          eventType: 'TASK_DONE',
          message: 'T-105 Write Storybook stories — completed',
          createdAt: new Date(daysAgo(2).getTime() + 7 * 3600 * 1000),
        },
        {
          sessionId: 1,
          specId: 1,
          taskId: 106,
          eventType: 'TASK_DONE',
          message: 'T-106 Update documentation — completed',
          createdAt: new Date(daysAgo(2).getTime() + 9 * 3600 * 1000),
        },
        {
          sessionId: 1,
          specId: 1,
          eventType: 'SESSION_COMPLETED',
          message: 'All 6 tasks completed successfully. Session closed.',
          createdAt: new Date(daysAgo(2).getTime() + 9 * 3600 * 1000 + 60000),
        },

        // Session 2 — Dark Mode (completed)
        {
          sessionId: 2,
          specId: 2,
          eventType: 'SESSION_STARTED',
          message: 'Agent session started for Dark Mode System',
          createdAt: daysAgo(3),
        },
        {
          sessionId: 2,
          specId: 2,
          taskId: 201,
          eventType: 'TASK_DONE',
          message: 'T-201 Create CSS variable system — completed',
          createdAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
        },
        {
          sessionId: 2,
          specId: 2,
          taskId: 202,
          eventType: 'TASK_DONE',
          message: 'T-202 Implement ThemeProvider — completed',
          createdAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
        },
        {
          sessionId: 2,
          specId: 2,
          taskId: 203,
          eventType: 'TASK_DONE',
          message: 'T-203 Apply dark tokens to layouts — completed',
          createdAt: new Date(daysAgo(2).getTime() + 8 * 3600 * 1000),
        },
        {
          sessionId: 2,
          specId: 2,
          taskId: 204,
          eventType: 'TASK_DONE',
          message: 'T-204 Test across browsers — completed',
          createdAt: new Date(daysAgo(1).getTime() + 4 * 3600 * 1000),
        },
        {
          sessionId: 2,
          specId: 2,
          eventType: 'SESSION_COMPLETED',
          message: 'All 4 tasks completed successfully. Session closed.',
          createdAt: new Date(daysAgo(1).getTime() + 4 * 3600 * 1000 + 60000),
        },

        // Session 3 — OAuth2 (running)
        {
          sessionId: 3,
          specId: 3,
          eventType: 'SESSION_STARTED',
          message: 'Agent session started for OAuth2 Integration',
          createdAt: daysAgo(3),
        },
        {
          sessionId: 3,
          specId: 3,
          taskId: 301,
          eventType: 'TASK_DONE',
          message: 'T-301 Configure OAuth2 provider — completed',
          createdAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
        },
        {
          sessionId: 3,
          specId: 3,
          taskId: 302,
          eventType: 'TASK_DONE',
          message: 'T-302 Implement callback handler — completed',
          createdAt: new Date(daysAgo(3).getTime() + 6 * 3600 * 1000),
        },

        // Session 4 — Batch Processor (failed)
        {
          sessionId: 4,
          specId: 7,
          eventType: 'SESSION_STARTED',
          message: 'Agent session started for Batch Processor',
          createdAt: daysAgo(3),
        },
        {
          sessionId: 4,
          specId: 7,
          taskId: 501,
          eventType: 'TASK_DONE',
          message: 'T-501 Setup job queue — completed',
          createdAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        },
        {
          sessionId: 4,
          specId: 7,
          taskId: 502,
          eventType: 'TASK_DONE',
          message: 'T-502 Implement worker logic — completed',
          createdAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
        },
        {
          sessionId: 4,
          specId: 7,
          taskId: 503,
          eventType: 'TASK_FAILED',
          message: 'T-503 Add retry mechanism — failed after 2 attempts (OOM)',
          metadata: { exitCode: 137, attempts: 2 },
          createdAt: new Date(daysAgo(2).getTime() + 3 * 3600 * 1000),
        },
        {
          sessionId: 4,
          specId: 7,
          taskId: 504,
          eventType: 'TASK_BLOCKED',
          message: 'T-504 Add monitoring hooks — blocked pending retry strategy decision on T-503',
          createdAt: new Date(daysAgo(2).getTime() + 3 * 3600 * 1000 + 60000),
        },
        {
          sessionId: 4,
          specId: 7,
          eventType: 'SESSION_FAILED',
          message: 'Session failed — worker process OOM killed on T-503',
          metadata: { errorMessage: 'Worker process OOM killed' },
          createdAt: new Date(daysAgo(2).getTime() + 3 * 3600 * 1000 + 120000),
        },

        // Session 5 — OAuth2 Integration (running)
        {
          sessionId: 5,
          specId: 3,
          eventType: 'SESSION_STARTED',
          message: 'Agent session started for OAuth2 Integration',
          createdAt: hoursAgo(2),
        },
        {
          sessionId: 5,
          specId: 3,
          taskId: 301,
          eventType: 'TASK_DONE',
          message: 'T-301 Configure OAuth2 provider — completed in 3 hours',
          metadata: { duration: '3h', providers: ['google', 'github'] },
          createdAt: hoursAgo(1),
        },
        {
          sessionId: 5,
          specId: 3,
          taskId: 302,
          eventType: 'TASK_DONE',
          message: 'T-302 Implement callback handler — completed in 2.5 hours',
          metadata: { duration: '2.5h', routes: 2 },
          createdAt: new Date(hoursAgo(1).getTime() - 30 * 60000),
        },
        {
          sessionId: 5,
          specId: 3,
          taskId: 303,
          eventType: 'TASK_STARTED',
          message: 'Started T-303 Store OAuth tokens securely',
          metadata: { approach: 'Redis + HTTP-only cookies' },
          createdAt: hoursAgo(0.5),
        },
        {
          sessionId: 5,
          specId: 3,
          taskId: 303,
          eventType: 'TASK_PROGRESS',
          message: 'Created Redis schema for token storage and implemented encryption',
          metadata: { files: ['src/lib/oauth/token-storage.ts'], status: 'in-progress' },
          createdAt: hoursAgo(0.1),
        },
      ];

      for (const e of agentEventsData) {
        await tx.insert(agentEvents).values(e).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 16. Agent Logs (~10 rows)
      // -------------------------------------------------------------------------
      const agentLogsData = [
        // Session 1 logs
        {
          taskId: 101,
          sessionId: 1,
          projectId: 1,
          level: 'info' as const,
          message: 'Starting component audit — scanning src/components/**',
          context: { taskId: 101, step: 'audit' },
          timestamp: daysAgo(3),
        },
        {
          taskId: 102,
          sessionId: 1,
          projectId: 1,
          level: 'info' as const,
          message:
            'Design tokens extracted: 48 color tokens, 12 spacing tokens, 8 typography tokens',
          context: { taskId: 102, tokens: 68 },
          timestamp: new Date(daysAgo(3).getTime() + 4 * 3600 * 1000),
        },
        {
          taskId: 102,
          sessionId: 1,
          projectId: 1,
          level: 'debug' as const,
          message: 'Writing tokens to tailwind.config.ts theme.extend',
          isInternal: true,
          context: { taskId: 102, file: 'tailwind.config.ts' },
          timestamp: new Date(daysAgo(3).getTime() + 4.5 * 3600 * 1000),
        },
        // Session 2 logs
        {
          taskId: 201,
          sessionId: 2,
          projectId: 1,
          level: 'info' as const,
          message: 'CSS variable system created with light/dark token pairs',
          context: { taskId: 201, variables: 96 },
          timestamp: new Date(daysAgo(3).getTime() + 2.5 * 3600 * 1000),
        },
        {
          taskId: 202,
          sessionId: 2,
          projectId: 1,
          level: 'info' as const,
          message: 'ThemeProvider wrapping app root — localStorage persistence enabled',
          context: { taskId: 202 },
          timestamp: new Date(daysAgo(2).getTime() + 3 * 3600 * 1000),
        },
        // Session 3 logs
        {
          taskId: 301,
          sessionId: 3,
          projectId: 2,
          level: 'info' as const,
          message: 'OAuth2 provider registered: google, github. Callback URIs configured.',
          context: { taskId: 301, providers: ['google', 'github'] },
          timestamp: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        },
        {
          taskId: 302,
          sessionId: 3,
          projectId: 2,
          level: 'debug' as const,
          message: 'Callback route created at /api/auth/callback — handling code exchange',
          isInternal: true,
          context: { taskId: 302, route: '/api/auth/callback' },
          timestamp: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
        },
        // Session 4 logs
        {
          taskId: 501,
          sessionId: 4,
          projectId: 4,
          level: 'info' as const,
          message: 'BullMQ job queue initialized — Redis connection verified',
          context: { taskId: 501, queue: 'batch-processor' },
          timestamp: new Date(daysAgo(3).getTime() + 1 * 3600 * 1000),
        },
        {
          taskId: 502,
          sessionId: 4,
          projectId: 4,
          level: 'info' as const,
          message: 'Worker concurrency set to 4 — processing test batch of 1000 records',
          context: { taskId: 502, concurrency: 4 },
          timestamp: new Date(daysAgo(3).getTime() + 3.5 * 3600 * 1000),
        },
        {
          taskId: 503,
          sessionId: 4,
          projectId: 4,
          level: 'error' as const,
          message:
            'Worker process killed by OOM killer (exit code 137). Memory usage peaked at 638MB — limit is 512MB.',
          context: { taskId: 503, exitCode: 137, memoryMB: 638, limitMB: 512 },
          timestamp: new Date(daysAgo(2).getTime() + 2.5 * 3600 * 1000),
        },
        // Session 5 logs (running)
        {
          taskId: 301,
          sessionId: 5,
          projectId: 2,
          level: 'info' as const,
          message:
            'OAuth2 provider configuration: Google (client_id: ***), GitHub (client_id: ***)',
          context: { taskId: 301, providers: ['google', 'github'] },
          timestamp: hoursAgo(1.8),
        },
        {
          taskId: 302,
          sessionId: 5,
          projectId: 2,
          level: 'info' as const,
          message: 'Callback handler deployed at /api/auth/callback with CSRF protection',
          context: { taskId: 302, route: '/api/auth/callback', csrf: true },
          timestamp: hoursAgo(1.2),
        },
        {
          taskId: 303,
          sessionId: 5,
          projectId: 2,
          level: 'info' as const,
          message: 'Redis schema created for OAuth token storage with TTL-based expiry',
          context: { taskId: 303, schema: 'oauth:tokens', ttl: 604800 },
          timestamp: hoursAgo(0.3),
        },
        {
          taskId: 303,
          sessionId: 5,
          projectId: 2,
          level: 'debug' as const,
          message: 'Implementing AES-256-GCM encryption for sensitive token data',
          isInternal: true,
          context: { taskId: 303, cipher: 'AES-256-GCM' },
          timestamp: hoursAgo(0.1),
        },
      ];

      for (const l of agentLogsData) {
        await tx.insert(agentLogs).values(l).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 17. Notifications (Comprehensive coverage for all users)
      // -------------------------------------------------------------------------
      const notificationTemplates = [
        {
          type: 'plan_approved',
          title: 'Plan approved',
          body: 'The implementation plan for {resource} has been approved.',
        },
        {
          type: 'session_complete',
          title: 'Session completed',
          body: 'Agent session for {resource} finished successfully.',
        },
        {
          type: 'task_blocked',
          title: 'Task blocked',
          body: 'A task in {resource} needs your attention.',
        },
        {
          type: 'session_failed',
          title: 'Session failed',
          body: 'Agent session for {resource} failed.',
        },
      ];

      for (const user of demoUsers) {
        for (const project of demoProjects) {
          // Add 2-3 notifications per user per project
          for (let i = 0; i < 2; i++) {
            const template =
              notificationTemplates[
                (user.id.length + project.id + i) % notificationTemplates.length
              ];
            await tx
              .insert(notifications)
              .values({
                userId: user.id,
                type: template.type,
                title: template.title,
                body: template.body.replace('{resource}', project.name),
                linkUrl: `/projects/${project.id}`,
                projectId: project.id,
                createdAt: daysAgo(i + 1),
                readAt: i === 0 ? null : daysAgo(0), // One unread, one read
              })
              .onConflictDoNothing();
          }
        }
      }

      // -------------------------------------------------------------------------
      // 18. Notification Preferences (2+ per user = 6 rows)
      // -------------------------------------------------------------------------
      const notifPrefsData = [
        { userId: 'user_alex', eventType: 'plan_approved', emailEnabled: true, inAppEnabled: true },
        {
          userId: 'user_alex',
          eventType: 'session_complete',
          emailEnabled: true,
          inAppEnabled: true,
        },
        { userId: 'user_sam', eventType: 'plan_approved', emailEnabled: true, inAppEnabled: true },
        {
          userId: 'user_sam',
          eventType: 'session_complete',
          emailEnabled: true,
          inAppEnabled: true,
        },
        {
          userId: 'user_jordan',
          eventType: 'plan_approved',
          emailEnabled: true,
          inAppEnabled: true,
        },
        {
          userId: 'user_jordan',
          eventType: 'session_complete',
          emailEnabled: true,
          inAppEnabled: true,
        },
      ];

      for (const p of notifPrefsData) {
        await tx.insert(notificationPreferences).values(p).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 19. Webhooks
      // -------------------------------------------------------------------------
      const webhooksData = [
        {
          id: 1,
          projectId: 1,
          url: 'https://hooks.example.com/p1',
          events: ['plan.approved', 'session.completed'],
          isActive: true,
          status: 'active',
          createdAt: daysAgo(5),
        },
        {
          id: 2,
          projectId: 2,
          url: 'https://hooks.example.com/p2',
          events: ['*'],
          isActive: true,
          status: 'active',
          createdAt: daysAgo(5),
        },
        {
          id: 3,
          projectId: 4,
          url: 'https://hooks.example.com/p4',
          events: ['task.blocked', 'session.failed'],
          isActive: true,
          status: 'error',
          createdAt: daysAgo(4),
        },
      ];

      for (const w of webhooksData) {
        await tx.insert(webhooks).values(w).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 20. Webhook Deliveries
      // -------------------------------------------------------------------------
      const webhookDeliveriesData = [
        {
          id: 1,
          webhookId: 1,
          projectId: 1,
          eventType: 'plan.approved',
          payload: { planId: 1, status: 'completed', approvedBy: 'user_sam' },
          responseStatus: 200,
          responseBody: '{"ok":true}',
          durationMs: 142,
          attempt: 1,
          status: 'delivered',
          deliveredAt: daysAgo(3),
          createdAt: daysAgo(3),
        },
        {
          id: 2,
          webhookId: 1,
          projectId: 1,
          eventType: 'session.completed',
          payload: { sessionId: 1, tasksSucceeded: 6, tasksFailed: 0 },
          responseStatus: 200,
          responseBody: '{"ok":true}',
          durationMs: 98,
          attempt: 1,
          status: 'delivered',
          deliveredAt: daysAgo(2),
          createdAt: daysAgo(2),
        },
        {
          id: 3,
          webhookId: 3,
          projectId: 4,
          eventType: 'session.failed',
          payload: { sessionId: 4, errorMessage: 'Worker process OOM killed' },
          responseStatus: 500,
          responseBody: 'Internal Server Error',
          durationMs: 3201,
          attempt: 1,
          status: 'failed',
          nextRetryAt: new Date(daysAgo(2).getTime() + 5 * 60 * 1000),
          createdAt: daysAgo(2),
        },
        {
          id: 4,
          webhookId: 3,
          projectId: 4,
          eventType: 'session.failed',
          payload: { sessionId: 4, errorMessage: 'Worker process OOM killed' },
          responseStatus: 500,
          responseBody: 'Internal Server Error',
          durationMs: 30001,
          attempt: 2,
          status: 'exhausted',
          createdAt: new Date(daysAgo(2).getTime() + 5 * 60 * 1000),
        },
      ];

      for (const d of webhookDeliveriesData) {
        await tx.insert(webhookDeliveries).values(d).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 21. Usage Snapshots (5 days × 3 projects = 15 rows)
      // -------------------------------------------------------------------------
      const usageSnapshotsData = [
        // Project 1 — Blaze UI
        {
          projectId: 1,
          date: daysAgo(4),
          sessionsRun: 1,
          tasksExecuted: 2,
          tasksSucceeded: 2,
          tasksFailed: 0,
          specsCreated: 2,
        },
        {
          projectId: 1,
          date: daysAgo(3),
          sessionsRun: 2,
          tasksExecuted: 4,
          tasksSucceeded: 4,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 1,
          date: daysAgo(2),
          sessionsRun: 0,
          tasksExecuted: 6,
          tasksSucceeded: 6,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 1,
          date: daysAgo(1),
          sessionsRun: 0,
          tasksExecuted: 2,
          tasksSucceeded: 2,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 1,
          date: daysAgo(0),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 0,
        },
        // Project 2 — Auth Service
        {
          projectId: 2,
          date: daysAgo(4),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 2,
          date: daysAgo(3),
          sessionsRun: 1,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 2,
          date: daysAgo(2),
          sessionsRun: 0,
          tasksExecuted: 1,
          tasksSucceeded: 1,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 2,
          date: daysAgo(1),
          sessionsRun: 0,
          tasksExecuted: 1,
          tasksSucceeded: 1,
          tasksFailed: 0,
          specsCreated: 1,
        },
        {
          projectId: 2,
          date: daysAgo(0),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 0,
        },
        // Project 4 — Data Pipeline
        {
          projectId: 4,
          date: daysAgo(4),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 2,
        },
        {
          projectId: 4,
          date: daysAgo(3),
          sessionsRun: 1,
          tasksExecuted: 3,
          tasksSucceeded: 2,
          tasksFailed: 1,
          specsCreated: 0,
        },
        {
          projectId: 4,
          date: daysAgo(2),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 1,
        },
        {
          projectId: 4,
          date: daysAgo(1),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 0,
        },
        {
          projectId: 4,
          date: daysAgo(0),
          sessionsRun: 0,
          tasksExecuted: 0,
          tasksSucceeded: 0,
          tasksFailed: 0,
          specsCreated: 0,
        },
      ];

      for (const snap of usageSnapshotsData) {
        await tx.insert(usageSnapshots).values(snap).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 22. Git Commits (one per done task in sessions 1 & 2 = 10 rows)
      // -------------------------------------------------------------------------
      const doneTasksSession1 = [
        {
          id: 101,
          externalId: 'T-101',
          completedAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        },
        {
          id: 102,
          externalId: 'T-102',
          completedAt: new Date(daysAgo(3).getTime() + 5 * 3600 * 1000),
        },
        {
          id: 103,
          externalId: 'T-103',
          completedAt: new Date(daysAgo(2).getTime() + 2 * 3600 * 1000),
        },
        {
          id: 104,
          externalId: 'T-104',
          completedAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
        },
        {
          id: 105,
          externalId: 'T-105',
          completedAt: new Date(daysAgo(2).getTime() + 7 * 3600 * 1000),
        },
        {
          id: 106,
          externalId: 'T-106',
          completedAt: new Date(daysAgo(2).getTime() + 9 * 3600 * 1000),
        },
      ];

      const doneTasksSession2 = [
        {
          id: 201,
          externalId: 'T-201',
          completedAt: new Date(daysAgo(3).getTime() + 3 * 3600 * 1000),
        },
        {
          id: 202,
          externalId: 'T-202',
          completedAt: new Date(daysAgo(2).getTime() + 4 * 3600 * 1000),
        },
        {
          id: 203,
          externalId: 'T-203',
          completedAt: new Date(daysAgo(2).getTime() + 8 * 3600 * 1000),
        },
        {
          id: 204,
          externalId: 'T-204',
          completedAt: new Date(daysAgo(1).getTime() + 4 * 3600 * 1000),
        },
      ];

      for (const t of doneTasksSession1) {
        await tx
          .insert(gitCommits)
          .values({
            projectId: 1,
            taskId: t.id,
            commitSha: `abc${t.id}def`,
            branch: `daemon/task-${t.externalId.toLowerCase()}`,
            message: `feat: complete ${t.externalId}`,
            author: 'user_alex',
            committedAt: t.completedAt,
          })
          .onConflictDoNothing();
      }

      for (const t of doneTasksSession2) {
        await tx
          .insert(gitCommits)
          .values({
            projectId: 1,
            taskId: t.id,
            commitSha: `abc${t.id}def`,
            branch: `daemon/task-${t.externalId.toLowerCase()}`,
            message: `feat: complete ${t.externalId}`,
            author: 'user_alex',
            committedAt: t.completedAt,
          })
          .onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 23. API Request Logs (4 rows, using token 1 from P2)
      // -------------------------------------------------------------------------
      const apiRequestLogsData = [
        {
          tokenId: 1,
          projectId: 2,
          endpoint: '/api/v1/sessions',
          method: 'POST',
          statusCode: 201,
          durationMs: 87,
          requestedAt: daysAgo(3),
        },
        {
          tokenId: 1,
          projectId: 2,
          endpoint: '/api/v1/specs/3',
          method: 'GET',
          statusCode: 200,
          durationMs: 23,
          requestedAt: new Date(daysAgo(3).getTime() + 1000),
        },
        {
          tokenId: 1,
          projectId: 2,
          endpoint: '/api/v1/sessions/3/heartbeat',
          method: 'POST',
          statusCode: 200,
          durationMs: 15,
          requestedAt: hoursAgo(1),
        },
        {
          tokenId: 1,
          projectId: 2,
          endpoint: '/api/v1/sessions/3/heartbeat',
          method: 'POST',
          statusCode: 200,
          durationMs: 12,
          requestedAt: hoursAgo(0),
        },
      ];

      for (const r of apiRequestLogsData) {
        await tx.insert(apiRequestLogs).values(r).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 24. Audit Log (15+ rows)
      // -------------------------------------------------------------------------
      const auditLogData = [
        // project.created
        {
          projectId: 1,
          userId: 'user_alex',
          action: 'project.created',
          targetType: 'project',
          targetId: '1',
          detail: { name: 'Blaze UI Redesign' },
          createdAt: daysAgo(5),
        },
        {
          projectId: 2,
          userId: 'user_sam',
          action: 'project.created',
          targetType: 'project',
          targetId: '2',
          detail: { name: 'Auth Service' },
          createdAt: daysAgo(5),
        },
        {
          projectId: 3,
          userId: 'user_alex',
          action: 'project.created',
          targetType: 'project',
          targetId: '3',
          detail: { name: 'Payments v2' },
          createdAt: daysAgo(4),
        },
        {
          projectId: 4,
          userId: 'user_jordan',
          action: 'project.created',
          targetType: 'project',
          targetId: '4',
          detail: { name: 'Data Pipeline' },
          createdAt: daysAgo(4),
        },
        {
          projectId: 5,
          userId: 'user_alex',
          action: 'project.created',
          targetType: 'project',
          targetId: '5',
          detail: { name: 'API Gateway' },
          createdAt: daysAgo(1),
        },
        // spec.created
        {
          projectId: 1,
          userId: 'user_alex',
          action: 'spec.created',
          targetType: 'specification',
          targetId: '1',
          detail: { name: 'Component Library Refactor' },
          createdAt: daysAgo(5),
        },
        {
          projectId: 2,
          userId: 'user_sam',
          action: 'spec.created',
          targetType: 'specification',
          targetId: '3',
          detail: { name: 'OAuth2 Integration' },
          createdAt: daysAgo(5),
        },
        {
          projectId: 3,
          userId: 'user_alex',
          action: 'spec.created',
          targetType: 'specification',
          targetId: '5',
          detail: { name: 'Stripe Checkout Flow' },
          createdAt: daysAgo(4),
        },
        {
          projectId: 4,
          userId: 'user_jordan',
          action: 'spec.created',
          targetType: 'specification',
          targetId: '7',
          detail: { name: 'Batch Processor' },
          createdAt: daysAgo(4),
        },
        // plan.approved
        {
          projectId: 1,
          userId: 'user_sam',
          action: 'plan.approved',
          targetType: 'plan',
          targetId: '1',
          detail: { specId: 1 },
          createdAt: daysAgo(3),
        },
        {
          projectId: 1,
          userId: 'user_sam',
          action: 'plan.approved',
          targetType: 'plan',
          targetId: '2',
          detail: { specId: 2 },
          createdAt: daysAgo(3),
        },
        {
          projectId: 2,
          userId: 'user_alex',
          action: 'plan.approved',
          targetType: 'plan',
          targetId: '3',
          detail: { specId: 3 },
          createdAt: daysAgo(3),
        },
        {
          projectId: 4,
          userId: 'user_alex',
          action: 'plan.approved',
          targetType: 'plan',
          targetId: '5',
          detail: { specId: 7 },
          createdAt: daysAgo(3),
        },
        // member.added
        {
          projectId: 1,
          userId: 'user_alex',
          action: 'member.added',
          targetType: 'user',
          targetId: 'user_sam',
          detail: { role: 'admin' },
          createdAt: daysAgo(5),
        },
        {
          projectId: 1,
          userId: 'user_alex',
          action: 'member.added',
          targetType: 'user',
          targetId: 'user_jordan',
          detail: { role: 'member' },
          createdAt: daysAgo(5),
        },
        // session.failed
        {
          projectId: 4,
          userId: 'user_jordan',
          action: 'session.failed',
          targetType: 'agent_session',
          targetId: '4',
          detail: { errorMessage: 'Worker process OOM killed' },
          createdAt: daysAgo(2),
        },
      ];

      for (const entry of auditLogData) {
        await tx.insert(auditLog).values(entry).onConflictDoNothing();
      }

      // -------------------------------------------------------------------------
      // 25. Test Results
      // -------------------------------------------------------------------------
      await tx
        .insert(testResults)
        .values({
          taskId: 101,
          success: true,
          logs: '6 passed, 0 failed\nAll component snapshot tests green.',
          createdAt: new Date(daysAgo(3).getTime() + 2 * 3600 * 1000),
        })
        .onConflictDoNothing();

      await tx
        .insert(testResults)
        .values({
          taskId: 503,
          success: false,
          logs: '2 passed, 1 failed — retry timeout exceeded\nFAIL: RetryMechanism › should retry on OOM error\nExpected process to complete within 30s, but timed out.',
          createdAt: new Date(daysAgo(2).getTime() + 2.5 * 3600 * 1000),
        })
        .onConflictDoNothing();

      logger.info(
        {
          users: 3,
          projects: 5,
          specs: 10,
          specVersions: 11,
          plans: 6,
          planReviews: 6,
          tasks: 20,
          taskAttempts: 4,
          fileChanges: 7,
          sessions: 4,
          agentEvents: 23,
          agentLogs: 10,
          notifications: 60,
          notifPrefs: 6,
          webhooks: 3,
          webhookDeliveries: 4,
          usageSnapshots: 15,
          gitCommits: 10,
          apiRequestLogs: 4,
          auditLog: 16,
          testResults: 2,
        },
        'Seed data inserted'
      );
    });

    await resetSequences();
    logger.info('Seed complete');
  } catch (error) {
    logger.error(error, 'Seed failed');
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
