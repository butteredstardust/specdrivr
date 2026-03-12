/* eslint-disable @typescript-eslint/no-unused-vars */
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

// Import repositories to use production logic for seeding
import { projectRepository } from "../src/repositories/project-repository";
import { specificationRepository } from "../src/repositories/specification-repository";
import { planRepository } from "../src/repositories/plan-repository";
import { memberRepository } from "../src/repositories/member-repository";
import { taskRepository } from "../src/repositories/task-repository";

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(queryClient, { schema });

// Better-auth uses scrypt with these parameters:
const scryptParams = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

async function scryptHash(password: string): Promise<string> {
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const salt = Buffer.from(saltBuf).toString("hex");
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

  console.log("Seeding database using repository logic...");

  const passwordHash = await scryptHash("password123");

  // 1. Create Users (Direct insert as users don't have a repo-based 'create' with Better Auth sync yet)
  const u1 = (await db.insert(users).values({ id: nanoid(), name: "Admin User", email: "admin@example.com", role: "admin", emailVerified: true }).returning())[0];
  const u2 = (await db.insert(users).values({ id: nanoid(), name: "Test User", email: "test@example.com", role: "member", emailVerified: true }).returning())[0];
  const u3 = (await db.insert(users).values({ id: nanoid(), name: "Viewer User", email: "viewer@example.com", role: "viewer", emailVerified: true }).returning())[0];
  const u4 = (await db.insert(users).values({ id: nanoid(), name: "Elena Rodriguez", email: "elena@example.com", role: "owner", emailVerified: true }).returning())[0];

  await db.insert(accounts).values([
    { id: nanoid(), accountId: u1.id, providerId: "credential", userId: u1.id, password: passwordHash },
    { id: nanoid(), accountId: u2.id, providerId: "credential", userId: u2.id, password: passwordHash },
    { id: nanoid(), accountId: u3.id, providerId: "credential", userId: u3.id, password: passwordHash },
    { id: nanoid(), accountId: u4.id, providerId: "credential", userId: u4.id, password: passwordHash },
  ]);

  // 2. Create Projects (Using ProjectRepository to get automatic agentConfig and owner assignment)
  const p1 = await projectRepository.create({ name: "Project Alpha", description: "enterprise integration", createdBy: u1.id });
  const p2 = await projectRepository.create({ name: "Project Beta", description: "mobile applications", createdBy: u2.id });
  const p3 = await projectRepository.create({ name: "Project Gamma", description: "AI-powered analytics", createdBy: u4.id });

  // 3. Add Members (Using MemberRepository for audit logs)
  await memberRepository.createInvite({ projectId: p1.id, email: "collab@example.com", role: "member", invitedBy: u1.id });
  await db.insert(projectMembers).values({ projectId: p1.id, userId: u2.id, role: "admin", status: "active" });

  // 4. Create Specifications (Using SpecificationRepository for atomic versioning and audit logs)
  const s1 = await specificationRepository.createWithVersion({
    projectId: p1.id,
    name: "User Authentication System",
    markdownContent: "# Auth Spec\n\nInitial version for authentication system.",
    createdBy: u1.id
  });

  const s2 = await specificationRepository.createWithVersion({
    projectId: p1.id,
    name: "Payment Gateway Integration",
    markdownContent: "# Payment Spec\n\nInitial payment integration specification.",
    createdBy: u2.id
  });

  const s3 = await specificationRepository.createWithVersion({
    projectId: p2.id,
    name: "Mobile App Redesign",
    markdownContent: "# Mobile Spec\n\nModern UI components.",
    createdBy: u4.id
  });

  // 5. Add a second version to s1 (This will test version incrementing)
  await specificationRepository.addVersion({
    specId: s1.id,
    markdownContent: "# Auth Spec v2\n\nUpdated with OAuth2 provider support.",
    createdBy: u1.id
  });

  // 6. Create and Approve Plans (Using PlanRepository for sessions and spec status updates)
  // Direct insert first because we don't have a plan generator repo yet
  const [rawPlan1] = await db.insert(plans).values({
    specId: s2.id,
    specVersionId: s2.currentVersionId,
    status: "pending_approval",
    markdownContent: "# Payment Plan\n\nImplement Stripe.",
    taskCount: 2,
    createdBy: u2.id
  }).returning();

  // Use the repository to approve it (this creates the session and updates spec status)
  await planRepository.approvePlan({
    planId: rawPlan1.id,
    userId: u1.id,
    notes: "Looks good, proceed."
  });

  // 7. Seed Tasks for the approved plan
  const t1 = await taskRepository.create({
    externalId: "T-101",
    title: "Stripe Setup",
    description: "Install Stripe SDK",
    planId: rawPlan1.id,
    status: "done"
  });

  const t2 = await taskRepository.create({
    externalId: "T-102",
    title: "API Endpoints",
    description: "Create payment routes",
    planId: rawPlan1.id,
    status: "todo"
  });

  // 8. Test the 'unblock' logic in seeding
  const t3 = await taskRepository.create({
    externalId: "T-103",
    title: "Webhooks",
    description: "Handle stripe events",
    planId: rawPlan1.id,
    status: "blocked"
  });
  await db.update(tasks).set({ blockedReason: "Waiting for domain verification" }).where(sql`id = ${t3.id}`);
  await taskRepository.unblockTask(t3.id, "Domain is now verified.", u1.id);

  console.log("Seeding complete!");
  console.log("Test users:");
  console.log("  admin@example.com / password123 (admin)");
  console.log("  test@example.com / password123 (member)");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
