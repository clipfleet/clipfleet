import { sql } from "drizzle-orm";
import { bigint, boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { PayRule } from "@/lib/payrules";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const ts = (name: string) => timestamp(name, { withTimezone: true });
/** Centavos enteros. */
const money = (name: string) => bigint(name, { mode: "number" });

// Todas las tablas llevan Row Level Security activado y ninguna política: la app se conecta
// como dueña de las tablas (no le aplica), y cualquier otro rol —por ejemplo la API pública
// de datos de Supabase— no puede leer ni escribir nada.

// --- Autenticación (tablas que espera better-auth) ---

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  role: text("role", { enum: ["hirer", "worker", "admin"] }).notNull(),
  username: text("username").notNull().unique(),
}).enableRLS();

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
}).enableRLS();

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: ts("access_token_expires_at"),
  refreshTokenExpiresAt: ts("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// --- Perfiles ---

export const workerProfiles = pgTable("worker_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  headline: text("headline").notNull().default(""),
  bio: text("bio").notNull().default(""),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  portfolioLinks: jsonb("portfolio_links").$type<string[]>().notNull().default([]),
  country: text("country").notNull().default("Argentina"),
}).enableRLS();

export const hirerProfiles = pgTable("hirer_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  brandName: text("brand_name").notNull(),
  description: text("description").notNull().default(""),
  channels: jsonb("channels").$type<string[]>().notNull().default([]),
}).enableRLS();

// --- Búsquedas y contrataciones ---

export const jobs = pgTable(
  "jobs",
  {
    id: id(),
    hirerId: text("hirer_id")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    payRule: jsonb("pay_rule").$type<PayRule>().notNull(),
    slots: integer("slots").notNull().default(1),
    status: text("status", { enum: ["open", "paused", "closed"] })
      .notNull()
      .default("open"),
    createdAt: createdAt(),
  },
  (t) => [index("jobs_hirer_idx").on(t.hirerId), index("jobs_status_idx").on(t.status)],
).enableRLS();

export const applications = pgTable(
  "applications",
  {
    id: id(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id),
    workerId: text("worker_id")
      .notNull()
      .references(() => user.id),
    message: text("message").notNull().default(""),
    status: text("status", { enum: ["pending", "accepted", "rejected"] })
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("applications_job_worker_uq").on(t.jobId, t.workerId)],
).enableRLS();

export const invites = pgTable("invites", {
  id: id(),
  hirerId: text("hirer_id")
    .notNull()
    .references(() => user.id),
  token: text("token").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  payRule: jsonb("pay_rule").$type<PayRule>().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedBy: text("used_by").references(() => user.id),
  usedAt: ts("used_at"),
  createdAt: createdAt(),
}).enableRLS();

export const contracts = pgTable(
  "contracts",
  {
    id: id(),
    jobId: text("job_id").references(() => jobs.id),
    hirerId: text("hirer_id")
      .notNull()
      .references(() => user.id),
    workerId: text("worker_id")
      .notNull()
      .references(() => user.id),
    origin: text("origin", { enum: ["job", "invite"] }).notNull(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    // Copias al momento de contratar: cambiar la búsqueda o la configuración no altera el acuerdo.
    payRule: jsonb("pay_rule").$type<PayRule>().notNull(),
    feeBps: integer("fee_bps").notNull(),
    feePayer: text("fee_payer", { enum: ["hirer", "worker"] }).notNull(),
    status: text("status", { enum: ["active", "ended"] })
      .notNull()
      .default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    endedAt: ts("ended_at"),
  },
  (t) => [index("contracts_hirer_idx").on(t.hirerId), index("contracts_worker_idx").on(t.workerId)],
).enableRLS();

export const deliverables = pgTable(
  "deliverables",
  {
    id: id(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    title: text("title").notNull().default(""),
    kind: text("kind", { enum: ["post", "file"] })
      .notNull()
      .default("post"),
    url: text("url"),
    platform: text("platform"),
    accountHandle: text("account_handle"),
    dueAt: ts("due_at"),
    submittedAt: ts("submitted_at"),
    status: text("status", { enum: ["requested", "submitted", "approved", "rejected"] }).notNull(),
    views: bigint("views", { mode: "number" }).notNull().default(0),
    viewsSource: text("views_source", { enum: ["manual", "api"] })
      .notNull()
      .default("manual"),
    qualityRating: integer("quality_rating"),
    reviewedAt: ts("reviewed_at"),
    createdAt: createdAt(),
  },
  (t) => [index("deliverables_contract_idx").on(t.contractId)],
).enableRLS();

export const viewSnapshots = pgTable(
  "view_snapshots",
  {
    id: id(),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverables.id),
    views: bigint("views", { mode: "number" }).notNull(),
    source: text("source", { enum: ["manual", "api"] })
      .notNull()
      .default("manual"),
    evidenceUrl: text("evidence_url"),
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: ts("decided_at"),
  },
  (t) => [index("view_snapshots_deliverable_idx").on(t.deliverableId)],
).enableRLS();

// --- Dinero ---

export const payouts = pgTable(
  "payouts",
  {
    id: id(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    /** Lo acordado según la regla de pago. */
    amount: money("amount").notNull(),
    fee: money("fee").notNull(),
    hirerDebit: money("hirer_debit").notNull(),
    workerCredit: money("worker_credit").notNull(),
    /** `pending`: calculada, falta pagar. `released`: pagada. */
    status: text("status", { enum: ["pending", "released"] })
      .notNull()
      .default("pending"),
    /** `external`: las partes se pagan por fuera y el contratador lo informa. `ledger`: la plata pasó por la plataforma. */
    settlement: text("settlement", { enum: ["external", "ledger"] })
      .notNull()
      .default("external"),
    createdAt: createdAt(),
    releasedAt: ts("released_at"),
    /** Cuándo el trabajador confirmó que recibió un pago hecho por fuera. */
    confirmedAt: ts("confirmed_at"),
    // Copia de los datos de pago al marcar "pagado": si después alguien cambia los suyos,
    // el registro de este pago no cambia.
    paidToAccount: text("paid_to_account"),
    paidToHolder: text("paid_to_holder"),
    paidFromHolder: text("paid_from_holder"),
  },
  (t) => [index("payouts_contract_idx").on(t.contractId)],
).enableRLS();

export const payoutItems = pgTable(
  "payout_items",
  {
    id: id(),
    payoutId: text("payout_id")
      .notNull()
      .references(() => payouts.id, { onDelete: "cascade" }),
    deliverableId: text("deliverable_id")
      .notNull()
      .references(() => deliverables.id),
    /** Vistas congeladas al generar la liquidación. */
    views: bigint("views", { mode: "number" }).notNull(),
    amount: money("amount").notNull(),
    reason: text("reason").notNull(),
  },
  (t) => [index("payout_items_payout_idx").on(t.payoutId), index("payout_items_deliverable_idx").on(t.deliverableId)],
).enableRLS();

export const ledgerAccounts = pgTable(
  "ledger_accounts",
  {
    id: id(),
    ownerId: text("owner_id").references(() => user.id),
    kind: text("kind", { enum: ["hirer", "worker", "platform_fees"] }).notNull(),
    currency: text("currency").notNull().default("ARS"),
  },
  (t) => [
    uniqueIndex("ledger_accounts_owner_kind_uq").on(t.ownerId, t.kind),
    uniqueIndex("ledger_accounts_platform_uq")
      .on(t.kind)
      .where(sql`${t.ownerId} is null`),
  ],
).enableRLS();

/** Asientos inmutables: nunca se actualizan ni se borran. El saldo es la suma. */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: id(),
    accountId: text("account_id")
      .notNull()
      .references(() => ledgerAccounts.id),
    amount: money("amount").notNull(),
    type: text("type", { enum: ["deposit", "payout", "fee", "withdrawal", "refund"] }).notNull(),
    payoutId: text("payout_id").references(() => payouts.id),
    depositId: text("deposit_id"),
    withdrawalId: text("withdrawal_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("ledger_entries_account_idx").on(t.accountId),
    // Idempotencia: cada hecho genera como mucho un asiento por cuenta y tipo.
    uniqueIndex("ledger_entries_payout_uq")
      .on(t.payoutId, t.accountId, t.type)
      .where(sql`${t.payoutId} is not null`),
    uniqueIndex("ledger_entries_deposit_uq")
      .on(t.depositId)
      .where(sql`${t.depositId} is not null`),
    uniqueIndex("ledger_entries_withdrawal_uq")
      .on(t.withdrawalId, t.type)
      .where(sql`${t.withdrawalId} is not null`),
  ],
).enableRLS();

export const deposits = pgTable("deposits", {
  id: id(),
  hirerId: text("hirer_id")
    .notNull()
    .references(() => user.id),
  amount: money("amount").notNull(),
  provider: text("provider").notNull(),
  providerRef: text("provider_ref"),
  status: text("status", { enum: ["pending", "confirmed", "failed"] })
    .notNull()
    .default("pending"),
  createdAt: createdAt(),
  confirmedAt: ts("confirmed_at"),
}).enableRLS();

export const withdrawals = pgTable("withdrawals", {
  id: id(),
  workerId: text("worker_id")
    .notNull()
    .references(() => user.id),
  amount: money("amount").notNull(),
  /** CBU, CVU o alias al que se transfiere. */
  destination: text("destination").notNull(),
  status: text("status", { enum: ["requested", "sent", "rejected"] })
    .notNull()
    .default("requested"),
  note: text("note"),
  processedBy: text("processed_by").references(() => user.id),
  processedAt: ts("processed_at"),
  createdAt: createdAt(),
}).enableRLS();

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  /** `external`: pagos entre las partes, sin comisión. `platform`: saldo, comisión y retiros dentro de la plataforma. */
  paymentsMode: text("payments_mode", { enum: ["external", "platform"] })
    .notNull()
    .default("external"),
  feeBps: integer("fee_bps").notNull().default(0),
  feePayer: text("fee_payer", { enum: ["hirer", "worker"] })
    .notNull()
    .default("hirer"),
  withdrawalMode: text("withdrawal_mode", { enum: ["manual", "auto"] })
    .notNull()
    .default("manual"),
  currency: text("currency").notNull().default("ARS"),
  minWithdrawal: money("min_withdrawal").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// --- Reputación y comunicación ---

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    targetId: text("target_id")
      .notNull()
      .references(() => user.id),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("reviews_contract_author_uq").on(t.contractId, t.authorId)],
).enableRLS();

export const messages = pgTable(
  "messages",
  {
    id: id(),
    contractId: text("contract_id")
      .notNull()
      .references(() => contracts.id),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_contract_idx").on(t.contractId)],
).enableRLS();

// --- Datos de pago entre las partes ---

/**
 * A dónde cobra un gestor (titular + alias/CBU/CVU) o a nombre de quién paga un contratador
 * (solo titular). Va en tabla propia y no en los perfiles porque los perfiles se leen enteros
 * en páginas públicas: estos datos solo los ve la otra parte de una contratación.
 */
export const paymentDetails = pgTable("payment_details", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  holderName: text("holder_name").notNull(),
  account: text("account"),
  accountKind: text("account_kind", { enum: ["alias", "cbu", "cvu"] }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

// --- Seguridad ---

/** Contadores de límite de frecuencia. La clave es un hash: no guarda IPs ni emails en claro. */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
}).enableRLS();
