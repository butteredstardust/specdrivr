ALTER TABLE "projects" ADD COLUMN "done_criteria" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "verify_command" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verification_output" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verification_exit_code" integer;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verification_completed_at" timestamp with time zone;