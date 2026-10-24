import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  githubAuthEnv,
  isSafeGitRef,
  isSafeRepoSlug,
  redactGitCredentials,
  runGit,
} from '@/lib/agent-git';

// Built at runtime so secret scanners do not read the fixtures as real credentials.
const FAKE_TOKEN = ['ghs', 'secret123'].join('_');
const credentialUrl = (host: string) => `https://x-access-token:${FAKE_TOKEN}@${host}/o/r.git`;

describe('redactGitCredentials', () => {
  it('removes tokens embedded in remote URLs', () => {
    const text = `Command failed: git push -u ${credentialUrl('github.com')} main`;
    const redacted = redactGitCredentials(text);
    expect(redacted).not.toContain(FAKE_TOKEN);
    expect(redacted).toContain('https://***@github.com/o/r.git');
  });

  it('leaves text without credentials unchanged', () => {
    expect(redactGitCredentials('https://github.com/o/r.git')).toBe('https://github.com/o/r.git');
  });
});

describe('runGit', () => {
  let repo: string;

  beforeEach(() => {
    repo = mkdtempSync(path.join(tmpdir(), 'agent-git-'));
    runGit(['init', '-q'], { cwd: repo });
    runGit(['config', 'user.name', 'Test'], { cwd: repo });
    runGit(['config', 'user.email', 'test@example.com'], { cwd: repo });
  });

  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('passes commit messages verbatim without a shell', () => {
    writeFileSync(path.join(repo, 'file.txt'), 'content');
    runGit(['add', '-A'], { cwd: repo });

    const message = 'feat(T-1): add login; $(touch pwned) `touch pwned2` && echo hi';
    runGit(['commit', '-q', '-m', message], { cwd: repo });

    expect(runGit(['log', '-1', '--format=%s'], { cwd: repo })).toBe(message);
    expect(existsSync(path.join(repo, 'pwned'))).toBe(false);
    expect(existsSync(path.join(repo, 'pwned2'))).toBe(false);
  });

  it('redacts credentials in error messages', () => {
    expect(() => runGit(['push', credentialUrl('127.0.0.1:1'), 'main'], { cwd: repo })).toThrow(
      /^(?!.*ghs_secret123).*Git command failed/s
    );
  });
});

describe('isSafeGitRef', () => {
  it.each(['main', 'daemon/spec-1/task-2', 'release/1.2.x'])('accepts %s', (ref) => {
    expect(isSafeGitRef(ref)).toBe(true);
  });

  it.each(['-f', '--receive-pack=evil', 'a..b', 'main;rm', 'feat branch', ''])(
    'rejects %j',
    (ref) => {
      expect(isSafeGitRef(ref)).toBe(false);
    }
  );
});

describe('isSafeRepoSlug', () => {
  it('accepts owner/name', () => {
    expect(isSafeRepoSlug('butteredstardust/specdrivr')).toBe(true);
  });

  it.each(['evil.example/x@github.com/o', 'o/r/../x', '../r', 'o/..', 'owner', 'o/r?x=1'])(
    'rejects %j',
    (repo) => {
      expect(isSafeRepoSlug(repo)).toBe(false);
    }
  );
});

describe('githubAuthEnv', () => {
  it('scopes the token to a github.com auth header and clears inherited headers', () => {
    const env = githubAuthEnv(FAKE_TOKEN, { PATH: process.env.PATH });
    const headers = runGit(['config', '--get-all', 'http.https://github.com/.extraheader'], {
      env,
    }).split('\n');
    const expected = Buffer.from(`x-access-token:${FAKE_TOKEN}`).toString('base64');
    expect(headers.at(-1)).toBe(`AUTHORIZATION: basic ${expected}`);
    // git drops every header listed before an empty value (e.g. one set by the
    // checkout's local config), so ours must be the only header after it.
    const reset = headers.lastIndexOf('');
    expect(reset).toBeGreaterThanOrEqual(0);
    expect(headers.slice(reset + 1)).toEqual([`AUTHORIZATION: basic ${expected}`]);
    expect(env.GIT_TERMINAL_PROMPT).toBe('0');
  });
});

describe('githubAuthEnv with inherited GIT_CONFIG entries', () => {
  it('keeps entries the caller already set', () => {
    const env = githubAuthEnv(FAKE_TOKEN, {
      PATH: process.env.PATH,
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.abbrev',
      GIT_CONFIG_VALUE_0: '12',
    });
    expect(env.GIT_CONFIG_COUNT).toBe('3');
    expect(runGit(['config', '--get', 'core.abbrev'], { env })).toBe('12');
    expect(
      runGit(['config', '--get-all', 'http.https://github.com/.extraheader'], { env })
    ).toContain('AUTHORIZATION: basic ');
  });
});
