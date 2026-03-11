import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, projects, specifications, plans, tasks, invites, agentSessions, taskAttempts } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { env } from "../src/lib/env-script";
import * as schema from "../src/db/schema";

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(queryClient, { schema });

async function main() {
  console.log("Cleaning database...");
  await db.transaction(async (tx) => {
    // Delete in reverse order of dependencies
    await tx.delete(taskAttempts);
    await tx.delete(agentSessions);
    await tx.delete(tasks);
    await tx.delete(plans);
    await tx.delete(specifications);
    await tx.delete(invites);
    await tx.delete(projects);
    await tx.delete(users);
  });

  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  await db.transaction(async (tx) => {
    // Insert Users
    await tx.insert(users).values({
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "admin",
      emailVerified: true,
    });

    await tx.insert(users).values({
      name: "Test User",
      email: "test@example.com",
      passwordHash,
      role: "member",
      emailVerified: true,
    });

    await tx.insert(users).values({
      name: "Viewer",
      email: "viewer@example.com",
      passwordHash,
      role: "viewer",
      emailVerified: true,
    });

    // Get the users
    const [u1] = await tx.select().from(users).where(sql`email = 'admin@example.com'`).limit(1);
    const [u2] = await tx.select().from(users).where(sql`email = 'test@example.com'`).limit(1);

    if (!u1 || !u2) {
      return; // Skip rest of seed if users don't exist
    }

    // Insert Projects (idempotent)
    await tx.insert(projects).values({
      name: "Project Alpha",
      slug: "project-alpha",
      description: "A highly classified project.",
      createdBy: u1.id,
    }).onConflictDoNothing();

    await tx.insert(projects).values({
      name: "Project Beta",
      slug: "project-beta",
      description: "Another great project.",
      createdBy: u2.id,
    }).onConflictDoNothing();

    // Get the projects
    const [p1] = await tx.select().from(projects).where(sql`slug = 'project-alpha'`).limit(1);
    const [p2] = await tx.select().from(projects).where(sql`slug = 'project-beta'`).limit(1);

    if (!p1 || !p2) {
      return;
    }

    // Invites
    await tx.insert(invites).values({
      projectId: p1.id,
      email: "david@example.com",
      role: "member",
      invitedBy: u1.id,
      token: "dummy-token-123",
      expiresAt: new Date(Date.now() + 86400000), // 1 day
    }).onConflictDoNothing();

    // Specs (idempotent)
    await tx.insert(specifications).values({ projectId: p1.id, name: "Spec 001", createdBy: u1.id }).onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p1.id, name: "Spec 002", createdBy: u1.id }).onConflictDoNothing();

    // Get specs for the projects
    const s1 = (await tx.select().from(specifications).where(sql`project_id = ${p1.id} AND name = 'Spec 001'`).limit(1))[0];
    const s2 = (await tx.select().from(specifications).where(sql`project_id = ${p1.id} AND name = 'Spec 002'`).limit(1))[0];

    if (!s1 || !s2) {
      return;
    }

    // Plans
    const plan1 = (await tx.insert(plans).values({ specId: s1!.id, markdownContent: "Plan 1", status: "pending_approval", createdBy: u1.id }).returning().onConflictDoNothing()).at(0);
    const plan2 = (await tx.insert(plans).values({ specId: s2!.id, markdownContent: "Plan 2", status: "approved", createdBy: u1.id }).returning().onConflictDoNothing()).at(0);
    if (!plan2) throw new Error("Failed to create or get plan2");

    // Tasks
    const task1Insert = await tx.insert(tasks).values({
      planId: plan2!.id,
      title: "Task 105",
      externalId: "T-105",
      description: "Task 105 desc",
      status: "blocked",
      blockedReason: "Waiting for external API to be updated.",
    }).returning().onConflictDoNothing();
    const task1 = task1Insert.at(0);
    if (!task1) throw new Error("Failed to create task1");

    await tx.insert(tasks).values({
      planId: plan1!.id,
      title: "Task 101",
      externalId: "T-101",
      description: "Task 101 desc",
      status: "todo",
    }).onConflictDoNothing();

    // Task Attempts - only insert if task1 was created
    if (task1) {
      await tx.insert(taskAttempts).values({
        taskId: task1.id,
        seq: 1,
        logLines: [],
      }).onConflictDoNothing();
    }

    // Agent Session
    await tx.insert(agentSessions).values({
      projectId: p1.id,
      planId: plan2.id,
      status: "running",
    }).onConflictDoNothing();

  });

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
