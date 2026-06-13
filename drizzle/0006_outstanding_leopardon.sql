DROP INDEX "transactions_wallet_id_category_id_unique";--> statement-breakpoint
CREATE INDEX "transactions_user_id_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_wallet_id_idx" ON "transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "transactions_category_id_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");