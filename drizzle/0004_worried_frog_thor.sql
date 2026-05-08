CREATE TYPE "public"."wallet_type" AS ENUM('CASH', 'BANK', 'E_WALLET', 'CREDIT');--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "wallet_type" DEFAULT 'CASH' NOT NULL,
	"currency" varchar(3) DEFAULT 'VND' NOT NULL,
	"categories_id" uuid[] DEFAULT '{}' NOT NULL,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"note" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_user_name_unique" ON "wallets" USING btree ("user_id","name");