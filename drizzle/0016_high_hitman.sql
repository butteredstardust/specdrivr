ALTER TABLE "webhook_deliveries" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD COLUMN "lease_token" text;--> statement-breakpoint
CREATE INDEX "webhook_delivery_queue_idx" ON "webhook_deliveries" USING btree ("status","next_retry_at");