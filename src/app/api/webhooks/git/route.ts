import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { gitCommits, projects, tasks } from '@/db/schema';
import { validateAgentToken, getUnauthorizedResponse } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const gitWebhookSchema = z.object({
  project_id: z.number().int(),
  task_id: z.number().int().nullable(),
  plan_id: z.number().int().nullable(),
  commit_sha: z.string().length(40),
  branch: z.string(),
  message: z.string(),
  author: z.string(),
  committed_at: z.string().datetime(),
  metadata: z.object({
    files_changed: z.array(z.string()).default([]),
    lines_added: z.number().default(0),
    lines_removed: z.number().default(0),
    repo_url: z.string().url().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  if (!validateAgentToken(request)) {
    return getUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const result = gitWebhookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check rate limits & idempotency
    const existingCommit = await db.query.gitCommits.findFirst({
      where: eq(gitCommits.commitSha, data.commit_sha)
    });

    if (existingCommit) {
      return NextResponse.json({ ok: true, commit_id: existingCommit.id });
    }

    const [newCommit] = await db.insert(gitCommits).values({
      projectId: data.project_id,
      taskId: data.task_id,
      planId: data.plan_id,
      commitSha: data.commit_sha,
      branch: data.branch,
      message: data.message,
      author: data.author,
      committedAt: new Date(data.committed_at),
      metadata: data.metadata || {}
    }).returning();

    if (data.task_id) {
      const task = await db.query.tasks.findFirst({ where: eq(tasks.id, data.task_id) });
      if (task) {
        const notes = task.notes ? `${task.notes}\nCommit: ${data.commit_sha}` : `Commit: ${data.commit_sha}`;
        await db.update(tasks).set({ notes }).where(eq(tasks.id, data.task_id));
      }
    }

    return NextResponse.json({ ok: true, commit_id: newCommit.id });
  } catch (error) {
    console.error('Git webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}