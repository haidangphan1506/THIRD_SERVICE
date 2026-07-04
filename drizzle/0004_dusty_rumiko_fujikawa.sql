DO $$ BEGIN
  CREATE TYPE "public"."class_session_status" AS ENUM('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
