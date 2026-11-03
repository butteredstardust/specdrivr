import { describe, it, expect } from 'vitest';
import { GIT_REPOSITORY_CONTEXT_VARS, withoutGitRepositoryContext } from '@/lib/git-env';

describe('withoutGitRepositoryContext', () => {
  it('removes every repository context variable', () => {
    const env = Object.fromEntries(GIT_REPOSITORY_CONTEXT_VARS.map((name) => [name, 'x']));
    expect(withoutGitRepositoryContext(env)).toEqual({});
  });

  it('keeps config, credential and other variables', () => {
    const env = {
      PATH: '/usr/bin',
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.abbrev',
      GIT_CONFIG_VALUE_0: '12',
      GIT_ASKPASS: '/bin/askpass',
      GIT_SSH_COMMAND: 'ssh -i key',
      GIT_EDITOR: 'vi',
      GIT_EXEC_PATH: '/usr/libexec/git-core',
      GIT_TERMINAL_PROMPT: '0',
    };
    expect(withoutGitRepositoryContext({ ...env, GIT_DIR: '/r/.git' })).toEqual(env);
  });

  it('does not change the input', () => {
    const env = { GIT_DIR: '/r/.git', PATH: '/usr/bin' };
    withoutGitRepositoryContext(env);
    expect(env).toEqual({ GIT_DIR: '/r/.git', PATH: '/usr/bin' });
  });

  it('exports a list that cannot be changed', () => {
    expect(Object.isFrozen(GIT_REPOSITORY_CONTEXT_VARS)).toBe(true);
  });
});
