ALTER TABLE "bookings" ADD COLUMN "paystack_reference" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_paystack_reference_unique" UNIQUE("paystack_reference");