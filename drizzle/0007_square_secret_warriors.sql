CREATE TYPE "public"."exercise_status" AS ENUM('SUBMITTED', 'GRADED', 'RESUBMIT');--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "status" "exercise_status" DEFAULT 'SUBMITTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "exercises" ADD COLUMN "graded_at" timestamp;