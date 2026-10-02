ALTER TABLE "platform_settings" ALTER COLUMN "fee_bps" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "settlement" text DEFAULT 'external' NOT NULL;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD COLUMN "payments_mode" text DEFAULT 'external' NOT NULL;