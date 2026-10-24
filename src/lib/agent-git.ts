import { execFileSync } from 'child_process';

const GIT_CREDENTIAL_PATTERN = /(https?:\/\/)[^@\s/]+@/g;

/**
 * Removes credentials embedded in remote URLs (the user and token before `@`)
 * so git errors can be logged safely.
 */
export function redactGitCredentials(text: string): string {
  return text.replace(GIT_CREDENTIAL_PATTERN, '$1***@');
}

/**
 * Runs git with an argument vector, never through a shell, so task titles,
 * branch names and commit messages are passed verbatim. Errors are redacted.
 */
export function runGit(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): string {
  try {
    return execFileSync('git', args, {
      cwd: options.cwd,
      env: options.env,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new Error(
      redactGitCredentials(`Git command failed: git ${args.join(' ')} - ${String(err)}`)
    );
  }
}

const SAFE_GIT_REF = /^(?!-)(?!.*\.\.)[A-Za-z0-9._/-]+$/;
const SAFE_REPO_SLUG = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

/**
 * Accepts branch names that git cannot read as an option and that cannot
 * escape the ref namespace (no leading '-', no '..').
 */
export function isSafeGitRef(ref: string): boolean {
  return SAFE_GIT_REF.test(ref);
}

/** Accepts `owner/name` GitHub slugs only, so a token is never sent to another host. */
export function isSafeRepoSlug(repo: string): boolean {
  return (
    SAFE_REPO_SLUG.test(repo) && !repo.split('/').some((part) => part === '..' || part === '.')
  );
}

/**
 * Returns an environment that makes git send the token as an HTTP auth header for
 * github.com only. The token never appears in the remote URL, the argument vector
 * (visible in `ps`) or git error output, and git does not persist it to .git/config.
 */
export function githubAuthEnv(token: string, baseEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const basic = Buffer.from(`x-access-token:${token}`).toString('base64');
  return {
    ...baseEnv,
    GIT_TERMINAL_PROMPT: '0',
    // An empty value first clears any extraheader inherited from the user's git config.
    GIT_CONFIG_COUNT: '2',
    GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_0: '',
    GIT_CONFIG_KEY_1: 'http.https://github.com/.extraheader',
    GIT_CONFIG_VALUE_1: `AUTHORIZATION: basic ${basic}`,
  };
}
