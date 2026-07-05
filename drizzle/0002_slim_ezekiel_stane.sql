ALTER TABLE "classes" ADD COLUMN "format" "session_format" DEFAULT 'ONLINE' NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "curriculum_id" uuid;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_curriculum_id_curriculums_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculums"("id") ON DELETE set null ON UPDATE no action;