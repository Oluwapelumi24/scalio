CREATE TABLE "content_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"data_base64" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"media_id" uuid,
	"brief" text,
	"tone" text,
	"caption" text DEFAULT '' NOT NULL,
	"hashtags" text[] DEFAULT '{}' NOT NULL,
	"call_to_action" text,
	"platforms" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"planned_for" timestamp with time zone,
	"posted_at" timestamp with time zone,
	"posted_platforms" text[] DEFAULT '{}' NOT NULL,
	"ai_generated" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"source" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'new' NOT NULL,
	"assigned_staff_id" uuid,
	"follow_up_at" timestamp with time zone,
	"customer_id" uuid,
	"content_post_id" uuid,
	"converted_at" timestamp with time zone,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_media_id_content_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."content_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_content_post_id_content_posts_id_fk" FOREIGN KEY ("content_post_id") REFERENCES "public"."content_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_posts_vendor_status_idx" ON "content_posts" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "leads_vendor_status_idx" ON "leads" USING btree ("vendor_id","status");