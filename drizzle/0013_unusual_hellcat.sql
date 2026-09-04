ALTER TABLE "task_attempts" ADD COLUMN "completion_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_task_seq_unique" ON "task_attempts" USING btree ("task_id","seq");--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_completion_key_unique" ON "task_attempts" USING btree ("completion_key") WHERE "task_attempts"."completion_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "attempt_active_task_unique" ON "task_attempts" USING btree ("task_id") WHERE "task_attempts"."status" = 'running';