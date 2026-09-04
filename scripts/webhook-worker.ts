#!/usr/bin/env tsx
import { processNextWebhookDelivery } from '../src/lib/webhooks';
import { logger } from '../src/lib/logger';

async function main(): Promise<void> {
  logger.info('Webhook worker started');
  for (;;) {
    try {
      const processed = await processNextWebhookDelivery();
      if (!processed) await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error({ error }, 'Webhook worker cycle failed');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

void main();
