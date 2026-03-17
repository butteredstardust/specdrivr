#!/usr/bin/env tsx
import { execSync, spawn } from 'child_process';
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
  externalId: string;
  title: string;
  description: string;
  doneCriteria: string;
  verifyCommand?: string;
  recommendedModel?: string;
  projectName?: string;
  specName?: string;
  filesInvolved?: string[];
  dependencies?: { title: string; doneCriteria: string }[];
  humanContext?: string;
  agentConfig?: {
    backend?: string;
    geminiApiKey?: string;
    claudeApiKey?: string;
  };
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

// Buffer lines and flush every 100ms to avoid hammering the API
const logBuffer: { line: string; taskId?: number; level: string }[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

async function streamLog(line: string, taskId?: number, level = 'info') {
  // Echo to local console too
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }

  logBuffer.push({ line, taskId, level });

  if (!flushTimeout) {
    flushTimeout = setTimeout(async () => {
      const lines = logBuffer.splice(0);
      flushTimeout = null;

      // Send all buffered lines in parallel
      await Promise.allSettled(
        lines.map((payload) => api('POST', `/api/v1/sessions/${SESSION_ID}/log`, payload))
      );
    }, 100);
  }
}

function buildTaskPrompt(task: Task, backend: AgentBackend): string {
  const deps = task.dependencies?.length
    ? `\nCompleted prerequisite tasks:\n${task.dependencies.map((d) => `- ${d.title}: ${d.doneCriteria}`).join('\n')}`
    : '';

  const basePrompt = `You are an AI coding agent executing a specific task.

Project: ${task.projectName || 'Specdrivr'}
Spec: ${task.specName || 'Unknown'}

TASK: ${task.title}
${task.description}

Files to create or modify:
${task.filesInvolved?.map((f) => `- ${f}`).join('\n') || '(determine from context)'}

Done when:
${task.doneCriteria}
${task.verifyCommand ? `\nVerify with: ${task.verifyCommand}` : ''}
${deps}
${task.humanContext ? `\nAdditional context from team:\n${task.humanContext}` : ''}

Execute this task. Make all necessary file changes. Be thorough and complete.`;

  if (backend === 'claude') {
    let repoContext = '';
    try {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? 'Get-ChildItem -Path src -Filter *.ts* -Recurse | Select-Object -First 60 -ExpandProperty FullName'
        : 'find src -type f -name "*.ts" -o -name "*.tsx" | head -60';

      repoContext = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 5000,
      });
    } catch {
      /* ignore */
    }

    return `${basePrompt}

Repository file structure (relevant files):
${repoContext}

Important: You are operating in the project root. Make all file changes directly.
Use TypeScript. Follow the existing code patterns you observe in the repo.`;
  }

  return basePrompt;
}

async function executeTask(task: Task): Promise<void> {
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

  await streamLog(`\n▶ Executing T-${task.externalId} [${backend}]: ${task.title}`, task.id);

  const prompt = buildTaskPrompt(task, backend);
  const weight = (task.recommendedModel as TaskWeight) ?? 'flash';
  const args = buildCliArgs(backend, prompt, weight);

  let fullOutput = '';
  let exitCode = 0;
  let errorMessage: string | undefined;

  // Prepare environment with project-specific API keys
  const env = { ...process.env };
  if (task.agentConfig?.geminiApiKey) {
    env.GEMINI_API_KEY = task.agentConfig.geminiApiKey;
    env.GOOGLE_API_KEY = task.agentConfig.geminiApiKey; // Some CLIs use this
  }
  if (task.agentConfig?.claudeApiKey) {
    env.ANTHROPIC_API_KEY = task.agentConfig.claudeApiKey;
  }

  try {
    const child = spawn(config.bin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env,
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
      child.on('close', (code) => resolve(code ?? 0));
    });

    if (exitCode !== 0) {
      throw new Error(`Process exited with code ${exitCode}`);
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    exitCode = exitCode || 1;
    errorMessage = errorMsg;

    await streamLog(`Task failed with exit code ${exitCode}`, task.id, 'error');

    await api('POST', `/api/v1/tasks/${task.id}/complete`, {
      output: fullOutput.slice(0, 50000),
      status: 'failed',
      exitCode,
      errorMessage: errorMessage?.slice(0, 1000),
    });
    return;
  }

  let logOutput: string = fullOutput;

  if (backend === 'claude') {
    try {
      // Find the last JSON block in the output if any, or assume the whole output is JSON
      const jsonMatch = fullOutput.match(/\{[\s\S]*\}/g);
      const lastJson = jsonMatch ? jsonMatch[jsonMatch.length - 1] : fullOutput;
      const parsed = JSON.parse(lastJson);
      logOutput = parsed.result ?? fullOutput;

      if (parsed.cost_usd) {
        await api('PATCH', `/api/v1/tasks/${task.id}`, {
          totalCostUsd: parsed.cost_usd,
        });
      }
    } catch {
      logOutput = fullOutput;
    }
  }

  await api('POST', `/api/v1/tasks/${task.id}/complete`, {
    output: logOutput.slice(0, 50000),
    status: 'done',
    exitCode: 0,
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
