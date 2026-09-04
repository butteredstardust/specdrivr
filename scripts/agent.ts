#!/usr/bin/env tsx
import { execSync, spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'node:crypto';
import { BACKEND_CONFIG, buildCliArgs, AgentBackend, TaskWeight } from '../src/lib/agent-models';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const SESSION_ID = process.env.SESSION_ID;
const POLL_INTERVAL_MS = 5000;

if (!AGENT_TOKEN) throw new Error('AGENT_TOKEN is required');
if (!SESSION_ID) throw new Error('SESSION_ID is required');

const DEFAULT_BACKEND = (process.env.AGENT_BACKEND ?? 'gemini') as AgentBackend;
if (!['gemini', 'claude'].includes(DEFAULT_BACKEND)) {
  throw new Error(`Unknown AGENT_BACKEND: ${DEFAULT_BACKEND}. Must be 'gemini' or 'claude'.`);
}

const headers = {
  Authorization: `Bearer ${AGENT_TOKEN}`,
  'Content-Type': 'application/json',
};

interface Task {
  id: number;
  attemptId: number;
  sessionId: number;
  externalId: string;
  title: string;
  description: string;
  doneCriteria: string;
  verifyCommand?: string;
  recommendedModel?: string;
  projectId?: number;
  specId?: number;
  projectName?: string;
  specName?: string;
  expectedFiles?: string[];
  dependencies?: { title: string; doneCriteria: string }[];
  humanContext?: string;
  githubConfig?: {
    token: string;
    repo: string;
    branch: string; // base branch
    branchName: string; // feature branch
    commitMessage: string;
  };
  agentConfig?: {
    backend?: string;
    taskTimeoutSeconds?: number;
  };
}

function terminateProcessGroup(child: ChildProcess): void {
  if (!child.pid || child.killed) return;
  try {
    if (process.platform === 'win32') child.kill('SIGTERM');
    else process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill('SIGTERM');
  }
  setTimeout(() => {
    if (child.exitCode !== null) return;
    try {
      if (process.platform === 'win32') child.kill('SIGKILL');
      else if (child.pid) process.kill(-child.pid, 'SIGKILL');
    } catch {
      child.kill('SIGKILL');
    }
  }, 5000).unref();
}

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`API ${method} ${path} → ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

/**
 * Executes a git command and returns output.
 */
function git(args: string[]): string {
  try {
    return execSync(`git ${args.join(' ')}`, { encoding: 'utf-8' }).trim();
  } catch (err) {
    throw new Error(`Git command failed: git ${args.join(' ')} - ${String(err)}`);
  }
}

function buildTaskPrompt(task: Task, backend: AgentBackend): string {
  return [
    `You are executing ${task.externalId} with the ${backend} backend.`,
    `Title: ${task.title}`,
    `Description: ${task.description}`,
    task.doneCriteria ? `Done criteria: ${task.doneCriteria}` : '',
    task.expectedFiles?.length ? `Expected files: ${task.expectedFiles.join(', ')}` : '',
    task.dependencies?.length
      ? `Completed dependencies:\n${task.dependencies.map((dep) => `- ${dep.title}: ${dep.doneCriteria}`).join('\n')}`
      : '',
    task.humanContext ? `Human context: ${task.humanContext}` : '',
    'Implement the task completely, keep changes scoped, and leave the working tree ready for verification.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function runVerification(
  task: Task,
  command: string
): Promise<{ exitCode: number; output: string; sessionStopped: boolean }> {
  await streamLog(`⚙ Verifying with: ${command}`, task.id);
  const child = spawn(command, [], {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
    env: process.env,
  });
  let output = '';
  let sessionStopped = false;
  const append = (chunk: unknown) => {
    output = `${output}${String(chunk)}`.slice(-50_000);
  };
  child.stdout?.on('data', append);
  child.stderr?.on('data', append);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => terminateProcessGroup(child), 120_000);
    const heartbeat = setInterval(async () => {
      try {
        const result = await api('POST', `/api/v1/sessions/${task.sessionId}/heartbeat`, {});
        if (result.data?.shouldStop) {
          sessionStopped = true;
          terminateProcessGroup(child);
        }
      } catch (error) {
        await streamLog(`Verification heartbeat warning: ${String(error)}`, task.id, 'warn');
      }
    }, 15_000);
    child.on('close', (code) => {
      clearTimeout(timeout);
      clearInterval(heartbeat);
      resolve({ exitCode: code ?? 1, output, sessionStopped });
    });
  });
}

async function executeTask(task: Task): Promise<void> {
  const completionKey = randomUUID();
  const backend = (task.agentConfig?.backend as AgentBackend) || DEFAULT_BACKEND;
  const config = BACKEND_CONFIG[backend];

  // Verify binary existence
  try {
    const checkCmd =
      process.platform === 'win32' ? `where.exe ${config.bin}` : `which ${config.bin}`;
    execSync(checkCmd, { stdio: 'ignore' });
  } catch {
    const msg = `Agent binary '${config.bin}' not found in PATH. Please install it first.`;
    await streamLog(`❌ ${msg}`, task.id, 'error');
    await api('PATCH', `/api/v1/tasks/${task.id}`, {
      status: 'failed',
      blockedReason: msg,
    });
    return;
  }

  // Git Setup: Create/Switch to feature branch
  if (task.githubConfig) {
    try {
      const { branchName, branch: baseBranch } = task.githubConfig;
      await streamLog(`⚙ Git: Preparing branch ${branchName} (from ${baseBranch})...`, task.id);

      // 1. Ensure we are on base branch and up to date
      git(['checkout', baseBranch]);
      // git(['pull', 'origin', baseBranch]); // Risky in some envs, maybe skip

      // 2. Create or switch to feature branch
      try {
        git(['checkout', '-b', branchName]);
      } catch {
        git(['checkout', branchName]);
      }
    } catch (err) {
      await streamLog(`⚠ Git setup warning: ${String(err)}`, task.id, 'warn');
    }
  }

  await streamLog(`\n▶ Executing T-${task.externalId} [${backend}]: ${task.title}`, task.id);

  const prompt = buildTaskPrompt(task, backend);
  const weight = (task.recommendedModel as TaskWeight) ?? 'flash';
  const args = buildCliArgs(backend, prompt, weight);

  let fullOutput = '';
  let exitCode = 0;
  let errorMessage: string | undefined;
  let sessionStopped = false;
  let timedOut = false;

  // Prepare environment with project-specific API keys
  const env = { ...process.env };
  if (task.agentConfig?.geminiApiKey) {
    env.GEMINI_API_KEY = task.agentConfig.geminiApiKey;
    env.GOOGLE_API_KEY = task.agentConfig.geminiApiKey;
  }
  if (task.agentConfig?.claudeApiKey) {
    env.ANTHROPIC_API_KEY = task.agentConfig.claudeApiKey;
  }

  try {
    const child = spawn(config.bin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env,
      detached: process.platform !== 'win32',
    });

    child.stdout.on('data', (chunk) => {
      const str = chunk.toString();
      fullOutput += str;
      streamLog(str, task.id);
    });

    child.stderr.on('data', (chunk) => {
      const str = chunk.toString();
      streamLog(str, task.id, 'error');
    });

    exitCode = await new Promise<number>((resolve) => {
      let heartbeatTimer: NodeJS.Timeout | undefined;
      const timeoutTimer = setTimeout(
        () => {
          timedOut = true;
          terminateProcessGroup(child);
        },
        (task.agentConfig?.taskTimeoutSeconds ?? 300) * 1000
      );

      const scheduleHeartbeat = () => {
        const jitterMs = Math.floor(Math.random() * 4001) - 2000;
        heartbeatTimer = setTimeout(async () => {
          try {
            const heartbeat = await api('POST', `/api/v1/sessions/${task.sessionId}/heartbeat`, {});
            if (heartbeat.data?.shouldStop) {
              sessionStopped = true;
              terminateProcessGroup(child);
              return;
            }
          } catch (heartbeatError) {
            await streamLog(`Heartbeat warning: ${String(heartbeatError)}`, task.id, 'warn');
          }
          scheduleHeartbeat();
        }, 15_000 + jitterMs);
      };
      scheduleHeartbeat();

      child.on('close', (code) => {
        clearTimeout(timeoutTimer);
        if (heartbeatTimer) clearTimeout(heartbeatTimer);
        resolve(code ?? 0);
      });
    });

    if (sessionStopped) {
      await streamLog('Session stopped; released task without reporting completion.', task.id);
      return;
    }

    if (timedOut) {
      throw new Error(`Task exceeded ${task.agentConfig?.taskTimeoutSeconds ?? 300}s timeout`);
    }

    if (exitCode !== 0) {
      throw new Error(`Process exited with code ${exitCode}`);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    exitCode = exitCode || 1;
    errorMessage = errorMsg;

    await streamLog(`Task failed with exit code ${exitCode}`, task.id, 'error');

    await api('POST', `/api/v1/tasks/${task.id}/complete`, {
      attemptId: task.attemptId,
      sessionId: task.sessionId,
      completionKey,
      output: fullOutput.slice(0, 50000),
      status: 'failed',
      exitCode,
      errorMessage: errorMessage?.slice(0, 1000),
    });
    return;
  }

  let logOutput: string = fullOutput;
  let totalCostUsd: number | undefined;

  if (backend === 'claude') {
    try {
      const jsonMatch = fullOutput.match(/\{[\s\S]*\}/g);
      const lastJson = jsonMatch ? jsonMatch[jsonMatch.length - 1] : fullOutput;
      const parsed = JSON.parse(lastJson);
      logOutput = parsed.result ?? fullOutput;
      totalCostUsd = parsed.cost_usd;
    } catch {
      logOutput = fullOutput;
    }
  }

  let verification: { exitCode: number; output: string; sessionStopped: boolean } | undefined;
  if (task.verifyCommand?.trim()) {
    verification = await runVerification(task, task.verifyCommand);
    if (verification.sessionStopped) {
      await streamLog('Session stopped during verification.', task.id, 'warn');
      return;
    }
    await streamLog(verification.output, task.id, verification.exitCode === 0 ? 'info' : 'error');
    if (verification.exitCode !== 0) {
      await api('POST', `/api/v1/tasks/${task.id}/complete`, {
        attemptId: task.attemptId,
        sessionId: task.sessionId,
        completionKey,
        status: 'failed',
        exitCode: verification.exitCode,
        errorMessage: 'Verification command failed',
        verificationPassed: false,
        verificationOutput: verification.output,
        verificationExitCode: verification.exitCode,
      });
      return;
    }
  }

  // Git Commit & Push
  let commitHash: string | undefined;
  if (task.githubConfig) {
    try {
      const { branchName, commitMessage, repo, token } = task.githubConfig;
      await streamLog(`⚙ Git: Committing changes to ${branchName}...`, task.id);

      git(['add', '-A']);

      // Ensure git user is configured
      try {
        git(['config', 'user.name', 'Specdrivr DAEMON']);
        git(['config', 'user.email', 'daemon@specdrivr.ai']);
      } catch {
        // ignore errors if already set
      }

      // Check if there are actually changes to commit
      const status = git(['status', '--porcelain']);
      if (status) {
        git(['commit', '-m', commitMessage]);
        commitHash = git(['rev-parse', 'HEAD']);

        await streamLog(`⚙ Git: Pushing to origin/${branchName}...`, task.id);

        // Push using token for auth
        const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
        git(['push', '-u', remoteUrl, branchName, '--force']);
      } else {
        await streamLog('⚙ Git: No changes detected.', task.id);
      }
    } catch (err) {
      await streamLog(`⚠ Git automation failed: ${String(err)}`, task.id, 'warn');
    }
  }

  // Finalize Task
  await api('POST', `/api/v1/tasks/${task.id}/complete`, {
    attemptId: task.attemptId,
    sessionId: task.sessionId,
    completionKey,
    output: logOutput.slice(0, 50000),
    status: 'done',
    exitCode: 0,
    gitBranch: task.githubConfig?.branchName,
    gitCommitHash: commitHash,
    totalCostUsd,
    verificationPassed: verification ? true : undefined,
    verificationOutput: verification?.output,
    verificationExitCode: verification?.exitCode,
  });

  await streamLog(`✓ T-${task.externalId} complete`, task.id);
}

async function main() {
  await streamLog(
    `🤖 Specdrivr Agent starting — Session ${SESSION_ID} — Default Backend: ${DEFAULT_BACKEND}`
  );

  let consecutiveErrors = 0;

  while (true) {
    try {
      const heartbeat = await api('POST', `/api/v1/sessions/${SESSION_ID}/heartbeat`, {});
      if (heartbeat.data?.shouldStop) {
        await streamLog('Session cancelled or finished — stopping agent.');
        break;
      }

      const { data: task } = await api('GET', `/api/v1/agent/tasks/next?sessionId=${SESSION_ID}`);

      if (!task) {
        await streamLog('⏳ Waiting for available tasks...');
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        consecutiveErrors = 0;
        continue;
      }

      await executeTask(task);
      consecutiveErrors = 0;
    } catch (err) {
      consecutiveErrors++;
      const msg = err instanceof Error ? err.message : String(err);
      await streamLog(`Error (${consecutiveErrors}/5): ${msg}`, undefined, 'error');

      if (consecutiveErrors >= 5) {
        await streamLog('Too many consecutive errors — stopping agent.', undefined, 'error');
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS * consecutiveErrors));
    }
  }
}

main().catch((err) => {
  console.error('Fatal agent error:', err);
  process.exit(1);
});
