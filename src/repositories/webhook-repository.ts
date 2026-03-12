import { db } from '@/db';
import { webhooks, webhookDeliveries, type WebhookSelect as Webhook, type WebhookDeliverySelect as WebhookDelivery } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export class WebhookRepository extends BaseRepository {
  async getAll(): Promise<Webhook[]> {
    return await this.execQuery(() =>
      db.select().from(webhooks)
    );
  }

  async getById(id: number): Promise<Webhook | null> {
    const result = await this.execQuery(() =>
      db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1)
    );
    return result[0] || null;
  }

  async getByProjectId(projectId: number): Promise<Webhook[]> {
    return await this.execQuery(() =>
      db.select().from(webhooks).where(eq(webhooks.projectId, projectId))
    );
  }

  async create(data: { projectId: number; url: string; secret?: string | null; events: string[] }): Promise<Webhook> {
    const [webhook] = await this.execQuery(() =>
      db.insert(webhooks).values({
        projectId: data.projectId,
        url: data.url,
        secret: data.secret,
        events: data.events,
      }).returning()
    );

    if (!webhook) {
      throw new DatabaseError('Failed to create webhook');
    }

    return webhook;
  }

  async update(id: number, data: Partial<{ url: string; secret: string | null; events: string[]; isActive: boolean }>): Promise<Webhook> {
    const [updated] = await this.execQuery(() =>
      db.update(webhooks).set(data).where(eq(webhooks.id, id)).returning()
    );

    if (!updated) {
      throw new NotFoundError(`Webhook with ID ${id} not found`);
    }

    return updated;
  }

  async delete(id: number): Promise<void> {
    const result = await this.execQuery(() =>
      db.delete(webhooks).where(eq(webhooks.id, id)).returning()
    );

    if (result.length === 0) {
      throw new NotFoundError(`Webhook with ID ${id} not found`);
    }
  }

  /**
   * Records a webhook delivery attempt.
   */
  async logDelivery(data: {
    webhookId?: number;
    projectId: number;
    eventType: string;
    payload: unknown;
    status: string;
    responseStatus?: number;
    responseBody?: string;
    durationMs?: number;
  }): Promise<WebhookDelivery> {
    const [delivery] = await this.execQuery(() =>
      db.insert(webhookDeliveries).values({
        webhookId: data.webhookId,
        projectId: data.projectId,
        eventType: data.eventType,
        payload: data.payload,
        status: data.status,
        responseStatus: data.responseStatus,
        responseBody: data.responseBody,
        durationMs: data.durationMs,
        deliveredAt: data.status === 'delivered' ? new Date() : null,
      }).returning()
    );

    if (!delivery) {
      throw new DatabaseError('Failed to log webhook delivery');
    }

    return delivery;
  }

  async getDeliveriesByProjectId(projectId: number): Promise<WebhookDelivery[]> {
    return await this.execQuery(() =>
      db.select().from(webhookDeliveries).where(eq(webhookDeliveries.projectId, projectId))
    );
  }
}

export const webhookRepository = new WebhookRepository();
