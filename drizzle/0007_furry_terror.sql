ALTER TYPE "public"."user_role" ADD VALUE 'TUTOR';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "userCode" varchar(6);