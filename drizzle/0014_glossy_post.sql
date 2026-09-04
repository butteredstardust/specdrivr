ALTER TYPE "public"."plan_job_status" ADD VALUE 'cancelled';--> statement-breakpoint
DROP INDEX "task_external_id_idx";--> statement-breakpoint
ALTER TABLE "plan_jobs" ADD COLUMN "spec_version_id" integer;--> statement-breakpoint
ALTER TABLE "plan_jobs" ADD COLUMN "generation_token" text;--> statement-breakpoint
ALTER TABLE "plan_jobs" ADD CONSTRAINT "plan_jobs_spec_version_id_spec_versions_id_fk" FOREIGN KEY ("spec_version_id") REFERENCES "public"."spec_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "plan_job_plan_type_unique" ON "plan_jobs" USING btree ("plan_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "task_external_id_idx" ON "tasks" USING btree ("plan_id","external_id");