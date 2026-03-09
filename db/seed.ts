import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, projects, specifications, plans, tasks, invites, agentSessions, taskAttempts } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { env } from "../src/lib/env";
import * as schema from "../src/db/schema";

const queryClient = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(queryClient, { schema });

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  await db.transaction(async (tx) => {
    // Insert Users
    const u1 = (await tx.insert(users).values({
      username: "alice@example.com",
      passwordHash,
      role: "admin",
    }).returning().onConflictDoNothing())[0] || (await tx.select().from(users).where(sql`username = 'alice@example.com'`))[0];

    const u2 = (await tx.insert(users).values({
      username: "bob@example.com",
      passwordHash,
      role: "developer",
    }).returning().onConflictDoNothing())[0] || (await tx.select().from(users).where(sql`username = 'bob@example.com'`))[0];

    await tx.insert(users).values({
      username: "charlie@example.com",
      passwordHash,
      role: "viewer",
    }).returning().onConflictDoNothing();

    // Insert Projects
    const p1 = (await tx.insert(projects).values({
      name: "Project Alpha",
      slug: "project-alpha",
      description: "A highly classified project.",
      createdByUserId: u1.id,
      createdBy: u1.id,
    }).returning().onConflictDoNothing())[0] || (await tx.select().from(projects).where(sql`slug = 'project-alpha'`))[0];

    const p2 = (await tx.insert(projects).values({
      name: "Project Beta",
      slug: "project-beta",
      description: "Another great project.",
      createdByUserId: u2.id,
      createdBy: u2.id,
    }).returning().onConflictDoNothing())[0] || (await tx.select().from(projects).where(sql`slug = 'project-beta'`))[0];

    // Invites
    await tx.insert(invites).values({
      projectId: p1.id,
      email: "david@example.com",
      role: "developer",
      invitedBy: u1.id,
      expiresAt: new Date(Date.now() + 86400000), // 1 day
    }).onConflictDoNothing();

    // Specs
    const s1 = (await tx.insert(specifications).values({ projectId: p1.id, content: "Spec 001 content", version: "1.0", createdByUserId: u1.id }).returning().onConflictDoNothing())[0];
    const s2 = (await tx.insert(specifications).values({ projectId: p1.id, content: "Spec 002 content", version: "1.0", createdByUserId: u1.id }).returning().onConflictDoNothing())[0];
    await tx.insert(specifications).values({ projectId: p1.id, content: "Spec 003 content", version: "1.0", createdByUserId: u1.id }).returning().onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p2.id, content: "Spec 004 content", version: "1.0", createdByUserId: u2.id }).returning().onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p2.id, content: "Spec 005 content", version: "1.0", createdByUserId: u2.id }).returning().onConflictDoNothing();
    await tx.insert(specifications).values({ projectId: p2.id, content: "Spec 006 content", version: "1.0", createdByUserId: u2.id }).returning().onConflictDoNothing();

    // Plans
    const plan1 = (await tx.insert(plans).values({ specId: s1.id, intent: "Plan 1", status: "pending_approval" as never, createdByUserId: u1.id }).returning().onConflictDoNothing())[0];
    const plan2 = (await tx.insert(plans).values({ specId: s2.id, intent: "Plan 2", status: "active" as never, createdByUserId: u1.id }).returning().onConflictDoNothing())[0];
    await tx.insert(plans).values({ specId: s1.id, intent: "Plan 3", status: "completed" as never, createdByUserId: u1.id }).returning().onConflictDoNothing();
    await tx.insert(plans).values({ specId: s1.id, intent: "Plan 4", status: "draft" as never, createdByUserId: u2.id }).returning().onConflictDoNothing();

    // Tasks
    const task1 = (await tx.insert(tasks).values({
      planId: plan2.id,
      description: "Task 105",
      status: "blocked",
      blockedReason: "Waiting for external API to be updated.",
      createdByUserId: u1.id,
    }).returning().onConflictDoNothing())[0];

    await tx.insert(tasks).values({
      planId: plan1.id,
      description: "Task 101",
      status: "todo",
      createdByUserId: u1.id,
    }).onConflictDoNothing();

    // Task Attempts
    await tx.insert(taskAttempts).values({
      taskId: task1.id,
      seq: 1,
      logLines: [],
    }).onConflictDoNothing();

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
