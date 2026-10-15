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
CREATE INDEX "audit_events_vendor_created_idx" ON "audit_events" USING btree ("vendor_id","created_at");--> statement-breakpoint
CREATE INDEX "expenses_vendor_spent_idx" ON "expenses" USING btree ("vendor_id","spent_on");--> statement-breakpoint
CREATE INDEX "ledger_entries_vendor_occurred_idx" ON "ledger_entries" USING btree ("vendor_id","occurred_at");