ALTER TABLE "curriculums" DROP CONSTRAINT "curriculums_class_id_classes_id_fk";
--> statement-breakpoint
DROP INDEX "curriculums_class_id_idx";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "class_id";--> statement-breakpoint
ALTER TABLE "curriculums" DROP COLUMN "status";