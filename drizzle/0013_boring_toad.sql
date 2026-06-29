ALTER TABLE "curriculums" DROP CONSTRAINT "curriculums_class_id_classes_id_fk";
--> statement-breakpoint
ALTER TABLE "curriculums" ALTER COLUMN "class_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculums" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "curriculums" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "lesson";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "lecture";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "assignment";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "note";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "order";