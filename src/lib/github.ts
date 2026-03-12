import 'server-only';
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';
import { logger } from './logger';
import { env } from './env';

export class GithubService {
  private octokit: Octokit | null = null;

  constructor() {
    const token = env.GITHUB_TOKEN;
    if (token) {
      this.octokit = new Octokit({ auth: token });
    } else {
      logger.warn('GITHUB_TOKEN not found in environment. GitHub features will be limited.');
    }
  }
  /**
   * Verifies the HMAC signature from GitHub webhooks.
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  }

  /**
   * Parses a repository URL into owner and repo name.
   * Supports: 
   * - https://github.com/owner/repo
   * - git@github.com:owner/repo.git
   */
  parseRepoUrl(url: string): { owner: string; repo: string } | null {
    try {
      const cleanUrl = url.replace(/\.git$/, '');
      if (cleanUrl.startsWith('http')) {
        const parts = new URL(cleanUrl).pathname.split('/').filter(Boolean);
        return { owner: parts[0], repo: parts[1] };
      } else if (cleanUrl.startsWith('git@')) {
        const parts = cleanUrl.split(':')[1].split('/');
        return { owner: parts[0], repo: parts[1] };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Creates a Pull Request.
   */
  async createPullRequest(params: {
    repoUrl: string;
    title: string;
    head: string;
    base: string;
    body?: string;
  }) {
    if (!this.octokit) throw new Error('GithubService not initialized (missing token)');

    const repoInfo = this.parseRepoUrl(params.repoUrl);
    if (!repoInfo) throw new Error(`Invalid repository URL: ${params.repoUrl}`);

    try {
      const response = await this.octokit.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title: params.title,
        head: params.head,
        base: params.base,
        body: params.body,
      });

      return response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ error: message, repo: params.repoUrl }, 'Failed to create GitHub PR');
      throw error;
    }
  }

  /**
   * Fetches the default branch of a repository.
   */
  async getDefaultBranch(repoUrl: string): Promise<string> {
    if (!this.octokit) return 'main';

    const repoInfo = this.parseRepoUrl(repoUrl);
    if (!repoInfo) return 'main';

    try {
      const response = await this.octokit.repos.get({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
      });
      return response.data.default_branch;
    } catch {
      return 'main';
    }
  }
}

export const githubService = new GithubService();
