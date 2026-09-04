ALTER TABLE "tasks" ADD COLUMN "done_criteria" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "verify_command" text;--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "done_criteria";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "verify_command";