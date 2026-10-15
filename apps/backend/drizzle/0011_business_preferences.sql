CREATE TABLE "business_preferences" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"interests" text[] DEFAULT '{}' NOT NULL,
	"pinned_modules" text[] DEFAULT '{}' NOT NULL,
	"hidden_modules" text[] DEFAULT '{}' NOT NULL,
	"module_usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"interests_completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "timezone" text DEFAULT 'Africa/Lagos' NOT NULL;--> statement-breakpoint
ALTER TABLE "business_preferences" ADD CONSTRAINT "business_preferences_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;