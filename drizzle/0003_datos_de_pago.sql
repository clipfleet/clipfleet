CREATE TABLE "payment_details" (
	"user_id" text PRIMARY KEY NOT NULL,
	"holder_name" text NOT NULL,
	"account" text,
	"account_kind" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_details" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "paid_to_account" text;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "paid_to_holder" text;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "paid_from_holder" text;--> statement-breakpoint
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;