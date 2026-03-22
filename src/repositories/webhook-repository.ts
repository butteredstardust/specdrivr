import { db } from '@/db';
import {
  webhooks,
  webhookDeliveries,
  type WebhookSelect as Webhook,
  type WebhookDeliverySelect as WebhookDelivery,
} from '@/db/schema';
import { eq, and, sql, ne, desc, getTableColumns } from 'drizzle-orm';

export type { WebhookDeliverySelect as WebhookDelivery } from '@/db/schema';
import { BaseRepository } from './base-repository';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export class WebhookRepository extends BaseRepository {
  async getAll(): Promise<Webhook[]> {
    return await this.executeQuery(() => db.select().from(webhooks));
  }

  async getById(id: number): Promise<Webhook | null> {
    const result = await this.executeQuery(() =>
      db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1)
    );
    return result[0] || null;
  }

  async getByProjectId(projectId: number): Promise<Webhook[]> {
    return await this.executeQuery(() =>
      db.select().from(webhooks).where(eq(webhooks.projectId, projectId))
    );
  }

  async create(data: {
    projectId: number;
    url: string;
    secret?: string | null;
    events: string[];
  }): Promise<Webhook> {
    const [webhook] = await this.executeQuery(() =>
      db
        .insert(webhooks)
        .values({
          projectId: data.projectId,
          url: data.url,
          secret: data.secret,
          events: data.events,
        })
        .returning()
    );

    if (!webhook) {
      throw new DatabaseError('Failed to create webhook');
    }

    return webhook;
  }

  async update(
    id: number,
    data: Partial<{ url: string; secret: string | null; events: string[]; isActive: boolean }>
  ): Promise<Webhook> {
    const [updated] = await this.executeQuery(() =>
      db.update(webhooks).set(data).where(eq(webhooks.id, id)).returning()
    );

    if (!updated) {
      throw new NotFoundError(`Webhook with ID ${id} not found`);
    }

    return updated;
  }

  async delete(id: number): Promise<void> {
    const result = await this.executeQuery(() =>
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
    attempt?: number;
  }): Promise<WebhookDelivery> {
    const [delivery] = await this.executeQuery(() =>
      db
        .insert(webhookDeliveries)
        .values({
          webhookId: data.webhookId,
          projectId: data.projectId,
          eventType: data.eventType,
          payload: data.payload,
          status: data.status,
          responseStatus: data.responseStatus,
          responseBody: data.responseBody,
          durationMs: data.durationMs,
          attempt: data.attempt ?? 1,
          deliveredAt: data.status === 'delivered' ? new Date() : null,
        })
        .returning()
    );

    if (!delivery) {
      throw new DatabaseError('Failed to log webhook delivery');
    }

    return delivery;
  }

  async getDeliveriesByWebhookId(
    webhookId: number,
    limit = 50,
    offset = 0
  ): Promise<WebhookDelivery[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.webhookId, webhookId))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(limit)
        .offset(offset)
    );
  }

  async getDeliveryById(
    id: number
  ): Promise<(WebhookDelivery & { endpointUrl: string | null; secret: string | null }) | null> {
    const result = await this.executeQuery(() =>
      db
        .select({
          ...getTableColumns(webhookDeliveries),
          endpointUrl: webhooks.url,
          secret: webhooks.secret,
        })
        .from(webhookDeliveries)
        .leftJoin(webhooks, eq(webhooks.id, webhookDeliveries.webhookId))
        .where(eq(webhookDeliveries.id, id))
        .limit(1)
    );
    return result[0] || null;
  }

  async getActiveWebhooksForEvent(projectId: number, event: string): Promise<Webhook[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(webhooks)
        .where(
          and(
            eq(webhooks.projectId, projectId),
            eq(webhooks.isActive, true),
            ne(webhooks.status, 'error'),
            sql`${webhooks.events} @> ${JSON.stringify([event])}::jsonb OR ${webhooks.events} @> ${JSON.stringify(['*'])}::jsonb`
          )
        )
    );
  }

  async setErrorStatus(id: number): Promise<void> {
    // Set status to 'error' to allow UI to show failure state
    await this.executeQuery(() =>
      db.update(webhooks).set({ status: 'error' }).where(eq(webhooks.id, id))
    );
  }

  async getDeliveriesByProjectId(
    projectId: number,
    limit = 25,
    offset = 0
  ): Promise<(WebhookDelivery & { endpointUrl: string | null })[]> {
    return await this.executeQuery(() =>
      db
        .select({
          ...getTableColumns(webhookDeliveries),
          endpointUrl: webhooks.url,
        })
        .from(webhookDeliveries)
        .leftJoin(webhooks, eq(webhooks.id, webhookDeliveries.webhookId))
        .where(eq(webhookDeliveries.projectId, projectId))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(limit)
        .offset(offset)
    );
  }

  async countDeliveriesByProjectId(projectId: number): Promise<number> {
    const result = await this.executeQuery(() =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.projectId, projectId))
    );
    return result[0]?.count ?? 0;
  }
}

export const webhookRepository = new WebhookRepository();
