ALTER TABLE "classes" ADD COLUMN "students_id" uuid[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "users_id";