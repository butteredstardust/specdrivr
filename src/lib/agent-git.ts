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
export function runGit(args: string[], options: { cwd?: string } = {}): string {
  try {
    return execFileSync('git', args, {
      cwd: options.cwd,
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
