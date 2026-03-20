import 'server-only';
import crypto from 'crypto';
import { logger } from './logger';
import { webhookRepository } from '@/repositories/webhook-repository';
import { type WebhookSelect } from '@/db/schema';

export type WebhookEventType =
  | 'plan.generated'
  | 'plan.approved'
  | 'plan.rejected'
  | 'plan.changes_requested'
  | 'session.started'
  | 'session.completed'
  | 'session.failed'
  | 'session.cancelled'
  | 'task.blocked'
  | 'task.done'
  | 'task.failed'
  | 'task.retried'
  | 'task.unblocked'
  | 'spec.created'
  | 'spec.updated';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string; // ISO8601
  projectId: number;
  specId?: number;
  planId?: number;
  sessionId?: number;
  taskId?: number;
  data: Record<string, unknown>; // event-specific payload
}

/**
 * Main entry point for dispatching a webhook event.
 * Fire-and-forget, never throws.
 */
export async function dispatchWebhookEvent(
  projectId: number,
  event: WebhookEventType,
  payload: Omit<WebhookPayload, 'event' | 'timestamp' | 'projectId'>
): Promise<void> {
  try {
    const webhooks = await webhookRepository.getActiveWebhooksForEvent(projectId, event);

    if (webhooks.length === 0) {
      return;
    }

    const fullPayload: WebhookPayload = {
      timestamp: new Date().toISOString(),
      projectId,
      event,
      ...payload,
    };

    // Fire all in parallel, do not await sequentially
    Promise.allSettled(webhooks.map((webhook) => dispatchWithRetry(webhook, fullPayload))).catch(
      (err) => {
        logger.error({ err, projectId, event }, 'Unhandled error in webhook Promise.allSettled');
      }
    );
  } catch (error) {
    logger.error({ error, projectId, event }, 'Failed to initiate webhook dispatch');
  }
}

const RETRY_DELAYS = [1000, 5000, 30000, 300000]; // Delays: 1s, 5s, 30s, 5m (4 attempts total)

async function dispatchWithRetry(
  webhook: Pick<WebhookSelect, 'id' | 'url' | 'secret'>,
  payload: WebhookPayload,
  attempt: number = 0
): Promise<void> {
  const start = Date.now();
  const rawBody = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Specdrivr/1.0 Webhook Dispatcher',
  };

  if (webhook.secret) {
    const signature = crypto.createHmac('sha256', webhook.secret).update(rawBody).digest('hex');
    headers['X-Specdrivr-Signature'] = `sha256=${signature}`;
  }

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let status: 'delivered' | 'failed' | 'error' = 'failed';

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: rawBody,
    });

    statusCode = response.status;
    responseBody = await response.text();

    if (response.ok) {
      status = 'delivered';
    }
  } catch (error: unknown) {
    responseBody = error instanceof Error ? error.message : String(error);
  }

  const durationMs = Date.now() - start;

  // Final attempt check (attempt 0 = initial, 1 = 1s, 2 = 5s, 3 = 30s, 4 = 5m retry failed)
  if (status === 'failed' && attempt >= RETRY_DELAYS.length) {
    status = 'error';
  }

  // Log delivery attempt
  try {
    await webhookRepository.logDelivery({
      webhookId: webhook.id,
      projectId: payload.projectId,
      eventType: payload.event,
      payload,
      status,
      responseStatus: statusCode ?? undefined,
      responseBody: responseBody?.slice(0, 500) ?? undefined,
      durationMs,
      attempt: attempt + 1,
    });
  } catch (logError) {
    logger.error({ logError, webhookId: webhook.id }, 'Failed to log webhook delivery');
  }

  // Handle retries
  if (status === 'failed' && attempt < RETRY_DELAYS.length) {
    const delay = RETRY_DELAYS[attempt];
    const nextAttempt = attempt + 1;

    logger.info(
      {
        webhookId: webhook.id,
        attempt: nextAttempt + 1,
        delay,
        projectId: payload.projectId,
      },
      'Retrying webhook delivery'
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return dispatchWithRetry(webhook, payload, nextAttempt);
  }

  // Mark as permanent error if all attempts exhausted
  if (status === 'error') {
    logger.error(
      {
        webhookId: webhook.id,
        projectId: payload.projectId,
      },
      'Webhook delivery exhausted all retries (4), marking as error'
    );

    try {
      await webhookRepository.setErrorStatus(webhook.id);
    } catch (err: unknown) {
      logger.error({ err, webhookId: webhook.id }, 'Failed to set webhook error status');
    }
  }
}

// Add a legacy wrapper for actions that expect the old webhookService
export const webhookService = {
  dispatch: async (
    projectId: number,
    event: WebhookEventType,
    data: unknown,
    options: Record<string, unknown> = {}
  ) => {
    return dispatchWebhookEvent(projectId, event, {
      ...options,
      data:
        typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : { data },
    });
  },
};
