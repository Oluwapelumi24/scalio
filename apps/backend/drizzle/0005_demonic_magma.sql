ALTER TABLE "staff" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "staff" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_email_unique" UNIQUE("email");