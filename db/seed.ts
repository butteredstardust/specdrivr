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
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  await db.transaction(async (tx) => {
    // Insert Users (idempotent)
    await tx.insert(users).values({
      username: "alice@example.com",
      passwordHash,
      role: "admin",
    }).onConflictDoNothing();

    await tx.insert(users).values({
      username: "bob@example.com",
      passwordHash,
      role: "developer",
    }).onConflictDoNothing();

    await tx.insert(users).values({
      username: "charlie@example.com",
      passwordHash,
      role: "viewer",
    }).onConflictDoNothing();

    // Get the users (whether newly inserted or existing)
    const [u1] = await tx.select().from(users).where(sql`username = 'alice@example.com'`).limit(1);
    const [u2] = await tx.select().from(users).where(sql`username = 'bob@example.com'`).limit(1);

    if (!u1 || !u2) {
      return; // Skip rest of seed if users don't exist
    }

    // Note: charlie@example.com already inserted above

    // Insert Projects (idempotent)
    await tx.insert(projects).values({
      name: "Project Alpha",
      slug: "project-alpha",
      description: "A highly classified project.",
      createdByUserId: u1.id,
      createdBy: u1.id,
    }).onConflictDoNothing();

    await tx.insert(projects).values({
      name: "Project Beta",
      slug: "project-beta",
      description: "Another great project.",
      createdByUserId: u2.id,
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
      role: "developer",
      invitedBy: u1.id,
      expiresAt: new Date(Date.now() + 86400000), // 1 day
    }).onConflictDoNothing();

    // Specs (idempotent)
    await tx.insert(specifications).values({ projectId: p1.id, content: "Spec 001 content", version: "1.0", createdByUserId: u1.id }).onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p1.id, content: "Spec 002 content", version: "1.0", createdByUserId: u1.id }).onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p1.id, content: "Spec 003 content", version: "1.0", createdByUserId: u1.id }).onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p2.id, content: "Spec 004 content", version: "1.0", createdByUserId: u2.id }).onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p2.id, content: "Spec 005 content", version: "1.0", createdByUserId: u2.id }).onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p2.id, content: "Spec 006 content", version: "1.0", createdByUserId: u2.id }).onConflictDoNothing();

    // Get specs for the projects
    const s1 = (await tx.select().from(specifications).where(sql`project_id = ${p1.id} AND content = 'Spec 001 content'`).limit(1))[0];
    const s2 = (await tx.select().from(specifications).where(sql`project_id = ${p1.id} AND content = 'Spec 002 content'`).limit(1))[0];

    if (!s1 || !s2) {
      return;
    }

    // Plans
    const plan1 = (await tx.insert(plans).values({ specId: s1!.id, intent: "Plan 1", status: "pending_approval" as never, createdByUserId: u1.id }).returning().onConflictDoNothing()).at(0);
    const plan2 = (await tx.insert(plans).values({ specId: s2!.id, intent: "Plan 2", status: "active" as never, createdByUserId: u1.id }).returning().onConflictDoNothing()).at(0);
    if (!plan2) throw new Error("Failed to create or get plan2");
    await tx.insert(plans).values({ specId: s1.id, intent: "Plan 3", status: "completed" as never, createdByUserId: u1.id }).returning().onConflictDoNothing();
    await tx.insert(plans).values({ specId: s1.id, intent: "Plan 4", status: "draft" as never, createdByUserId: u2.id }).returning().onConflictDoNothing();

    // Tasks
    const task1Insert = await tx.insert(tasks).values({
      planId: plan2!.id,
      description: "Task 105",
      status: "blocked",
      blockedReason: "Waiting for external API to be updated.",
      createdByUserId: u1.id,
    }).returning().onConflictDoNothing();
    const task1 = task1Insert.at(0);
    if (!task1) throw new Error("Failed to create task1");

    await tx.insert(tasks).values({
      planId: plan1!.id,
      description: "Task 101",
      status: "todo",
      createdByUserId: u1.id,
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
