import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../db/schema';
import { env } from '../env-script';
import { eq, and, gte, lt, sql, sum, count } from 'drizzle-orm';
import { logger } from '../logger-cli';

const { agentSessions, usageSnapshots } = schema;

// Create a dedicated db client for the script that uses env-script (no server-only)
const queryClient = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema });

/**
 * Aggregates session usage into daily snapshots for a specific date.
 * Normalizes the date to midnight UTC.
 */
export async function aggregateUsageForDate(date: Date): Promise<{
  projectsProcessed: number;
  snapshotsWritten: number;
  errors: string[];
}> {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const midnight = new Date(Date.UTC(y, m, d));
  const nextDay = new Date(Date.UTC(y, m, d + 1));

  const errors: string[] = [];
  let snapshotsWritten = 0;

  try {
    // 1. Find all projects with completed sessions in the target date range
    const results = await db
      .select({
        projectId: agentSessions.projectId,
        sessionsCount: count(agentSessions.id),
        totalPromptTokens: sum(agentSessions.totalPromptTokens),
        totalCompletionTokens: sum(agentSessions.totalCompletionTokens),
        totalCostUsd: sum(agentSessions.totalCostUsd),
        totalTasksExecuted: sum(agentSessions.tasksExecuted),
        totalTasksSucceeded: sum(agentSessions.tasksSucceeded),
        totalTasksFailed: sum(agentSessions.tasksFailed),
      })
      .from(agentSessions)
      .where(
        and(
          eq(agentSessions.status, 'completed'),
          gte(agentSessions.startedAt, midnight),
          lt(agentSessions.startedAt, nextDay)
        )
      )
      .groupBy(agentSessions.projectId);

    if (results.length === 0) {
      logger.info({ date: midnight.toISOString() }, 'No sessions found for aggregation');
      return { projectsProcessed: 0, snapshotsWritten: 0, errors: [] };
    }

    // 2. Process each project and upsert into usage_snapshots
    for (const res of results) {
      try {
        await db.transaction(async (tx) => {
          await tx
            .insert(usageSnapshots)
            .values({
              projectId: res.projectId,
              date: midnight,
              sessionsRun: Number(res.sessionsCount),
              promptTokens: Number(res.totalPromptTokens || 0),
              completionTokens: Number(res.totalCompletionTokens || 0),
              estimatedCostUsd: Number(res.totalCostUsd || 0),
              tasksExecuted: Number(res.totalTasksExecuted || 0),
              tasksSucceeded: Number(res.totalTasksSucceeded || 0),
              tasksFailed: Number(res.totalTasksFailed || 0),
            })
            .onConflictDoUpdate({
              target: [usageSnapshots.projectId, usageSnapshots.date],
              set: {
                sessionsRun: Number(res.sessionsCount),
                promptTokens: Number(res.totalPromptTokens || 0),
                completionTokens: Number(res.totalCompletionTokens || 0),
                estimatedCostUsd: Number(res.totalCostUsd || 0),
                tasksExecuted: Number(res.totalTasksExecuted || 0),
                tasksSucceeded: Number(res.totalTasksSucceeded || 0),
                tasksFailed: Number(res.totalTasksFailed || 0),
                createdAt: new Date(),
              },
            });
        });
        snapshotsWritten++;
      } catch (err: any) {
        const errMsg = `Failed to upsert snapshot for project ${res.projectId}: ${err.message}`;
        logger.error({ err, projectId: res.projectId }, errMsg);
        errors.push(errMsg);
      }
    }

    return {
      projectsProcessed: results.length,
      snapshotsWritten,
      errors,
    };
  } catch (err: any) {
    const errMsg = `Usage aggregation failed for ${midnight.toISOString()}: ${err.message}`;
    logger.error({ err }, errMsg);
    throw err;
  }
}

// CLI entrypoint
const isMain = process.argv[1]?.endsWith('aggregate-usage.ts') || process.argv[1]?.endsWith('aggregate-usage.js');

if (isMain) {
  const dateArg = process.argv[2];
  const targetDate = dateArg ? new Date(dateArg) : (() => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return yesterday;
  })();

  if (isNaN(targetDate.getTime())) {
    logger.error({ dateArg }, 'Invalid date argument provided');
    process.exit(1);
  }

  logger.info({ targetDate: targetDate.toISOString() }, 'Starting usage aggregation job');

  aggregateUsageForDate(targetDate)
    .then((result) => {
      if (result.errors.length > 0) {
        logger.warn(result, 'Usage aggregation complete with some errors');
      } else {
        logger.info(result, 'Usage aggregation complete');
      }
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Usage aggregation failed');
      process.exit(1);
    });
}
