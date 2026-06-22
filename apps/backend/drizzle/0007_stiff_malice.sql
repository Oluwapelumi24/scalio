CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "rating" real;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "review_count" integer;