import { DatabaseError } from './errors';
import type { PgTable } from 'drizzle-orm/pg-core';

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
};

function isTransientError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return (
    errorMessage.includes('connection terminated') ||
    errorMessage.includes('connection timed out') ||
    errorMessage.includes('too many connections') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('deadlock') ||
    errorMessage.includes('lock')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retryOptions.maxAttempts && isTransientError(error)) {
        const delay = retryOptions.delayMs * Math.pow(retryOptions.backoffMultiplier, attempt - 1);
        console.warn(
          `Database operation failed (attempt ${attempt}/${retryOptions.maxAttempts}), retrying in ${delay}ms:`,
          error
        );
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw lastError;
}

export async function safeQuery<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await withRetry(operation, options);
  } catch (error) {
    throw new DatabaseError('Database query failed', error instanceof Error ? error : undefined);
  }
}

export async function safeSelect<T extends PgTable>(
  table: T,
  queryFn: (table: T) => Promise<unknown[]>
): Promise<unknown[]> {
  try {
    return await safeQuery(() => queryFn(table));
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new DatabaseError('Select query failed', error instanceof Error ? error : undefined);
  }
}

export type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; error: DatabaseError };

export async function executeQuery<T>(
  operation: () => Promise<T>
): Promise<QueryResult<T>> {
  try {
    const data = await safeQuery(operation);
    return { success: true, data };
  } catch (error) {
    const databaseError = error instanceof DatabaseError
      ? error
      : new DatabaseError('Query execution failed', error instanceof Error ? error : undefined);

    return { success: false, error: databaseError };
  }
}
