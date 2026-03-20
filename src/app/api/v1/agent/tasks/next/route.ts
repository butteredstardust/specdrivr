import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { handleApiError } from '@/lib/error-handler';
import { taskRepository, agentConfigRepository } from '@/repositories';
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

    const { searchParams } = new URL(request.url);
    const sessionIdStr = searchParams.get('sessionId');

    if (!sessionIdStr) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'sessionId is required' } },
        { status: 400 }
      );
    }

    const sessionId = parseInt(sessionIdStr);

    const nextTask = await taskRepository.claimNextTaskForProject(agentToken.projectId, sessionId);

    if (!nextTask) {
      return NextResponse.json({ data: null });
    }

    const agentConfig = await agentConfigRepository.getByProjectId(agentToken.projectId);

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
        agentConfig: agentConfig
          ? {
              backend: agentConfig.backend,
              geminiApiKey: agentConfig.geminiApiKey,
              claudeApiKey: agentConfig.claudeApiKey,
            }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
