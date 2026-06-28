CREATE TYPE "public"."notification_action" AS ENUM('VIEW', 'CONTACT', 'PAYMENT', 'UPDATE');--> statement-breakpoint
ALTER TABLE "notifications" RENAME COLUMN "subtype" TO "action_type";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_student_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'ADMIN', 'TUTOR', 'PARENT');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'STUDENT'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
DROP INDEX "users_role_idx";--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "is_read" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sender_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "sub_content" varchar(255);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "redirect_url" varchar(500);--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_label" varchar(100) DEFAULT 'Xem chi tiết';--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;