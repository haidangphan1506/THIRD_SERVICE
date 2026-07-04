CREATE TYPE "public"."class_session_status" AS ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"lesson_id" uuid,
	"tutor_id" uuid,
	"title" varchar(255),
	"description" text,
	"session_number" integer NOT NULL,
	"lession_id" uuid,
	"theory_urls" jsonb DEFAULT '[]'::jsonb,
	"exercise_urls" jsonb DEFAULT '[]'::jsonb,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"location" text,
	"status" "class_session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"note" text,
	"actual_start_at" timestamp with time zone,
	"actual_end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "sessions" CASCADE;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "start_time" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "end_time" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_lession_id_lessons_id_fk" FOREIGN KEY ("lession_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;