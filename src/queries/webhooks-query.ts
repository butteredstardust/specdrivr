import { webhookRepository } from '@/repositories/webhook-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { webhookDeliveryQuerySchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/rbac';

export async function getWebhookDeliveries(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  const result = webhookDeliveryQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, error: 'INVALID_INPUT' as const };
  }

  try {
    const { webhookId, limit, offset } = result.data;

    const webhook = await webhookRepository.getById(webhookId);
    if (!webhook) {
      return { data: null, error: 'NOT_FOUND' as const };
    }

    const { allowed } = await requireAdmin(session.user.id, webhook.projectId);
    if (!allowed) {
      return { data: null, error: 'FORBIDDEN' as const };
    }

    const data = await webhookRepository.getDeliveriesByWebhookId(webhookId, limit, offset);
    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getWebhookDeliveries failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}
