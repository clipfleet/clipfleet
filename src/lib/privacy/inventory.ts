/**
 * Inventario de datos personales: cada columna de la base, clasificada. Es la fuente de la
 * Política de privacidad (`src/app/(public)/privacidad/page.tsx`).
 *
 * REGLA: todo cambio que toque datos personales actualiza la política en el mismo pull request.
 * Los tests de `inventory.test.ts` la hacen cumplir: una tabla o columna nueva no pasa el CI
 * hasta que se clasifica acá, y un cambio en este inventario no pasa hasta que se revisa la
 * política y se actualiza `policy.ts`.
 */

/** Secciones de "Qué datos guardamos" en la política. */
export const DATA_SECTIONS = {
  cuenta: "Tu cuenta",
  perfil: "Tu perfil",
  actividad: "Tu actividad",
  pagos: "Datos de pago",
  conversaciones: "Mensajes y reseñas",
  tecnicos: "Datos técnicos",
} as const;

export type DataSection = keyof typeof DATA_SECTIONS;

type TableInventory = {
  /** Columnas con datos personales y la sección de la política que las explica. */
  personal: Record<string, DataSection>;
  /** Columnas sin datos personales: identificadores internos, estados, fechas, configuración. */
  other: string[];
};

export const PERSONAL_DATA_INVENTORY: Record<string, TableInventory> = {
  user: {
    personal: { name: "cuenta", email: "cuenta", username: "cuenta", image: "cuenta" },
    other: ["id", "emailVerified", "createdAt", "updatedAt", "role"],
  },
  account: {
    // La contraseña se guarda como hash; los tokens son de proveedores de ingreso (hoy sin uso).
    personal: { password: "cuenta", accessToken: "cuenta", refreshToken: "cuenta", idToken: "cuenta" },
    other: ["id", "accountId", "providerId", "userId", "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "createdAt", "updatedAt"],
  },
  verification: {
    personal: { identifier: "cuenta", value: "cuenta" },
    other: ["id", "expiresAt", "createdAt", "updatedAt"],
  },
  session: {
    personal: { ipAddress: "tecnicos", userAgent: "tecnicos", token: "tecnicos" },
    other: ["id", "expiresAt", "createdAt", "updatedAt", "userId"],
  },
  rate_limits: {
    // La clave es un hash de la IP, el email o el usuario: no se guardan en claro.
    personal: { key: "tecnicos" },
    other: ["count", "windowStart"],
  },
  worker_profiles: {
    personal: { headline: "perfil", bio: "perfil", portfolioLinks: "perfil", country: "perfil" },
    other: ["userId", "categories"],
  },
  hirer_profiles: {
    personal: { brandName: "perfil", description: "perfil", channels: "perfil" },
    other: ["userId"],
  },
  jobs: {
    personal: { title: "actividad", description: "actividad" },
    other: ["id", "hirerId", "category", "platform", "platformName", "payRule", "slots", "status", "createdAt"],
  },
  applications: {
    personal: { message: "actividad" },
    other: ["id", "jobId", "workerId", "status", "createdAt"],
  },
  invites: {
    personal: { title: "actividad" },
    other: ["id", "hirerId", "token", "category", "platform", "platformName", "payRule", "expiresAt", "usedBy", "usedAt", "createdAt"],
  },
  contracts: {
    personal: { title: "actividad" },
    other: ["id", "jobId", "hirerId", "workerId", "origin", "category", "platform", "platformName", "payRule", "feeBps", "feePayer", "status", "startedAt", "endedAt"],
  },
  deliverables: {
    personal: { title: "actividad", url: "actividad", accountHandle: "actividad", views: "actividad" },
    other: ["id", "contractId", "kind", "platform", "dueAt", "submittedAt", "status", "viewsSource", "qualityRating", "reviewedAt", "createdAt"],
  },
  view_snapshots: {
    personal: { views: "actividad", evidenceUrl: "actividad" },
    other: ["id", "deliverableId", "source", "status", "capturedAt", "decidedAt"],
  },
  payouts: {
    personal: { amount: "pagos", paidToAccount: "pagos", paidToHolder: "pagos", paidFromHolder: "pagos" },
    other: ["id", "contractId", "periodStart", "periodEnd", "fee", "hirerDebit", "workerCredit", "status", "settlement", "createdAt", "releasedAt", "confirmedAt"],
  },
  payout_items: {
    personal: { amount: "pagos" },
    other: ["id", "payoutId", "deliverableId", "views", "reason"],
  },
  payment_details: {
    personal: { holderName: "pagos", account: "pagos", accountKind: "pagos" },
    other: ["userId", "updatedAt"],
  },
  messages: {
    personal: { body: "conversaciones" },
    other: ["id", "contractId", "authorId", "createdAt"],
  },
  reviews: {
    personal: { rating: "conversaciones", comment: "conversaciones" },
    other: ["id", "contractId", "authorId", "targetId", "createdAt"],
  },
  // Tablas del modo "pagos dentro de la plataforma", hoy sin uso (ver DESIGN.md).
  withdrawals: {
    personal: { destination: "pagos", note: "pagos", amount: "pagos" },
    other: ["id", "workerId", "status", "processedBy", "processedAt", "createdAt"],
  },
  deposits: {
    personal: { amount: "pagos" },
    other: ["id", "hirerId", "provider", "providerRef", "status", "createdAt", "confirmedAt"],
  },
  ledger_accounts: { personal: {}, other: ["id", "ownerId", "kind", "currency"] },
  ledger_entries: {
    personal: { amount: "pagos" },
    other: ["id", "accountId", "type", "payoutId", "depositId", "withdrawalId", "createdAt"],
  },
  platform_settings: {
    personal: {},
    other: ["id", "paymentsMode", "feeBps", "feePayer", "withdrawalMode", "currency", "minWithdrawal", "updatedAt"],
  },
};
