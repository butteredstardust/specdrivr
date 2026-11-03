/**
 * Variables that bind git to one repository instead of the repository at the
 * process cwd. Git hooks export them (from a linked worktree GIT_DIR is
 * absolute), so a child git process that inherits them works on the wrong
 * repository. The list is `git rev-parse --local-env-vars`, plus ref and
 * quarantine redirects.
 *
 * GIT_CONFIG_COUNT and its GIT_CONFIG_KEY_n / GIT_CONFIG_VALUE_n entries are
 * not in the list: they carry configuration, not a repository location.
 */
export const GIT_REPOSITORY_CONTEXT_VARS: readonly string[] = Object.freeze([
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_CONFIG',
  'GIT_CONFIG_PARAMETERS',
  'GIT_DIR',
  'GIT_GRAFT_FILE',
  'GIT_IMPLICIT_WORK_TREE',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_NO_REPLACE_OBJECTS',
  'GIT_OBJECT_DIRECTORY',
  'GIT_PREFIX',
  'GIT_QUARANTINE_PATH',
  'GIT_REPLACE_REF_BASE',
  'GIT_SHALLOW_FILE',
  'GIT_WORK_TREE',
]);

const CONTEXT_VARS = new Set(GIT_REPOSITORY_CONTEXT_VARS);

/**
 * Returns a copy of `env` without the repository context variables, so git
 * resolves the repository from its cwd. Credential, SSH, editor and
 * GIT_EXEC_PATH variables stay. The input is not changed.
 */
export function withoutGitRepositoryContext(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const clean = { ...env };
  for (const name of CONTEXT_VARS) delete clean[name];
  return clean;
}
