CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contracts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deliverables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deposits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hirer_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ledger_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payout_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "platform_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "view_snapshots" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "withdrawals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "worker_profiles" ENABLE ROW LEVEL SECURITY;