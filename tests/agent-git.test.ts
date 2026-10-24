import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isSafeGitRef, isSafeRepoSlug, redactGitCredentials, runGit } from '@/lib/agent-git';

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
