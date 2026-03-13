import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  webhookDeliveries,
  agentLogs,
  notifications,
  projectMembers,
  tasks,
  auditLog,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyGitHubSignature, getGitHubConfig } from '@/lib/github';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.projectId, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid project ID' } },
        { status: 400 }
      );
    }

    // 1. Read raw body as text for HMAC validation
    const rawBody = await request.text();
    const event = request.headers.get('x-github-event') || 'unknown';
    const signature = request.headers.get('x-hub-signature-256') || '';

    // 2. Fetch GitHub config to get the secret
    const ghConfig = await getGitHubConfig(projectId);

    // 3. HMAC validation (if secret is configured)
    if (ghConfig?.webhookSecret) {
      if (!signature) {
        logger.warn({ projectId, event }, 'Missing GitHub webhook signature');
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Missing signature' } },
          { status: 401 }
        );
      }

      const isValid = verifyGitHubSignature(rawBody, signature, ghConfig.webhookSecret);
      if (!isValid) {
        logger.warn({ projectId, event }, 'Invalid GitHub webhook signature');
        return NextResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid signature' } },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(rawBody);

    // 4. Log delivery to database
    await db.insert(webhookDeliveries).values({
      projectId: projectId,
      eventType: event,
      payload: payload,
      status: 'delivered',
      deliveredAt: new Date(),
    });

    // 5. Handle events
    if (event === 'push') {
      await handlePush(projectId, payload, ghConfig?.branch || 'main');
    } else if (event === 'pull_request') {
      await handlePullRequest(projectId, payload);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ error }, 'GitHub webhook processing failed');
    return NextResponse.json({ received: true });
  }
}

async function handlePush(
  projectId: number,
  payload: { ref?: string; pusher?: { name?: string }; commits?: { message: string }[] },
  watchedBranch: string
) {
  const ref = payload.ref || '';
  const branch = ref.replace('refs/heads/', '');

  if (branch !== watchedBranch) {
    return;
  }

  const pusher = payload.pusher?.name || 'unknown';
  const commits = payload.commits || [];
  const commitCount = commits.length;

  // 1. Try to find a task ID from commit messages or branch name
  let taskId: number | null = null;
  const branchMatch = branch.match(/task-(\d+)/i);
  if (branchMatch) {
    taskId = parseInt(branchMatch[1], 10);
  }

  if (!taskId) {
    for (const commit of commits) {
      const msgMatch = commit.message.match(/\bT-(\d+)\b/i);
      if (msgMatch) {
        // Find task by external ID
        const [task] = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(eq(tasks.externalId, `T-${msgMatch[1]}`))
          .limit(1);
        if (task) {
          taskId = task.id;
          break;
        }
      }
    }
  }

  // 2. Log to agent_logs (if taskId found) or audit_log
  if (taskId) {
    await db.insert(agentLogs).values({
      projectId,
      taskId,
      level: 'info',
      message: `GitHub Push: ${branch} by ${pusher} (${commitCount} commits)`,
      context: { pusher, branch, commitCount },
    });
  } else {
    await db.insert(auditLog).values({
      projectId,
      action: 'github_push',
      targetType: 'project',
      targetId: String(projectId),
      detail: { pusher, branch, commitCount },
    });
  }

  // 3. Notify project members
  const members = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  const title = `New push to ${branch}`;
  const body = `Pushed by ${pusher} (${commitCount} commits)`;

  for (const member of members) {
    await db.insert(notifications).values({
      userId: member.userId,
      projectId: projectId,
      type: 'github_push',
      title,
      body,
      linkUrl: `/projects/${projectId}/activity`,
    });
  }
}

async function handlePullRequest(
  projectId: number,
  payload: {
    action: string;
    pull_request?: { number: number; title: string; body: string; html_url: string };
  }
) {
  const action = payload.action;
  if (action !== 'opened' && action !== 'synchronize') {
    return;
  }

  const pr = payload.pull_request;
  if (!pr) return;

  const prTitle = pr.title || '';
  const prBody = pr.body || '';
  const fullText = `${prTitle} ${prBody}`;

  const specMatch = fullText.match(/spec[-_]?(\w+)/i);

  if (specMatch) {
    const specRef = specMatch[1];

    // Notify project members
    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    const title = `PR #${pr.number} references spec ${specRef}`;
    const body = `PR: "${prTitle}"`;

    for (const member of members) {
      await db.insert(notifications).values({
        userId: member.userId,
        projectId: projectId,
        type: 'github_pr',
        title,
        body,
        linkUrl: pr.html_url || `/projects/${projectId}`,
      });
    }

    // Log to audit log
    await db.insert(auditLog).values({
      projectId,
      action: 'github_pr_spec_ref',
      targetType: 'pull_request',
      targetId: String(pr.number),
      detail: { prTitle, specRef, url: pr.html_url },
    });
  }
}
