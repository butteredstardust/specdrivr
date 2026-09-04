import 'server-only';

import crypto, { randomUUID } from 'node:crypto';
import { and, asc, eq, isNull, lt, lte, or } from 'drizzle-orm';
import { db } from '@/db';
import { webhookDeliveries, webhooks } from '@/db/schema';
import { logger } from '@/lib/logger';
import { webhookRepository } from '@/repositories/webhook-repository';
import { decryptCredential } from '@/lib/credential-crypto';

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
  timestamp: string;
  projectId: number;
  specId?: number;
  planId?: number;
  sessionId?: number;
  taskId?: number;
  data: Record<string, unknown>;
}

const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 300_000];
const RESPONSE_LIMIT_BYTES = 8_192;

export async function dispatchWebhookEvent(
  projectId: number,
  event: WebhookEventType,
  payload: Omit<WebhookPayload, 'event' | 'timestamp' | 'projectId'>
): Promise<void> {
  try {
    const targets = await webhookRepository.getActiveWebhooksForEvent(projectId, event);
    if (targets.length === 0) return;
    const fullPayload: WebhookPayload = {
      timestamp: new Date().toISOString(),
      projectId,
      event,
      ...payload,
    };
    await db.insert(webhookDeliveries).values(
      targets.map((target) => ({
        webhookId: target.id,
        projectId,
        eventType: event,
        payload: fullPayload,
        status: 'pending',
        attempt: 0,
        nextRetryAt: new Date(),
      }))
    );
  } catch (err) {
    logger.error({ err, projectId, event }, 'Failed to queue webhook event');
  }
}

async function readBoundedBody(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let result = '';
  while (bytes < RESPONSE_LIMIT_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = RESPONSE_LIMIT_BYTES - bytes;
    const slice = value.byteLength > remaining ? value.slice(0, remaining) : value;
    bytes += slice.byteLength;
    result += decoder.decode(slice, { stream: true });
    if (slice.byteLength < value.byteLength) {
      await reader.cancel();
      break;
    }
  }
  return result;
}

export async function processNextWebhookDelivery(): Promise<boolean> {
  const leaseToken = randomUUID();
  const now = new Date();
  const staleLock = new Date(Date.now() - 60_000);
  const delivery = await db.transaction(async (tx) => {
    await tx
      .update(webhookDeliveries)
      .set({ status: 'pending', leaseToken: null, lockedAt: null })
      .where(
        and(eq(webhookDeliveries.status, 'delivering'), lt(webhookDeliveries.lockedAt, staleLock))
      );
    const [candidate] = await tx
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.status, 'pending'),
          or(isNull(webhookDeliveries.nextRetryAt), lte(webhookDeliveries.nextRetryAt, now))
        )
      )
      .orderBy(asc(webhookDeliveries.createdAt))
      .limit(1)
      .for('update', { skipLocked: true });
    if (!candidate) return null;
    const [claimed] = await tx
      .update(webhookDeliveries)
      .set({ status: 'delivering', leaseToken, lockedAt: now })
      .where(eq(webhookDeliveries.id, candidate.id))
      .returning();
    return claimed;
  });
  if (!delivery) return false;

  const [target] = await db
    .select({ url: webhooks.url, secret: webhooks.secret, isActive: webhooks.isActive })
    .from(webhooks)
    .where(eq(webhooks.id, delivery.webhookId!))
    .limit(1);
  const startedAt = Date.now();
  let responseStatus: number | null = null;
  let responseBody = '';
  let delivered = false;
  if (!target?.isActive) {
    responseBody = 'Webhook is missing or inactive';
  } else {
    const rawBody = JSON.stringify(delivery.payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Specdrivr/1.0 Webhook Worker',
    };
    const signingSecret = decryptCredential(target.secret);
    if (signingSecret) {
      headers['X-Specdrivr-Signature'] = `sha256=${crypto
        .createHmac('sha256', signingSecret)
        .update(rawBody)
        .digest('hex')}`;
    }
    try {
      const response = await fetch(target.url, {
        method: 'POST',
        headers,
        body: rawBody,
        signal: AbortSignal.timeout(10_000),
        redirect: 'manual',
      });
      responseStatus = response.status;
      responseBody = await readBoundedBody(response);
      delivered = response.ok;
    } catch (error) {
      responseBody = error instanceof Error ? error.message : String(error);
    }
  }

  const attempt = delivery.attempt + 1;
  const exhausted = !delivered && attempt > RETRY_DELAYS_MS.length;
  const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)] ?? 300_000;
  const jitter = Math.floor(delay * (Math.random() * 0.4 - 0.2));
  await db
    .update(webhookDeliveries)
    .set({
      status: delivered ? 'delivered' : exhausted ? 'exhausted' : 'pending',
      attempt,
      responseStatus,
      responseBody,
      durationMs: Date.now() - startedAt,
      deliveredAt: delivered ? new Date() : null,
      nextRetryAt: delivered || exhausted ? null : new Date(Date.now() + delay + jitter),
      leaseToken: null,
      lockedAt: null,
    })
    .where(
      and(eq(webhookDeliveries.id, delivery.id), eq(webhookDeliveries.leaseToken, leaseToken))
    );

  if (exhausted && delivery.webhookId) {
    await webhookRepository.setErrorStatus(delivery.webhookId);
    logger.error({ deliveryId: delivery.id, webhookId: delivery.webhookId }, 'Webhook exhausted');
  }
  return true;
}

export const webhookService = {
  dispatch: async (
    projectId: number,
    event: WebhookEventType,
    data: unknown,
    options: Record<string, unknown> = {}
  ): Promise<void> =>
    dispatchWebhookEvent(projectId, event, {
      ...options,
      data:
        typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : { data },
    }),
};
