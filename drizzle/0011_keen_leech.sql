ALTER TABLE "classes" DROP CONSTRAINT "classes_users_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "users_id" SET DEFAULT '{}';
--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "users_id" SET NOT NULL;
