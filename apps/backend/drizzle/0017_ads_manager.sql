CREATE TABLE "meta_user_access" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"meta_user_id" text NOT NULL,
	"token_enc" text NOT NULL,
	"expires_at" timestamp with time zone,
	"granted_scopes" text[] DEFAULT '{}' NOT NULL,
	"connected_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_accounts" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"meta_ad_account_id" text NOT NULL,
	"name" text NOT NULL,
	"currency" text NOT NULL,
	"timezone" text,
	"owned_by" text DEFAULT 'vendor' NOT NULL,
	"meta_status" integer NOT NULL,
	"has_payment_method" boolean DEFAULT false NOT NULL,
	"payment_method_label" text,
	"status" text DEFAULT 'active' NOT NULL,
	"last_error" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"chosen_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meta_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "meta_user_access" ADD CONSTRAINT "meta_user_access_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_user_access" ADD CONSTRAINT "meta_user_access_connected_by_id_staff_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_chosen_by_id_staff_id_fk" FOREIGN KEY ("chosen_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meta_user_access_meta_user_idx" ON "meta_user_access" USING btree ("meta_user_id");--> statement-breakpoint
CREATE INDEX "meta_webhook_events_unprocessed_idx" ON "meta_webhook_events" USING btree ("processed_at","received_at");
