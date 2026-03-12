import 'server-only';
import crypto from 'crypto';
import { webhookRepository } from '@/repositories/webhook-repository';
import { logger } from './logger';

export interface WebhookEventPayload {
  event: string;
  timestamp: string;
  projectId: number;
  specId?: number;
  sessionId?: number;
  taskId?: number;
  data: unknown;
}

export class WebhookService {
  /**
   * Dispatches an event to all subscribed generic webhooks for a project.
   */
  async dispatch(projectId: number, event: string, data: unknown, options: {
    specId?: number;
    sessionId?: number;
    taskId?: number;
  } = {}) {
    try {
      const activeWebhooks = await webhookRepository.getByProjectId(projectId);
      const subscribed = activeWebhooks.filter(w => {
        const events = w.events as string[];
        return w.isActive && (events.includes(event) || events.includes('*'));
      });

      if (subscribed.length === 0) return;

      const payload: WebhookEventPayload = {
        event,
        timestamp: new Date().toISOString(),
        projectId,
        ...options,
        data,
      };

      // Dispatch to each subscribed webhook asynchronously
      await Promise.all(subscribed.map(webhook => this.sendToWebhook(webhook, payload)));
    } catch (error) {
      logger.error({ error, projectId, event }, 'Failed to dispatch webhooks');
    }
  }

  private async sendToWebhook(webhook: import('@/db/schema').WebhookSelect, payload: WebhookEventPayload) {
    const start = Date.now();
    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Specdrivr-Webhook/1.0',
    };

    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payloadString)
        .digest('hex');
      headers['X-Specdrivr-Signature'] = signature;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
      });

      const responseBody = await response.text();
      const durationMs = Date.now() - start;

      await webhookRepository.logDelivery({
        webhookId: webhook.id,
        projectId: webhook.projectId,
        eventType: payload.event,
        payload,
        status: response.ok ? 'delivered' : 'failed',
        responseStatus: response.status,
        responseBody: responseBody.slice(0, 1000), // Truncate long bodies
        durationMs,
      });

      if (!response.ok) {
        logger.warn({ webhookId: webhook.id, status: response.status }, 'Webhook delivery failed');
      }
    } catch (error: unknown) {
      const durationMs = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      await webhookRepository.logDelivery({
        webhookId: webhook.id,
        projectId: webhook.projectId,
        eventType: payload.event,
        payload,
        status: 'failed',
        responseBody: message,
        durationMs,
      });
      logger.error({ error: message, webhookId: webhook.id }, 'Webhook fetch error');
    }
  }
}

export const webhookService = new WebhookService();
