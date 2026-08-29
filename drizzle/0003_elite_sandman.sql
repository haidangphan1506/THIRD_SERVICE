ALTER TABLE "class_sessions" ADD COLUMN "objectives" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD COLUMN "agenda" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD COLUMN "exercise_due_at" timestamp with time zone;