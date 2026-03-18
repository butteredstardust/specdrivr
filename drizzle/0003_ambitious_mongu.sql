ALTER TABLE "agent_config" ADD COLUMN "gemini_api_key" text;--> statement-breakpoint
ALTER TABLE "agent_config" ADD COLUMN "gemini_model" text DEFAULT 'gemini-2.0-flash' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "intent" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "phase_label" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "architecture_decisions" jsonb DEFAULT '[]'::jsonb;