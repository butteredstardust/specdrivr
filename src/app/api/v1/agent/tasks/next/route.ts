import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { handleApiError } from '@/lib/error-handler';
import { taskRepository } from '@/repositories/task-repository';
import { getGitHubConfig, getAgentBranchName, getAgentCommitMessage } from '@/lib/github';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const authResult = await verifyAgentToken(request.headers.get('Authorization'));
  if (!authResult.success) {
    return authResult.response;
  }

  const agentToken = authResult.token;

  try {
    if (!agentToken.projectId) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Token not associated with a project' } },
        { status: 500 }
      );
    }

    const nextTask = await taskRepository.claimNextTaskForProject(agentToken.projectId);

    if (!nextTask) {
      return NextResponse.json({ data: null });
    }

    let githubConfig = null;
    const ghConfig = await getGitHubConfig(agentToken.projectId);

    if (ghConfig) {
      githubConfig = {
        token: ghConfig.token,
        repo: ghConfig.repo,
        branch: ghConfig.branch,
        branchName: getAgentBranchName(nextTask.specId || '0', nextTask.id),
        commitMessage: getAgentCommitMessage(nextTask.externalId, nextTask.title),
      };
    }

    logger.info(
      {
        projectId: agentToken.projectId,
        taskId: nextTask.id,
        githubConfigIncluded: !!githubConfig,
      },
      'Agent claimed next task'
    );

    return NextResponse.json({
      data: {
        ...nextTask,
        githubConfig,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
