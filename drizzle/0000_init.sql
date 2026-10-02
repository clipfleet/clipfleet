CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text,
	"hirer_id" text NOT NULL,
	"worker_id" text NOT NULL,
	"origin" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"pay_rule" jsonb NOT NULL,
	"fee_bps" integer NOT NULL,
	"fee_payer" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'post' NOT NULL,
	"url" text,
	"platform" text,
	"account_handle" text,
	"due_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"status" text NOT NULL,
	"views" bigint DEFAULT 0 NOT NULL,
	"views_source" text DEFAULT 'manual' NOT NULL,
	"quality_rating" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"hirer_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "hirer_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"brand_name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"channels" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"hirer_id" text NOT NULL,
	"token" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"pay_rule" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_by" text,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"hirer_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"pay_rule" jsonb NOT NULL,
	"slots" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text,
	"kind" text NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"type" text NOT NULL,
	"payout_id" text,
	"deposit_id" text,
	"withdrawal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_items" (
	"id" text PRIMARY KEY NOT NULL,
	"payout_id" text NOT NULL,
	"deliverable_id" text NOT NULL,
	"views" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"amount" bigint NOT NULL,
	"fee" bigint NOT NULL,
	"hirer_debit" bigint NOT NULL,
	"worker_credit" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"fee_bps" integer DEFAULT 300 NOT NULL,
	"fee_payer" text DEFAULT 'hirer' NOT NULL,
	"withdrawal_mode" text DEFAULT 'manual' NOT NULL,
	"currency" text DEFAULT 'ARS' NOT NULL,
	"min_withdrawal" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_id" text NOT NULL,
	"author_id" text NOT NULL,
	"target_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"role" text NOT NULL,
	"username" text NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"deliverable_id" text NOT NULL,
	"views" bigint NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"evidence_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" text PRIMARY KEY NOT NULL,
	"worker_id" text NOT NULL,
	"amount" bigint NOT NULL,
	"destination" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"note" text,
	"processed_by" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"portfolio_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"country" text DEFAULT 'Argentina' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_worker_id_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_hirer_id_user_id_fk" FOREIGN KEY ("hirer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_worker_id_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_hirer_id_user_id_fk" FOREIGN KEY ("hirer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hirer_profiles" ADD CONSTRAINT "hirer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_hirer_id_user_id_fk" FOREIGN KEY ("hirer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_used_by_user_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hirer_id_user_id_fk" FOREIGN KEY ("hirer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_accounts" ADD CONSTRAINT "ledger_accounts_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."ledger_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_deliverable_id_deliverables_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_id_user_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_snapshots" ADD CONSTRAINT "view_snapshots_deliverable_id_deliverables_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_worker_id_user_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applications_job_worker_uq" ON "applications" USING btree ("job_id","worker_id");--> statement-breakpoint
CREATE INDEX "contracts_hirer_idx" ON "contracts" USING btree ("hirer_id");--> statement-breakpoint
CREATE INDEX "contracts_worker_idx" ON "contracts" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "deliverables_contract_idx" ON "deliverables" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "jobs_hirer_idx" ON "jobs" USING btree ("hirer_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_owner_kind_uq" ON "ledger_accounts" USING btree ("owner_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_accounts_platform_uq" ON "ledger_accounts" USING btree ("kind") WHERE "ledger_accounts"."owner_id" is null;--> statement-breakpoint
CREATE INDEX "ledger_entries_account_idx" ON "ledger_entries" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_payout_uq" ON "ledger_entries" USING btree ("payout_id","account_id","type") WHERE "ledger_entries"."payout_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_deposit_uq" ON "ledger_entries" USING btree ("deposit_id") WHERE "ledger_entries"."deposit_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_entries_withdrawal_uq" ON "ledger_entries" USING btree ("withdrawal_id","type") WHERE "ledger_entries"."withdrawal_id" is not null;--> statement-breakpoint
CREATE INDEX "messages_contract_idx" ON "messages" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "payout_items_payout_idx" ON "payout_items" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "payout_items_deliverable_idx" ON "payout_items" USING btree ("deliverable_id");--> statement-breakpoint
CREATE INDEX "payouts_contract_idx" ON "payouts" USING btree ("contract_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_contract_author_uq" ON "reviews" USING btree ("contract_id","author_id");--> statement-breakpoint
CREATE INDEX "view_snapshots_deliverable_idx" ON "view_snapshots" USING btree ("deliverable_id");