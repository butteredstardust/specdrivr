/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users, projects, specifications, plans, tasks, invites,
  agentSessions, taskAttempts, apiRequestLogs, auditLog,
  testResults, webhookDeliveries, webhooks, notifications,
  notificationPreferences, usageSnapshots, gitCommits,
  fileChanges, planReviews, specVersions, agentTokens,
  accounts, sessions, verifications, projectMembers, agentConfig
} from "../src/db/schema";
import { env } from "../src/lib/env-script";
import * as schema from "../src/db/schema";
import { nanoid } from "nanoid";
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { sql } from "drizzle-orm";

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(queryClient, { schema });

// Better-auth uses scrypt with these parameters:
const scryptParams = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

// Scrypt key derivation async (same as better-auth)
async function scryptHash(password: string): Promise<string> {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const salt = Buffer.from(saltBuf).toString("hex");
  // Better-auth normalizes the password before hashing
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: scryptParams.N,
    p: scryptParams.p,
    r: scryptParams.r,
    dkLen: scryptParams.dkLen,
    maxmem: 128 * scryptParams.N * scryptParams.r * 2,
  });
  return `${salt}:${Buffer.from(key).toString("hex")}`;
}

async function main() {
  console.log("Cleaning database...");
  await db.transaction(async (tx) => {
    // Delete in reverse order of dependencies
    await tx.delete(apiRequestLogs);
    await tx.delete(auditLog);
    await tx.delete(testResults);
    await tx.delete(webhookDeliveries);
    await tx.delete(webhooks);
    await tx.delete(notifications);
    await tx.delete(notificationPreferences);
    await tx.delete(usageSnapshots);
    await tx.delete(gitCommits);
    await tx.delete(fileChanges);
    await tx.delete(taskAttempts);
    await tx.delete(agentSessions);
    await tx.delete(planReviews);
    await tx.delete(tasks);
    await tx.delete(plans);
    await tx.delete(specVersions);
    await tx.delete(specifications);
    await tx.delete(invites);
    await tx.delete(projectMembers);
    await tx.delete(agentConfig);
    await tx.delete(agentTokens);
    await tx.delete(accounts);
    await tx.delete(sessions);
    await tx.delete(verifications);
    await tx.delete(projects);
    await tx.delete(users);
  });

  console.log("Seeding database...");

  const passwordHash = await scryptHash("password123");

  await db.transaction(async (tx) => {
    // Insert Users with text IDs (5 users total for UI variety)
    // Note: passwordHash is not set here - better-auth stores passwords in accounts table
    const u1 = (await tx.insert(users).values({
      id: nanoid(),
      name: "Admin User",
      email: "admin@example.com",
      role: "admin",
      emailVerified: true,
    }).returning())[0];

    const u2 = (await tx.insert(users).values({
      id: nanoid(),
      name: "Test User",
      email: "test@example.com",
      role: "member",
      emailVerified: true,
    }).returning())[0];

    const u3 = (await tx.insert(users).values({
      id: nanoid(),
      name: "Viewer User",
      email: "viewer@example.com",
      role: "viewer",
      emailVerified: true,
    }).returning())[0];

    const u4 = (await tx.insert(users).values({
      id: nanoid(),
      name: "Elena Rodriguez",
      email: "elena@example.com",
      role: "owner",
      emailVerified: true,
    }).returning())[0];

    const u5 = (await tx.insert(users).values({
      id: nanoid(),
      name: "James Chen",
      email: "james@example.com",
      role: "member",
      emailVerified: true,
    }).returning())[0];

    // Insert Accounts for BetterAuth
    // accountId must be the user ID and providerId must be "credential" for email/password auth
    await tx.insert(accounts).values([
      { id: nanoid(), accountId: u1.id, providerId: "credential", userId: u1.id, password: passwordHash },
      { id: nanoid(), accountId: u2.id, providerId: "credential", userId: u2.id, password: passwordHash },
      { id: nanoid(), accountId: u3.id, providerId: "credential", userId: u3.id, password: passwordHash },
      { id: nanoid(), accountId: u4.id, providerId: "credential", userId: u4.id, password: passwordHash },
      { id: nanoid(), accountId: u5.id, providerId: "credential", userId: u5.id, password: passwordHash },
    ]);

    // Insert Projects (5 projects with varied statuses)
    const p1 = (await tx.insert(projects).values({
      name: "Project Alpha",
      slug: "project-alpha",
      description: "A highly classified project for enterprise integration.",
      repositoryUrl: "https://github.com/specdrivr/alpha",
      avatarColor: "#7c5cfc",
      createdBy: u1.id,
    }).returning())[0];

    const p2 = (await tx.insert(projects).values({
      name: "Project Beta",
      slug: "project-beta",
      description: "Another great project focused on mobile applications.",
      repositoryUrl: "https://github.com/specdrivr/beta",
      avatarColor: "#3b82f6",
      createdBy: u2.id,
    }).returning())[0];

    const p3 = (await tx.insert(projects).values({
      name: "Project Gamma",
      slug: "project-gamma",
      description: "AI-powered analytics platform.",
      repositoryUrl: "https://github.com/specdrivr/gamma",
      avatarColor: "#10b981",
      createdBy: u4.id,
    }).returning())[0];

    const _p4 = (await tx.insert(projects).values({
      name: "Project Delta",
      slug: "project-delta",
      description: "Legacy system migration project - currently archived.",
      repositoryUrl: "https://github.com/specdrivr/delta",
      avatarColor: "#f59e0b",
      createdBy: u5.id,
      status: "archived",
    }).returning())[0];

    const _p5 = (await tx.insert(projects).values({
      name: "Project Epsilon",
      slug: "project-epsilon",
      description: "Internal tools development.",
      repositoryUrl: "https://github.com/specdrivr/epsilon",
      avatarColor: "#ef4444",
      createdBy: u1.id,
      isDemo: true,
    }).returning())[0];

    // Insert Project Members (for multi-user collaboration display)
    await tx.insert(projectMembers).values([
      { projectId: p1.id, userId: u1.id, role: "owner", status: "active" },
      { projectId: p1.id, userId: u2.id, role: "admin", status: "active" },
      { projectId: p1.id, userId: u3.id, role: "viewer", status: "active" },
      { projectId: p2.id, userId: u2.id, role: "owner", status: "active" },
      { projectId: p2.id, userId: u4.id, role: "member", status: "active" },
      { projectId: p3.id, userId: u4.id, role: "owner", status: "active" },
      { projectId: p3.id, userId: u5.id, role: "member", status: "active" },
    ]);

    // Insert Specifications (with various statuses)
    const s1 = (await tx.insert(specifications).values({
      projectId: p1.id,
      name: "User Authentication System",
      status: "complete",
      createdBy: u1.id,
    }).returning())[0];

    const s2 = (await tx.insert(specifications).values({
      projectId: p1.id,
      name: "Payment Gateway Integration",
      status: "executing",
      createdBy: u2.id,
    }).returning())[0];

    const s3 = (await tx.insert(specifications).values({
      projectId: p2.id,
      name: "Mobile App Redesign",
      status: "pending_approval",
      createdBy: u4.id,
    }).returning())[0];

    const s4 = (await tx.insert(specifications).values({
      projectId: p3.id,
      name: "Analytics Dashboard",
      status: "pending_plan",
      createdBy: u4.id,
    }).returning())[0];

    const _s5 = (await tx.insert(specifications).values({
      projectId: p3.id,
      name: "Data Pipeline Architecture",
      status: "drafting",
      createdBy: u5.id,
    }).returning())[0];

    // Insert Spec Versions (multiple versions per spec)
    const _sv1_1 = (await tx.insert(specVersions).values({
      specId: s1.id,
      versionNumber: 1,
      markdownContent: "Initial version for authentication system.",
      createdBy: u1.id,
    }).returning())[0];

    const sv1_2 = (await tx.insert(specVersions).values({
      specId: s1.id,
      versionNumber: 2,
      markdownContent: "Updated with OAuth2 provider support.",
      createdBy: u1.id,
    }).returning())[0];

    const sv2_1 = (await tx.insert(specVersions).values({
      specId: s2.id,
      versionNumber: 1,
      markdownContent: "Initial payment integration specification.",
      createdBy: u2.id,
    }).returning())[0];

    // Update specs with currentVersionId
    await tx.update(specifications).set({ currentVersionId: sv1_2.id }).where(sql`id = ${s1.id}`);
    await tx.update(specifications).set({ currentVersionId: sv2_1.id }).where(sql`id = ${s2.id}`);

    // Insert Plans (with all status variants)
    const plan1 = (await tx.insert(plans).values({
      specId: s2.id,
      specVersionId: sv2_1.id,
      status: "approved",
      markdownContent: "# Payment Gateway Integration Plan\n\nImplement Stripe and PayPal integration.",
      reviewerNotes: "Good breakdown of tasks. Approved.",
      approvedBy: u1.id,
      approvedAt: new Date(Date.now() - 86400000),
      taskCount: 8,
      totalEstimatedMinutes: 240,
      createdBy: u2.id,
    }).returning())[0];

    const plan2 = (await tx.insert(plans).values({
      specId: s3.id,
      status: "pending_approval",
      markdownContent: "# Mobile App Redesign Plan\n\nModern UI components and responsive layout.",
      taskCount: 12,
      totalEstimatedMinutes: 360,
      createdBy: u4.id,
    }).returning())[0];

    const _plan3 = (await tx.insert(plans).values({
      specId: s2.id,
      status: "rejected",
      markdownContent: "Alternative payment integration approach.",
      reviewerNotes: "Approach too complex. Use existing library instead.",
      approvedBy: u1.id,
      approvedAt: new Date(Date.now() - 172800000),
      createdBy: u2.id,
    }).returning())[0];

    const plan4 = (await tx.insert(plans).values({
      specId: s3.id,
      status: "changes_requested",
      markdownContent: "First draft of mobile redesign.",
      reviewerNotes: "Need to add accessibility considerations.",
      createdBy: u4.id,
    }).returning())[0];

    const plan5 = (await tx.insert(plans).values({
      specId: s1.id,
      specVersionId: sv1_2.id,
      status: "complete",
      markdownContent: "# Authentication System Implementation\n\nCompleted all tasks successfully.",
      taskCount: 5,
      totalEstimatedMinutes: 150,
      createdBy: u1.id,
    }).returning())[0];

    // Insert Tasks (with all status variants)
    const t1 = (await tx.insert(tasks).values({
      planId: plan2.id,
      specId: s3.id,
      externalId: "T-001",
      title: "Design new component library",
      description: "Create reusable UI components matching design system.",
      status: "done",
      executionOrder: 1,
      estimatedMinutes: 60,
      actualDurationMs: 45000000,
      completedAt: new Date(Date.now() - 3600000),
      expectedFiles: ["src/components/ui/button.tsx", "src/components/ui/card.tsx"],
    }).returning())[0];

    const t2 = (await tx.insert(tasks).values({
      planId: plan2.id,
      specId: s3.id,
      externalId: "T-002",
      title: "Implement responsive navigation",
      description: "Mobile-first navigation with hamburger menu.",
      status: "in_progress",
      executionOrder: 2,
      estimatedMinutes: 45,
    }).returning())[0];

    const _t3 = (await tx.insert(tasks).values({
      planId: plan2.id,
      specId: s3.id,
      externalId: "T-003",
      title: "Add gesture support",
      description: "Swipe gestures for mobile interactions.",
      status: "todo",
      executionOrder: 3,
      dependsOn: [t1.externalId, t2.externalId],
      estimatedMinutes: 30,
    } as unknown as any).returning())[0];

    const t4 = (await tx.insert(tasks).values({
      planId: plan1.id,
      specId: s2.id,
      externalId: "T-004",
      title: "Setup Stripe SDK",
      description: "Install and configure Stripe payment integration.",
      status: "done",
      executionOrder: 1,
      estimatedMinutes: 20,
      actualDurationMs: 12000000,
      completedAt: new Date(Date.now() - 72000000),
      gitCommitHash: "abc123",
      gitBranch: "feature/stripe-integration",
    }).returning())[0];

    const t5 = (await tx.insert(tasks).values({
      planId: plan1.id,
      specId: s2.id,
      externalId: "T-005",
      title: "Create payment endpoints",
      description: "API endpoints for processing payments.",
      status: "blocked",
      executionOrder: 2,
      dependsOn: [t4.externalId],
      blockedReason: "Waiting for API key approval from finance.",
      estimatedMinutes: 90,
    } as unknown as any).returning())[0];

    const _t6 = (await tx.insert(tasks).values({
      planId: plan1.id,
      specId: s2.id,
      externalId: "T-006",
      title: "Add PayPal integration",
      description: "Secondary payment provider for redundancy.",
      status: "todo",
      executionOrder: 3,
      estimatedMinutes: 60,
    }).returning())[0];

    const t7 = (await tx.insert(tasks).values({
      planId: plan2.id,
      specId: s3.id,
      externalId: "T-007",
      title: "Setup testing infrastructure",
      description: "Configure E2E and unit tests for mobile components.",
      status: "failed",
      executionOrder: 0,
      estimatedMinutes: 40,
      attemptCount: 3,
      forcedDone: true,
    }).returning())[0];

    const _t8 = (await tx.insert(tasks).values({
      planId: plan5.id,
      specId: s1.id,
      externalId: "T-008",
      title: "Create OAuth providers",
      description: "Google and GitHub OAuth integration.",
      status: "done",
      executionOrder: 1,
      estimatedMinutes: 90,
      actualDurationMs: 54000000,
      completedAt: new Date(Date.now() - 259200000),
    }).returning())[0];

    const _t9 = (await tx.insert(tasks).values({
      planId: plan5.id,
      specId: s1.id,
      externalId: "T-009",
      title: "Implement session management",
      description: "JWT token handling and refresh logic.",
      status: "done",
      executionOrder: 2,
      estimatedMinutes: 45,
      actualDurationMs: 27000000,
      completedAt: new Date(Date.now() - 259190000),
    }).returning())[0];

    const _t10 = (await tx.insert(tasks).values({
      planId: plan5.id,
      specId: s1.id,
      externalId: "T-010",
      title: "Add role-based access control",
      description: "Admin, member, viewer permissions.",
      status: "done",
      executionOrder: 3,
      estimatedMinutes: 60,
      actualDurationMs: 36000000,
      completedAt: new Date(Date.now() - 259180000),
    }).returning())[0];

    // Insert Task Attempts (with various statuses)
    await tx.insert(taskAttempts).values([
      {
        taskId: t1.id,
        seq: 1,
        status: "succeeded",
        logLines: [{ level: "info", message: "Starting task..." }],
        exitCode: 0,
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(Date.now() - 35550000),
      },
      {
        taskId: t2.id,
        seq: 1,
        status: "running",
        logLines: [{ level: "info", message: "Implementing navigation..." }],
        startedAt: new Date(Date.now() - 300000),
      },
      {
        taskId: t7.id,
        seq: 1,
        status: "failed",
        exitCode: 1,
        errorMessage: "Test suite timeout after 5 minutes.",
        startedAt: new Date(Date.now() - 300000),
        endedAt: new Date(Date.now() - 2955000),
      },
      {
        taskId: t7.id,
        seq: 2,
        status: "failed",
        exitCode: 1,
        errorMessage: "Configuration files not found.",
        startedAt: new Date(Date.now() - 2900000),
        endedAt: new Date(Date.now() - 2895500),
      },
    ]);

    // Insert Agent Sessions (with various statuses)
    const session1 = (await tx.insert(agentSessions).values({
      projectId: p2.id,
      specId: s3.id,
      planId: plan2.id,
      status: "running",
      currentTaskId: t2.id,
      tasksExecuted: 2,
      tasksSucceeded: 1,
      tasksFailed: 0,
      totalPromptTokens: 12500,
      totalCompletionTokens: 8300,
      totalCostUsd: 0.15,
      agentVersion: "claude-sonnet-4-6",
      lastHeartbeatAt: new Date(Date.now() - 60000),
      startedAt: new Date(Date.now() - 3600000),
      startedBy: u4.id,
    }).returning())[0];

    await tx.insert(agentSessions).values([
      {
        projectId: p1.id,
        specId: s2.id,
        planId: plan1.id,
        status: "completed",
        tasksExecuted: 8,
        tasksSucceeded: 6,
        tasksFailed: 0,
        totalPromptTokens: 45000,
        totalCompletionTokens: 32000,
        totalCostUsd: 0.52,
        agentVersion: "claude-sonnet-4-6",
        startedAt: new Date(Date.now() - 86400000),
        endedAt: new Date(Date.now() - 72000000),
        startedBy: u2.id,
      },
      {
        projectId: p3.id,
        specId: s4.id,
        status: "failed",
        errorMessage: "API rate limit exceeded.",
        tasksExecuted: 3,
        tasksSucceeded: 1,
        tasksFailed: 2,
        totalPromptTokens: 8900,
        totalCompletionTokens: 5600,
        totalCostUsd: 0.09,
        agentVersion: "claude-opus-4-6",
        startedAt: new Date(Date.now() - 43200000),
        endedAt: new Date(Date.now() - 43140000),
        startedBy: u4.id,
      },
      {
        projectId: p1.id,
        specId: s1.id,
        planId: plan5.id,
        status: "completed",
        tasksExecuted: 5,
        tasksSucceeded: 5,
        tasksFailed: 0,
        totalPromptTokens: 28000,
        totalCompletionTokens: 19000,
        totalCostUsd: 0.31,
        agentVersion: "claude-opus-4-6",
        startedAt: new Date(Date.now() - 604800000),
        endedAt: new Date(Date.now() - 604700000),
        startedBy: u1.id,
      },
      {
        projectId: p2.id,
        specId: s3.id,
        planId: plan4.id,
        status: "paused",
        currentTaskId: t1.id,
        tasksExecuted: 2,
        tasksSucceeded: 2,
        tasksFailed: 0,
        pauseCount: 1,
        totalPromptTokens: 7500,
        totalCompletionTokens: 4800,
        totalCostUsd: 0.08,
        agentVersion: "claude-sonnet-4-6",
        startedAt: new Date(Date.now() - 1800000),
        startedBy: u4.id,
      },
    ]);

    // Insert Agent Config
    await tx.insert(agentConfig).values([
      {
        projectId: p1.id,
        modelId: "claude-sonnet-4-6",
        planModelId: "claude-opus-4-6",
        maxConcurrentTasks: 3,
        taskTimeoutSeconds: 300,
        maxRetriesPerTask: 2,
        requireApproval: true,
        autoGeneratePlan: false,
      },
      {
        projectId: p2.id,
        modelId: "claude-sonnet-4-6",
        planModelId: "claude-sonnet-4-6",
        maxConcurrentTasks: 2,
        taskTimeoutSeconds: 180,
        maxRetriesPerTask: 1,
        requireApproval: false,
        autoGeneratePlan: true,
      },
      {
        projectId: p3.id,
        modelId: "claude-opus-4-6",
        planModelId: "claude-opus-4-6",
        maxConcurrentTasks: 5,
        taskTimeoutSeconds: 600,
        maxRetriesPerTask: 3,
        requireApproval: true,
        autoGeneratePlan: false,
      },
    ]);

    // Insert Notifications (unread and read)
    await tx.insert(notifications).values([
      {
        userId: u2.id,
        type: "plan_approved",
        title: "Plan Approved",
        body: "Payment Gateway Integration plan has been approved.",
        linkUrl: `/specs/${s2.id}/plans/${plan1.id}`,
        actorUserId: u1.id,
        projectId: p1.id,
        resourceType: "plan",
        resourceId: String(plan1.id),
        readAt: new Date(Date.now() - 3600000),
      },
      {
        userId: u4.id,
        type: "changes_requested",
        title: "Changes Requested",
        body: "Please add accessibility considerations to the mobile redesign plan.",
        linkUrl: `/specs/${s3.id}/plans/${plan4.id}`,
        actorUserId: u1.id,
        projectId: p2.id,
        resourceType: "plan",
        resourceId: String(plan4.id),
      },
      {
        userId: u5.id,
        type: "task_blocked",
        title: "Task Blocked",
        body: "Create payment endpoints is waiting for API key approval.",
        linkUrl: `/tasks/${t5.id}`,
        actorUserId: u2.id,
        projectId: p1.id,
        resourceType: "task",
        resourceId: String(t5.id),
      },
      {
        userId: u2.id,
        type: "session_complete",
        title: "Session Complete",
        body: "Payment Gateway Integration has been completed successfully.",
        linkUrl: `/sessions/${session1.id}`,
        actorUserId: u2.id,
        projectId: p2.id,
        resourceType: "agent_session",
        resourceId: String(session1.id),
      },
      {
        userId: u1.id,
        type: "member_invited",
        title: "New Team Member",
        body: "Elena Rodriguez has been invited to Project Alpha.",
        linkUrl: `/projects/${p1.id}/members`,
        actorUserId: u1.id,
        projectId: p1.id,
        resourceType: "project_member",
        resourceId: String(u4.id),
      },
    ]);

    // Insert Notification Preferences
    const eventTypes = ["plan_generated", "plan_approved", "plan_rejected", "changes_requested", "session_complete", "session_failed", "task_blocked", "member_invited"];
    for (const user of [u1, u2, u4]) {
      for (const eventType of eventTypes) {
        await tx.insert(notificationPreferences).values({
          userId: user.id,
          eventType,
          emailEnabled: ["plan_approved", "plan_rejected", "session_failed", "task_blocked"].includes(eventType),
          inAppEnabled: true,
        }).onConflictDoNothing();
      }
    }

    // Invites
    await tx.insert(invites).values({
      projectId: p1.id,
      email: "newmember@example.com",
      role: "member",
      invitedBy: u1.id,
      token: "invite-" + nanoid(),
      expiresAt: new Date(Date.now() + 86400000 * 7),
    }).onConflictDoNothing();

    // Insert a few audit logs
    await tx.insert(auditLog).values([
      {
        projectId: p1.id,
        userId: u1.id,
        action: "project_created",
        targetType: "project",
        targetId: String(p1.id),
        detail: { name: "Project Alpha" },
        ipAddress: "192.168.1.100",
      },
      {
        projectId: p2.id,
        userId: u2.id,
        action: "spec_created",
        targetType: "specification",
        targetId: String(s2.id),
        detail: { name: "Payment Gateway Integration" },
        ipAddress: "192.168.1.101",
      },
      {
        projectId: p3.id,
        userId: u4.id,
        action: "plan_approved",
        targetType: "plan",
        targetId: String(plan1.id),
        detail: { planName: "Payment Gateway Integration Plan" },
        ipAddress: "192.168.1.102",
      },
    ]);

  });

  console.log("Seeding complete!");
  console.log("Test users:");
  console.log("  admin@example.com / password123 (admin)");
  console.log("  test@example.com / password123 (member)");
  console.log("  viewer@example.com / password123 (viewer)");
  console.log("  elena@example.com / password123 (owner)");
  console.log("  james@example.com / password123 (member)");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
