CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"service_type" text DEFAULT 'service' NOT NULL,
	"name" text NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price_kobo" integer NOT NULL,
	"payment_mode" text DEFAULT 'pay_on_arrival' NOT NULL,
	"deposit_percent" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"role" text NOT NULL,
	"password_hash" text,
	"last_login_at" timestamp with time zone,
	"notifications_read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"business_name" text NOT NULL,
	"category" text NOT NULL,
	"logo_url" text,
	"theme_color" text,
	"slot_interval_minutes" integer DEFAULT 30 NOT NULL,
	"average_days_between_visits" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"address" text,
	"description" text,
	"owner_name" text,
	"owner_email" text,
	"rating" real,
	"review_count" integer,
	"registration_number" text,
	"timezone" text DEFAULT 'Africa/Lagos' NOT NULL,
	"approval_status" text DEFAULT 'pending_review' NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"password_hash" text,
	"expo_push_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"lifetime_value_kobo" integer DEFAULT 0 NOT NULL,
	"no_show_count" integer DEFAULT 0 NOT NULL,
	"last_visit_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_vendor_phone_unique" UNIQUE("vendor_id","phone"),
	CONSTRAINT "customers_vendor_user_unique" UNIQUE("vendor_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"staff_id" uuid,
	"service_ids" uuid[] NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"payment_mode" text NOT NULL,
	"amount_due_kobo" integer NOT NULL,
	"amount_paid_kobo" integer DEFAULT 0 NOT NULL,
	"total_price_kobo" integer DEFAULT 0 NOT NULL,
	"paystack_reference" text,
	"cancellation_reason" text,
	"reminder_sent_at" timestamp with time zone,
	"lock_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_paystack_reference_unique" UNIQUE("paystack_reference")
);
--> statement-breakpoint
CREATE TABLE "blackout_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"date" date NOT NULL,
	"reason" text,
	CONSTRAINT "blackout_dates_vendor_date_unique" UNIQUE("vendor_id","date")
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"opens_at_minutes" integer NOT NULL,
	"closes_at_minutes" integer NOT NULL,
	CONSTRAINT "business_hours_vendor_day_unique" UNIQUE("vendor_id","day_of_week")
);
--> statement-breakpoint
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
CREATE TABLE "waitlist_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"audience" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_signups_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"clock_in_at" timestamp with time zone NOT NULL,
	"clock_out_at" timestamp with time zone,
	"source" text DEFAULT 'self' NOT NULL,
	"recorded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_working_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"starts_at_minutes" integer NOT NULL,
	"ends_at_minutes" integer NOT NULL,
	"break_starts_at_minutes" integer,
	"break_ends_at_minutes" integer,
	CONSTRAINT "staff_working_hours_staff_day_unique" UNIQUE("staff_id","day_of_week")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"actor_staff_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"amount_kobo" integer NOT NULL,
	"category" text NOT NULL,
	"spent_on" date NOT NULL,
	"note" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"voided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"direction" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"booking_id" uuid,
	"salary_payout_id" uuid,
	"expense_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_entries_vendor_dedupe_unique" UNIQUE("vendor_id","dedupe_key")
);
--> statement-breakpoint
CREATE TABLE "payroll_schedules" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"pay_day" integer NOT NULL,
	"opens_days_before" integer DEFAULT 3 NOT NULL,
	"closes_days_after" integer DEFAULT 5 NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"staff_id" uuid,
	"staff_name" text NOT NULL,
	"amount_kobo" integer NOT NULL,
	"salary_kobo" integer DEFAULT 0 NOT NULL,
	"commission_kobo" integer DEFAULT 0 NOT NULL,
	"sales_kobo" integer DEFAULT 0 NOT NULL,
	"commission_bps" integer DEFAULT 0 NOT NULL,
	"bank_name" text NOT NULL,
	"account_number_enc" text NOT NULL,
	"account_last4" text NOT NULL,
	"account_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text,
	"paid_at" timestamp with time zone,
	"recorded_by_id" uuid,
	CONSTRAINT "salary_payouts_run_staff_unique" UNIQUE("run_id","staff_id")
);
--> statement-breakpoint
CREATE TABLE "salary_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"period" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "salary_runs_vendor_period_unique" UNIQUE("vendor_id","period")
);
--> statement-breakpoint
CREATE TABLE "staff_pay" (
	"staff_id" uuid PRIMARY KEY NOT NULL,
	"vendor_id" uuid NOT NULL,
	"monthly_salary_kobo" integer,
	"commission_bps" integer,
	"bank_code" text,
	"bank_name" text,
	"account_number_enc" text,
	"account_last4" text,
	"account_name" text,
	"verified_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_payout_accounts" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"bank_code" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number_enc" text NOT NULL,
	"account_last4" text NOT NULL,
	"account_name" text NOT NULL,
	"paystack_subaccount_code" text,
	"verified_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "content_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"container_id" text,
	"container_created_at" timestamp with time zone,
	"external_id" text,
	"permalink" text,
	"error" text,
	"requested_by_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_publications_post_platform_unique" UNIQUE("post_id","platform")
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
CREATE TABLE "social_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"external_id" text NOT NULL,
	"display_name" text NOT NULL,
	"access_token_enc" text NOT NULL,
	"meta_user_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_error" text,
	"connected_by_id" uuid,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_connections_vendor_platform_unique" UNIQUE("vendor_id","platform")
);
--> statement-breakpoint
CREATE TABLE "feedback_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"staff_id" uuid,
	"token" text NOT NULL,
	"emailed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"rating" integer,
	"comment" text,
	"submitted_at" timestamp with time zone,
	"followed_up_at" timestamp with time zone,
	"followed_up_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_requests_booking_id_unique" UNIQUE("booking_id"),
	CONSTRAINT "feedback_requests_token_unique" UNIQUE("token")
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
CREATE TABLE "meta_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"business_external_id" text NOT NULL,
	"customer_external_id" text NOT NULL,
	"customer_name" text,
	"lead_id" uuid,
	"ad_referral" jsonb,
	"last_message_at" timestamp with time zone NOT NULL,
	"last_message_preview" text,
	"last_customer_message_at" timestamp with time zone,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"ai_due_at" timestamp with time zone,
	"ai_suggestion" text,
	"ai_paused" boolean DEFAULT false NOT NULL,
	"handoff_reason" text,
	"handoff_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_vendor_channel_customer_unique" UNIQUE("vendor_id","channel","customer_external_id")
);
--> statement-breakpoint
CREATE TABLE "inbox_settings" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"ai_modes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"faq" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_by_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"direction" text NOT NULL,
	"sent_by" text NOT NULL,
	"external_id" text,
	"text" text DEFAULT '' NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"human_agent_tag" boolean DEFAULT false NOT NULL,
	"staff_id" uuid,
	"sent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "messages_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
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
CREATE TABLE "veno_page_access" (
	"vendor_id" uuid PRIMARY KEY NOT NULL,
	"page_id" text NOT NULL,
	"status" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vendor_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"staff_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"booking_id" uuid,
	"conversation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blackout_dates" ADD CONSTRAINT "blackout_dates_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_preferences" ADD CONSTRAINT "business_preferences_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_id_staff_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_time_off" ADD CONSTRAINT "staff_time_off_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_working_hours" ADD CONSTRAINT "staff_working_hours_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_working_hours" ADD CONSTRAINT "staff_working_hours_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_staff_id_staff_id_fk" FOREIGN KEY ("actor_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_salary_payout_id_salary_payouts_id_fk" FOREIGN KEY ("salary_payout_id") REFERENCES "public"."salary_payouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_schedules" ADD CONSTRAINT "payroll_schedules_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD CONSTRAINT "salary_payouts_run_id_salary_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."salary_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD CONSTRAINT "salary_payouts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD CONSTRAINT "salary_payouts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD CONSTRAINT "salary_payouts_recorded_by_id_staff_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_runs" ADD CONSTRAINT "salary_runs_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_runs" ADD CONSTRAINT "salary_runs_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_pay" ADD CONSTRAINT "staff_pay_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_pay" ADD CONSTRAINT "staff_pay_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_payout_accounts" ADD CONSTRAINT "vendor_payout_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_media" ADD CONSTRAINT "content_media_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_media_id_content_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."content_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_post_id_content_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."content_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_publications" ADD CONSTRAINT "content_publications_requested_by_id_staff_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_content_post_id_content_posts_id_fk" FOREIGN KEY ("content_post_id") REFERENCES "public"."content_posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_connected_by_id_staff_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_requests" ADD CONSTRAINT "feedback_requests_followed_up_by_id_staff_id_fk" FOREIGN KEY ("followed_up_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_accounts" ADD CONSTRAINT "ad_accounts_chosen_by_id_staff_id_fk" FOREIGN KEY ("chosen_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_user_access" ADD CONSTRAINT "meta_user_access_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_user_access" ADD CONSTRAINT "meta_user_access_connected_by_id_staff_id_fk" FOREIGN KEY ("connected_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_settings" ADD CONSTRAINT "inbox_settings_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_settings" ADD CONSTRAINT "inbox_settings_updated_by_id_staff_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_media_id_content_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."content_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_credit_entries" ADD CONSTRAINT "ad_credit_entries_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_credit_entries" ADD CONSTRAINT "ad_credit_entries_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_campaign_id_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."ad_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_payments" ADD CONSTRAINT "ad_payments_created_by_id_staff_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veno_page_access" ADD CONSTRAINT "veno_page_access_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_notifications" ADD CONSTRAINT "vendor_notifications_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_notifications" ADD CONSTRAINT "vendor_notifications_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_notifications" ADD CONSTRAINT "vendor_notifications_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_notifications" ADD CONSTRAINT "vendor_notifications_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_active_slot_unique" ON "bookings" USING btree ("vendor_id","staff_id","scheduled_at") WHERE "bookings"."status" in ('pending_payment', 'confirmed');--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_one_open_shift" ON "attendance_records" USING btree ("staff_id") WHERE "attendance_records"."clock_out_at" is null;--> statement-breakpoint
CREATE INDEX "attendance_vendor_clock_in_idx" ON "attendance_records" USING btree ("vendor_id","clock_in_at");--> statement-breakpoint
CREATE INDEX "staff_time_off_staff_idx" ON "staff_time_off" USING btree ("staff_id","start_date");--> statement-breakpoint
CREATE INDEX "audit_events_vendor_created_idx" ON "audit_events" USING btree ("vendor_id","created_at");--> statement-breakpoint
CREATE INDEX "expenses_vendor_spent_idx" ON "expenses" USING btree ("vendor_id","spent_on");--> statement-breakpoint
CREATE INDEX "ledger_entries_vendor_occurred_idx" ON "ledger_entries" USING btree ("vendor_id","occurred_at");--> statement-breakpoint
CREATE INDEX "content_posts_vendor_status_idx" ON "content_posts" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "content_publications_due_idx" ON "content_publications" USING btree ("status","run_at");--> statement-breakpoint
CREATE INDEX "leads_vendor_status_idx" ON "leads" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE INDEX "social_connections_meta_user_idx" ON "social_connections" USING btree ("meta_user_id");--> statement-breakpoint
CREATE INDEX "feedback_requests_vendor_submitted_idx" ON "feedback_requests" USING btree ("vendor_id","submitted_at");--> statement-breakpoint
CREATE INDEX "meta_user_access_meta_user_idx" ON "meta_user_access" USING btree ("meta_user_id");--> statement-breakpoint
CREATE INDEX "meta_webhook_events_unprocessed_idx" ON "meta_webhook_events" USING btree ("processed_at","received_at");--> statement-breakpoint
CREATE INDEX "conversations_vendor_last_idx" ON "conversations" USING btree ("vendor_id","last_message_at");--> statement-breakpoint
CREATE INDEX "conversations_ai_due_idx" ON "conversations" USING btree ("ai_due_at");--> statement-breakpoint
CREATE INDEX "messages_conversation_sent_idx" ON "messages" USING btree ("conversation_id","sent_at");--> statement-breakpoint
CREATE INDEX "ad_campaigns_vendor_idx" ON "ad_campaigns" USING btree ("vendor_id","created_at");--> statement-breakpoint
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ad_credit_entries_vendor_idx" ON "ad_credit_entries" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "ad_payments_campaign_idx" ON "ad_payments" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "vendor_notifications_vendor_created_idx" ON "vendor_notifications" USING btree ("vendor_id","created_at");