ALTER TABLE "staff_pay" ADD COLUMN "commission_bps" integer;
--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD COLUMN "salary_kobo" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD COLUMN "commission_kobo" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD COLUMN "sales_kobo" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "salary_payouts" ADD COLUMN "commission_bps" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "salary_payouts" SET "salary_kobo" = "amount_kobo" WHERE "salary_kobo" = 0 AND "commission_kobo" = 0;
