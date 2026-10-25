CREATE TABLE "ad_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mode" text NOT NULL,
	"objective" text NOT NULL,
	"destination" text NOT NULL,
	"route" text NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"daily_budget_kobo" integer NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"paid_spend_kobo" integer DEFAULT 0 NOT NULL,
	"targeting" jsonb NOT NULL,
	"creative" jsonb NOT NULL,
	"extras" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"media_id" uuid,
	"meta_ad_account_id" text,
	"meta_campaign_id" text,
	"meta_ad_set_id" text,
	"meta_creative_id" text,
	"meta_ad_id" text,
	"meta_status" text,
	"review_note" text,
	"spent_kobo" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_by_id" uuid,
	"launched_at" timestamp with time zone,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"extra_days" integer,
	"route" text NOT NULL,
	"spend_kobo" integer NOT NULL,
	"vat_kobo" integer NOT NULL,
	"fee_kobo" integer NOT NULL,
	"credit_used_kobo" integer DEFAULT 0 NOT NULL,
	"amount_due_kobo" integer NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "ad_credit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"campaign_id" uuid,
	"amount_kobo" integer NOT NULL,
	"reason" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ad_credit_entries_dedupe_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "scalio_page_access" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"status" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_media_id_content_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."content_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_credit_entries" ADD CONSTRAINT "ad_credit_entries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_credit_entries" ADD CONSTRAINT "ad_credit_entries_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scalio_page_access" ADD CONSTRAINT "scalio_page_access_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_campaigns_vendor_idx" ON "ad_campaigns" USING btree ("vendor_id","created_at");--> statement-breakpoint
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_payments_campaign_idx" ON "ad_payments" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "ad_credit_entries_vendor_idx" ON "ad_credit_entries" USING btree ("vendor_id");
