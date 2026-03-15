import 'server-only';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import { projectRepository } from '@/repositories/project-repository';
import { logger } from './logger';

/**
 * Retrieve GitHub config for a project from agent_config.
 * Returns null if not configured — never throws.
 */
export async function getGitHubConfig(projectId: number): Promise<{
  token: string;
  repo: string;
  branch: string;
  webhookSecret: string | null;
} | null> {
  try {
    const config = await projectRepository.getAgentConfig(projectId);

    if (!config || !config.githubToken || !config.githubRepo || !config.githubBranch) {
      logger.info(
        { projectId, tokenConfigured: !!config?.githubToken },
        'GitHub config not found or incomplete'
      );
      return null;
    }

    return {
      token: config.githubToken,
      repo: config.githubRepo,
      branch: config.githubBranch,
      webhookSecret: config.githubWebhookSecret,
    };
  } catch (error) {
    logger.error({ error, projectId }, 'Failed to retrieve GitHub config');
    return null;
  }
}

/**
 * Store or update GitHub config for a project.
 */
export async function setGitHubConfig(
  projectId: number,
  config: { token: string; repo: string; branch: string; webhookSecret?: string },
  actorId: string
): Promise<void> {
  try {
    await projectRepository.updateAgentConfig(
      projectId,
      {
        githubToken: config.token,
        githubRepo: config.repo,
        githubBranch: config.branch,
        githubWebhookSecret: config.webhookSecret || null,
      },
      actorId
    );

    logger.info({ projectId, tokenConfigured: true }, 'GitHub config updated');
  } catch (error) {
    logger.error({ error, projectId }, 'Failed to set GitHub config');
    throw error;
  }
}

/**
 * Remove GitHub config for a project (disconnect).
 */
export async function removeGitHubConfig(projectId: number, actorId: string): Promise<void> {
  try {
    await projectRepository.updateAgentConfig(
      projectId,
      {
        githubToken: null,
        githubRepo: null,
        githubBranch: 'main',
        githubWebhookSecret: null,
      },
      actorId
    );

    logger.info({ projectId }, 'GitHub config removed');
  } catch (error) {
    logger.error({ error, projectId }, 'Failed to remove GitHub config');
    throw error;
  }
}

/**
 * Returns: "daemon/spec-{specId}/task-{taskId}"
 */
export function getAgentBranchName(specId: string | number, taskId: string | number): string {
  return `daemon/spec-${specId}/task-${taskId}`;
}

/**
 * Returns: "feat(T-{externalId}): {taskTitle}"
 * Total commit message must not exceed 72 characters — truncate taskTitle if needed.
 */
export function getAgentCommitMessage(externalId: string, taskTitle: string): string {
  // Ensure we don't double-prefix T- if externalId already has it
  const cleanId = externalId.startsWith('T-') ? externalId.slice(2) : externalId;
  const prefix = `feat(T-${cleanId}): `;
  const maxLength = 72;

  if (prefix.length >= maxLength) {
    return prefix.slice(0, maxLength);
  }

  const remainingLength = maxLength - prefix.length;
  const truncatedTitle =
    taskTitle.length > remainingLength
      ? taskTitle.slice(0, Math.max(0, remainingLength - 3)) + '...'
      : taskTitle;

  return `${prefix}${truncatedTitle}`;
}

/**
 * Verifies the token before saving.
 */
export async function verifyGitHubToken(
  token: string
): Promise<{ valid: boolean; login?: string; error?: string }> {
  try {
    const octokit = new Octokit({
      auth: token,
      userAgent: 'Specdrivr/1.0',
    });

    const { data } = await octokit.users.getAuthenticated();
    return { valid: true, login: data.login };
  } catch (error: unknown) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid token' };
  }
}

/**
 * Verifies token has read/write access to the repo.
 */
export async function verifyRepoAccess(
  token: string,
  repo: string // format: "owner/repo-name"
): Promise<{ valid: boolean; error?: string }> {
  try {
    const parts = repo.split('/');
    const owner = parts[0];
    const name = parts[1];

    if (!owner || !name) {
      return { valid: false, error: 'Invalid repository format. Use "owner/repo-name"' };
    }

    const octokit = new Octokit({
      auth: token,
      userAgent: 'Specdrivr/1.0',
    });

    const { data } = await octokit.repos.get({ owner, repo: name });

    // Check permissions
    const canPush = data.permissions?.push;
    if (!canPush) {
      return { valid: false, error: 'Token does not have push access to this repository' };
    }

    return { valid: true };
  } catch (error: unknown) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to verify repository access',
    };
  }
}

/**
 * Verifies the HMAC signature from GitHub webhooks.
 */
export function verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Creates a Pull Request using the provided token.
 */
export async function createPullRequest(params: {
  token: string;
  repo: string; // format: "owner/repo-name"
  title: string;
  head: string;
  base: string;
  body?: string;
}) {
  const parts = params.repo.split('/');
  const owner = parts[0];
  const name = parts[1];

  if (!owner || !name) {
    throw new Error('Invalid repository format. Use "owner/repo-name"');
  }

  try {
    const octokit = new Octokit({
      auth: params.token,
      userAgent: 'Specdrivr/1.0',
    });

    const response = await octokit.pulls.create({
      owner,
      repo: name,
      title: params.title,
      head: params.head,
      base: params.base,
      body: params.body,
    });

    return response.data;
  } catch (error: unknown) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error), repo: params.repo },
      'Failed to create GitHub PR'
    );
    throw error;
  }
}
