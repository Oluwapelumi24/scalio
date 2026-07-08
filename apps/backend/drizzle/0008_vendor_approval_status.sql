ALTER TABLE "vendors" ADD COLUMN "approval_status" text NOT NULL DEFAULT 'approved';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "reviewed_by_id" uuid;
