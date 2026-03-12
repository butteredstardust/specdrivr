import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, webhookDeliveries, gitCommits, tasks, auditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { handleApiError } from '@/lib/error-handler';
import { githubService } from '@/lib/github';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const rawBody = await request.text();
  const event = request.headers.get('x-github-event') || 'unknown';
  const signature = request.headers.get('x-hub-signature-256') || '';

  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.projectId, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } }, { status: 400 });
    }

    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, { status: 404 });
    }

    // 1. Verify Signature (if secret is configured for the project)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = githubService.verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        logger.warn({ projectId, event }, 'Invalid GitHub webhook signature');
        return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // 2. Log delivery
    await db.insert(webhookDeliveries).values({
      projectId: project.id,
      eventType: event,
      payload: payload,
      status: 'delivered',
      deliveredAt: new Date(),
    });

    // 3. Process Events
    if (event === 'push') {
      await handlePushEvent(project.id, payload);
    } else if (event === 'pull_request') {
      await handlePullRequestEvent(project.id, payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

async function handlePushEvent(projectId: number, payload: { ref: string; commits: { id: string; message: string; timestamp: string; author?: { name?: string; username?: string } }[] }) {
  const branch = payload.ref.replace('refs/heads/', '');
  const commits = payload.commits || [];

  for (const commit of commits) {
    // Regex to find task ID like T-101 or T-42
    const taskMatch = commit.message.match(/\bT-(\d+)\b/i);
    let taskId: number | null = null;

    if (taskMatch) {
      const externalId = `T-${taskMatch[1]}`;
      const [task] = await db.select()
        .from(tasks)
        .innerJoin(projects, eq(tasks.planId, projects.id)) 
        .where(eq(tasks.externalId, externalId))
        .limit(1);
      
      if (task) {
        taskId = task.tasks.id;
      }
    }

    await db.insert(gitCommits).values({
      projectId,
      taskId,
      commitSha: commit.id,
      branch,
      message: commit.message,
      author: commit.author?.name || commit.author?.username,
      committedAt: new Date(commit.timestamp),
    });

    if (taskId) {
      await db.insert(auditLog).values({
        projectId,
        action: 'github_commit_linked',
        targetType: 'task',
        targetId: String(taskId),
        detail: { sha: commit.id, message: commit.message },
      });
    }
  }
}

async function handlePullRequestEvent(projectId: number, payload: { action: string; pull_request?: { number: number; title: string; html_url: string } }) {
  const action = payload.action;
  const pr = payload.pull_request;

  if (!pr) return;

  await db.insert(auditLog).values({
    projectId,
    action: `github_pr_${action}`,
    targetType: 'pull_request',
    targetId: String(pr.number),
    detail: { title: pr.title, url: pr.html_url },
  });
}
