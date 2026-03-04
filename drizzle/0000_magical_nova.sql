CREATE TYPE "public"."agent_status" AS ENUM('idle', 'running', 'paused', 'stopped', 'error');--> statement-breakpoint
CREATE TYPE "public"."log_level" AS ENUM('debug', 'info', 'warn', 'error');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'blocked');--> statement-breakpoint
CREATE TABLE "agent_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"project_id" integer,
	"level" "log_level" DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"context" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"spec_id" integer NOT NULL,
	"architecture_decisions" jsonb,
	"status" "plan_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"constitution" text,
	"tech_stack" jsonb,
	"base_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_status" "agent_status" DEFAULT 'idle' NOT NULL,
	"agent_started_at" timestamp with time zone,
	"agent_stopped_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "specifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"content" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"description" text,
	"files_involved" jsonb,
	"priority" integer DEFAULT 1 NOT NULL,
	"dependency_task_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "test_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"success" boolean NOT NULL,
	"logs" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_logs" ADD CONSTRAINT "agent_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_spec_id_specifications_id_fk" FOREIGN KEY ("spec_id") REFERENCES "public"."specifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specifications" ADD CONSTRAINT "specifications_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dependency_task_id_tasks_id_fk" FOREIGN KEY ("dependency_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;