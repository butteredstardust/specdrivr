'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createPullRequestSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/rbac';
import { projectRepository } from '@/repositories/project-repository';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { auditRepository } from '@/repositories/audit-repository';
import { getGitHubConfig, createPullRequest } from '@/lib/github';

export async function createPullRequestAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    projectId: Number(formData.get('projectId')),
    sessionId: Number(formData.get('sessionId')),
    title: formData.get('title'),
    body: formData.get('body'),
    baseBranch: formData.get('baseBranch'),
    headBranch: formData.get('headBranch'),
  };

  const result = createPullRequestSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You must be a project admin to create pull requests' },
    };
  }

  try {
    const project = await projectRepository.getById(result.data.projectId);
    if (!project) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } };
    }

    const ghConfig = await getGitHubConfig(project.id);
    if (!ghConfig) {
      return {
        success: false,
        error: {
          code: 'PRECONDITION_FAILED',
          message: 'Project does not have GitHub integration configured',
        },
      };
    }

    const agentSession = await agentSessionRepository.getById(result.data.sessionId);
    if (!agentSession) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } };
    }

    const pr = await createPullRequest({
      token: ghConfig.token,
      repo: ghConfig.repo,
      title: result.data.title,
      head: result.data.headBranch,
      base: result.data.baseBranch,
      body:
        result.data.body || `Automatically generated from Specdrivr session #${agentSession.id}`,
    });

    await auditRepository.create({
      projectId: project.id,
      userId: session.user.id,
      action: 'create_github_pr',
      targetType: 'pull_request',
      targetId: String(pr.number),
      detail: { url: pr.html_url, title: pr.title },
    });

    await agentSessionRepository.addEvent({
      sessionId: agentSession.id,
      eventType: 'info',
      message: `Created GitHub Pull Request #${pr.number}: ${pr.html_url}`,
      metadata: { prUrl: pr.html_url, prNumber: pr.number },
    });

    revalidatePath(`/sessions/${agentSession.id}`);

    return { success: true, data: pr };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        projectId: result.data.projectId,
      },
      'Failed to create PR'
    );

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while creating the PR',
      },
    };
  }
}
