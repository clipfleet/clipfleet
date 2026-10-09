import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applications,
  contracts,
  deliverables,
  hirerProfiles,
  invites,
  jobs,
  messages,
  paymentDetails,
  payoutItems,
  payouts,
  reviews,
  user,
  viewSnapshots,
  workerProfiles,
} from "@/lib/db/schema";
import { getPaymentDetails, payeeFor } from "@/lib/payment-details/service";
import { computePayout } from "@/lib/payrules";
import { contractPerformance, workerStats, type WorkerStats } from "@/lib/stats";
import { buildCalendar, countByDay, longestStreak } from "@/lib/stats/activity";
import { earnedBadges, nextBadge } from "@/lib/stats/badges";

// Subconsultas de conteo por fila. Van con nombres calificados a mano: en una consulta sin
// joins Drizzle escribe las columnas sin tabla, y dentro de una subconsulta "id" pasaría a
// ser el de la tabla interna.
const hiredForJob = sql<string>`(select count(*) from "contracts" c where c."job_id" = "jobs"."id")`;
const pendingApplicationsForJob = sql<string>`(select count(*) from "applications" a where a."job_id" = "jobs"."id" and a."status" = 'pending')`;
const paidPayoutsForContract = sql<string>`(select count(*) from "payouts" p where p."contract_id" = "contracts"."id" and p."status" = 'released')`;
const approvedVideosForContract = sql<string>`(select count(*) from "deliverables" d where d."contract_id" = "contracts"."id" and d."status" = 'approved')`;
const approvedViewsForContract = sql<string>`(select coalesce(sum(d."views"), 0) from "deliverables" d where d."contract_id" = "contracts"."id" and d."status" = 'approved')`;

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

// --- Búsquedas públicas ---

export async function listOpenJobs(category?: string) {
  const rows = await db
    .select({
      job: jobs,
      brandName: hirerProfiles.brandName,
      hired: hiredForJob,
    })
    .from(jobs)
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, jobs.hirerId))
    .where(category ? and(eq(jobs.status, "open"), eq(jobs.category, category)) : eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt));
  return rows.map((row) => ({
    ...row.job,
    brandName: row.brandName,
    openSlots: Math.max(0, row.job.slots - Number(row.hired)),
  }));
}

export async function getJob(jobId: string) {
  const [row] = await db
    .select({ job: jobs, hirer: hirerProfiles })
    .from(jobs)
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, jobs.hirerId))
    .where(eq(jobs.id, jobId));
  if (!row) return null;
  const [paid] = await db
    .select({ confirmed: sql<string>`count(*)` })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .where(and(eq(contracts.hirerId, row.job.hirerId), sql`${payouts.confirmedAt} is not null`));
  return {
    ...row.job,
    hirer: row.hirer,
    /** Pagos de este contratador que quienes trabajaron para él confirmaron haber cobrado. */
    hirerConfirmedPayouts: Number(paid.confirmed),
  };
}

export async function getMyApplication(jobId: string, workerId: string) {
  const [row] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.workerId, workerId)));
  return row ?? null;
}

// --- Trabajadores ---

async function statsForWorkers(workerIds: string[]): Promise<Map<string, WorkerStats>> {
  const result = new Map<string, WorkerStats>();
  if (workerIds.length === 0) return result;
  const contractRows = await db
    .select({
      id: contracts.id,
      workerId: contracts.workerId,
      hirerId: contracts.hirerId,
      status: contracts.status,
      released: paidPayoutsForContract,
    })
    .from(contracts)
    .where(inArray(contracts.workerId, workerIds));
  const contractIds = contractRows.map((row) => row.id);
  const deliverableRows = contractIds.length
    ? await db.select().from(deliverables).where(inArray(deliverables.contractId, contractIds))
    : [];
  const deliverablesByContract = groupBy(deliverableRows, (row) => row.contractId);
  const contractsByWorker = groupBy(contractRows, (row) => row.workerId);

  for (const workerId of workerIds) {
    const mine = contractsByWorker.get(workerId) ?? [];
    result.set(
      workerId,
      workerStats(
        mine.flatMap((contract) => deliverablesByContract.get(contract.id) ?? []),
        mine.map((contract) => ({
          hirerId: contract.hirerId,
          status: contract.status,
          hasReleasedPayout: Number(contract.released) > 0,
        })),
      ),
    );
  }
  return result;
}

export async function listWorkers(category?: string) {
  const rows = await db
    .select({ user, profile: workerProfiles })
    .from(user)
    .innerJoin(workerProfiles, eq(workerProfiles.userId, user.id))
    .where(eq(user.role, "worker"));
  const filtered = category ? rows.filter((row) => row.profile.categories.includes(category)) : rows;
  const stats = await statsForWorkers(filtered.map((row) => row.user.id));
  return filtered
    .map((row) => ({
      id: row.user.id,
      name: row.user.name,
      username: row.user.username,
      profile: row.profile,
      stats: stats.get(row.user.id)!,
    }))
    .sort((a, b) => b.stats.totalViews - a.stats.totalViews || b.stats.completedContracts - a.stats.completedContracts);
}

export async function getWorkerByUsername(username: string) {
  const [row] = await db
    .select({ user, profile: workerProfiles })
    .from(user)
    .innerJoin(workerProfiles, eq(workerProfiles.userId, user.id))
    .where(and(eq(user.username, username), eq(user.role, "worker")));
  if (!row) return null;
  const stats = (await statsForWorkers([row.user.id])).get(row.user.id)!;
  const history = await db
    .select({
      id: contracts.id,
      title: contracts.title,
      category: contracts.category,
      status: contracts.status,
      startedAt: contracts.startedAt,
      endedAt: contracts.endedAt,
      brandName: hirerProfiles.brandName,
      views: approvedViewsForContract,
      approved: approvedVideosForContract,
      released: paidPayoutsForContract,
    })
    .from(contracts)
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, contracts.hirerId))
    .where(eq(contracts.workerId, row.user.id))
    .orderBy(desc(contracts.startedAt));
  const reviewRows = await db
    .select({ review: reviews, authorBrand: hirerProfiles.brandName, contractTitle: contracts.title })
    .from(reviews)
    .innerJoin(contracts, eq(contracts.id, reviews.contractId))
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, reviews.authorId))
    .where(eq(reviews.targetId, row.user.id))
    .orderBy(desc(reviews.createdAt));
  return {
    user: row.user,
    profile: row.profile,
    stats,
    // El trayecto público solo muestra trabajo pagado adentro.
    history: history
      .filter((item) => Number(item.released) > 0)
      .map((item) => ({ ...item, views: Number(item.views), approved: Number(item.approved) })),
    reviews: reviewRows.map((item) => ({ ...item.review, authorBrand: item.authorBrand, contractTitle: item.contractTitle })),
  };
}

// --- Contratador ---

export async function listMyJobs(hirerId: string) {
  return db
    .select({
      job: jobs,
      pending: pendingApplicationsForJob,
      hired: hiredForJob,
    })
    .from(jobs)
    .where(eq(jobs.hirerId, hirerId))
    .orderBy(desc(jobs.createdAt))
    .then((rows) => rows.map((row) => ({ ...row.job, pending: Number(row.pending), hired: Number(row.hired) })));
}

export async function getMyJob(hirerId: string, jobId: string) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.hirerId, hirerId)));
  if (!job) return null;
  const rows = await db
    .select({ application: applications, worker: user, profile: workerProfiles })
    .from(applications)
    .innerJoin(user, eq(user.id, applications.workerId))
    .leftJoin(workerProfiles, eq(workerProfiles.userId, user.id))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.createdAt));
  const stats = await statsForWorkers(rows.map((row) => row.worker.id));
  return {
    job,
    applications: rows.map((row) => ({
      ...row.application,
      worker: { name: row.worker.name, username: row.worker.username, headline: row.profile?.headline ?? "" },
      stats: stats.get(row.worker.id)!,
    })),
  };
}

/** Lo ya liberado y lo adeudado a hoy, por contratación. */
async function moneyByContract(contractRows: (typeof contracts.$inferSelect)[]) {
  const ids = contractRows.map((row) => row.id);
  const result = new Map<string, { paid: number; owed: number; pendingPayout: number }>();
  if (ids.length === 0) return result;
  const deliverableRows = await db
    .select({ id: deliverables.id, contractId: deliverables.contractId, views: deliverables.views })
    .from(deliverables)
    .where(and(inArray(deliverables.contractId, ids), eq(deliverables.status, "approved")));
  const paidItems = await db
    .select({ deliverableId: payoutItems.deliverableId, total: sql<string>`sum(${payoutItems.amount})` })
    .from(payoutItems)
    .innerJoin(payouts, eq(payouts.id, payoutItems.payoutId))
    .where(and(inArray(payouts.contractId, ids), eq(payouts.status, "released")))
    .groupBy(payoutItems.deliverableId);
  const payoutRows = await db
    .select({ contractId: payouts.contractId, status: payouts.status, total: sql<string>`sum(${payouts.amount})` })
    .from(payouts)
    .where(inArray(payouts.contractId, ids))
    .groupBy(payouts.contractId, payouts.status);

  const alreadyPaid = new Map(paidItems.map((row) => [row.deliverableId, Number(row.total)]));
  const byContract = groupBy(deliverableRows, (row) => row.contractId);
  for (const contract of contractRows) {
    const owed = computePayout(
      contract.payRule,
      (byContract.get(contract.id) ?? []).map((d) => ({ id: d.id, views: d.views, alreadyPaid: alreadyPaid.get(d.id) ?? 0 })),
    ).amount;
    const totals = payoutRows.filter((row) => row.contractId === contract.id);
    result.set(contract.id, {
      paid: Number(totals.find((row) => row.status === "released")?.total ?? 0),
      pendingPayout: Number(totals.find((row) => row.status === "pending")?.total ?? 0),
      owed,
    });
  }
  return result;
}

/** El CRM: cada contratación del contratador con su rendimiento y su plata. */
export async function listTeam(hirerId: string) {
  const rows = await db
    .select({ contract: contracts, worker: user })
    .from(contracts)
    .innerJoin(user, eq(user.id, contracts.workerId))
    .where(eq(contracts.hirerId, hirerId))
    .orderBy(desc(contracts.startedAt));
  const ids = rows.map((row) => row.contract.id);
  const deliverableRows = ids.length ? await db.select().from(deliverables).where(inArray(deliverables.contractId, ids)) : [];
  const pendingViews = ids.length
    ? await db
        .select({ contractId: deliverables.contractId, total: sql<string>`count(*)` })
        .from(viewSnapshots)
        .innerJoin(deliverables, eq(deliverables.id, viewSnapshots.deliverableId))
        .where(and(inArray(deliverables.contractId, ids), eq(viewSnapshots.status, "pending")))
        .groupBy(deliverables.contractId)
    : [];
  const byContract = groupBy(deliverableRows, (row) => row.contractId);
  const money = await moneyByContract(rows.map((row) => row.contract));
  return rows.map((row) => {
    const m = money.get(row.contract.id)!;
    return {
      contract: row.contract,
      worker: { name: row.worker.name, username: row.worker.username },
      performance: contractPerformance(byContract.get(row.contract.id) ?? [], m.paid),
      pendingViews: Number(pendingViews.find((p) => p.contractId === row.contract.id)?.total ?? 0),
      ...m,
    };
  });
}

export async function listInvites(hirerId: string) {
  const rows = await db
    .select({ invite: invites, usedByName: user.name })
    .from(invites)
    .leftJoin(user, eq(user.id, invites.usedBy))
    .where(eq(invites.hirerId, hirerId))
    .orderBy(desc(invites.createdAt));
  const now = Date.now();
  return rows.map((row) => ({ ...row, expired: !row.invite.usedBy && row.invite.expiresAt.getTime() < now }));
}

export async function getInvite(token: string) {
  const [row] = await db
    .select({ invite: invites, brandName: hirerProfiles.brandName })
    .from(invites)
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, invites.hirerId))
    .where(eq(invites.token, token));
  if (!row) return null;
  return {
    ...row.invite,
    brandName: row.brandName,
    expired: row.invite.expiresAt.getTime() < Date.now(),
  };
}

export async function listPayouts(hirerId: string) {
  const rows = await db
    .select({ payout: payouts, contract: contracts, worker: user })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .innerJoin(user, eq(user.id, contracts.workerId))
    .where(eq(contracts.hirerId, hirerId))
    .orderBy(desc(payouts.createdAt));
  const items = await itemsForPayouts(rows.map((row) => row.payout.id));
  // A dónde transferirle a cada persona con una liquidación por pagar.
  const toPay = [...new Set(rows.filter((row) => row.payout.status === "pending").map((row) => row.worker.id))];
  const payees = new Map(await Promise.all(toPay.map(async (workerId) => [workerId, await payeeFor(db, hirerId, workerId)] as const)));
  return rows.map((row) => ({
    ...row.payout,
    contractTitle: row.contract.title,
    worker: { name: row.worker.name, username: row.worker.username },
    items: items.get(row.payout.id) ?? [],
    payee: payees.get(row.worker.id) ?? null,
  }));
}

async function itemsForPayouts(payoutIds: string[]) {
  if (payoutIds.length === 0) return new Map<string, { id: string; views: number; amount: number; reason: string; title: string; url: string | null }[]>();
  const rows = await db
    .select({
      id: payoutItems.id,
      payoutId: payoutItems.payoutId,
      views: payoutItems.views,
      amount: payoutItems.amount,
      reason: payoutItems.reason,
      title: deliverables.title,
      url: deliverables.url,
    })
    .from(payoutItems)
    .innerJoin(deliverables, eq(deliverables.id, payoutItems.deliverableId))
    .where(inArray(payoutItems.payoutId, payoutIds));
  return groupBy(rows, (row) => row.payoutId);
}

// --- Contratación (las dos partes) ---

export async function getContractDetail(contractId: string, userId: string) {
  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, contractId), or(eq(contracts.hirerId, userId), eq(contracts.workerId, userId))));
  if (!contract) return null;

  const [[worker], [hirer], deliverableRows, snapshotRows, payoutRows, messageRows, reviewRows] = await Promise.all([
    db.select({ name: user.name, username: user.username }).from(user).where(eq(user.id, contract.workerId)),
    db.select({ brandName: hirerProfiles.brandName }).from(hirerProfiles).where(eq(hirerProfiles.userId, contract.hirerId)),
    db.select().from(deliverables).where(eq(deliverables.contractId, contractId)).orderBy(desc(deliverables.createdAt)),
    db
      .select({ snapshot: viewSnapshots })
      .from(viewSnapshots)
      .innerJoin(deliverables, eq(deliverables.id, viewSnapshots.deliverableId))
      .where(and(eq(deliverables.contractId, contractId), eq(viewSnapshots.status, "pending"))),
    db.select().from(payouts).where(eq(payouts.contractId, contractId)).orderBy(desc(payouts.createdAt)),
    db
      .select({ message: messages, authorName: user.name })
      .from(messages)
      .innerJoin(user, eq(user.id, messages.authorId))
      .where(eq(messages.contractId, contractId))
      .orderBy(messages.createdAt),
    db.select().from(reviews).where(eq(reviews.contractId, contractId)),
  ]);

  const pendingSnapshot = new Map(snapshotRows.map((row) => [row.snapshot.deliverableId, row.snapshot]));
  const items = await itemsForPayouts(payoutRows.map((row) => row.id));
  const money = (await moneyByContract([contract])).get(contract.id)!;
  // Datos de pago: cada parte ve solo lo que necesita de la otra para esta contratación.
  const viewerIsHirer = contract.hirerId === userId;
  const [payee, hirerDetails, workerDetails] = await Promise.all([
    viewerIsHirer ? payeeFor(db, contract.hirerId, contract.workerId) : null,
    getPaymentDetails(db, contract.hirerId),
    viewerIsHirer ? null : getPaymentDetails(db, contract.workerId),
  ]);
  return {
    contract,
    worker,
    hirer,
    payment: viewerIsHirer
      ? { payee, payerHolder: null, mineMissing: !hirerDetails }
      : { payee: null, payerHolder: hirerDetails?.holderName ?? null, mineMissing: !workerDetails?.account },
    deliverables: deliverableRows.map((row) => ({ ...row, pendingSnapshot: pendingSnapshot.get(row.id) ?? null })),
    payouts: payoutRows.map((row) => ({ ...row, items: items.get(row.id) ?? [] })),
    messages: messageRows.map((row) => ({ ...row.message, authorName: row.authorName })),
    reviews: reviewRows,
    performance: contractPerformance(deliverableRows, money.paid),
    money,
  };
}

// --- Trabajador ---

export async function listMyApplications(workerId: string) {
  return db
    .select({ application: applications, job: jobs, brandName: hirerProfiles.brandName })
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, jobs.hirerId))
    .where(eq(applications.workerId, workerId))
    .orderBy(desc(applications.createdAt));
}

export async function listMyContracts(workerId: string) {
  const rows = await db
    .select({ contract: contracts, brandName: hirerProfiles.brandName })
    .from(contracts)
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, contracts.hirerId))
    .where(eq(contracts.workerId, workerId))
    .orderBy(desc(contracts.startedAt));
  const ids = rows.map((row) => row.contract.id);
  const deliverableRows = ids.length ? await db.select().from(deliverables).where(inArray(deliverables.contractId, ids)) : [];
  const byContract = groupBy(deliverableRows, (row) => row.contractId);
  const money = await moneyByContract(rows.map((row) => row.contract));
  const toConfirm = ids.length
    ? await db
        .select({ contractId: payouts.contractId, total: sql<string>`count(*)` })
        .from(payouts)
        .where(and(inArray(payouts.contractId, ids), eq(payouts.status, "released"), sql`${payouts.confirmedAt} is null`))
        .groupBy(payouts.contractId)
    : [];
  return rows.map((row) => {
    const list = byContract.get(row.contract.id) ?? [];
    const m = money.get(row.contract.id)!;
    return {
      contract: row.contract,
      brandName: row.brandName,
      paymentsToConfirm: Number(toConfirm.find((p) => p.contractId === row.contract.id)?.total ?? 0),
      requested: list.filter((d) => d.status === "requested").length,
      performance: contractPerformance(list, m.paid),
      ...m,
    };
  });
}

/** Todas las liquidaciones del gestor, de cualquier contratación, con quién paga cada una. */
export async function listMyPayouts(workerId: string) {
  const rows = await db
    .select({
      payout: payouts,
      contractId: contracts.id,
      contractTitle: contracts.title,
      brandName: hirerProfiles.brandName,
      payerHolder: paymentDetails.holderName,
    })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .innerJoin(hirerProfiles, eq(hirerProfiles.userId, contracts.hirerId))
    .leftJoin(paymentDetails, eq(paymentDetails.userId, contracts.hirerId))
    .where(eq(contracts.workerId, workerId))
    .orderBy(desc(payouts.createdAt));
  return rows.map((row) => ({
    ...row.payout,
    contractId: row.contractId,
    contractTitle: row.contractTitle,
    brandName: row.brandName,
    // El titular guardado al pagar manda; si todavía no se pagó, el que tiene cargado hoy.
    paidFrom: row.payout.paidFromHolder ?? row.payerHolder,
  }));
}

export async function getProfiles(userId: string) {
  const [[worker], [hirer]] = await Promise.all([
    db.select().from(workerProfiles).where(eq(workerProfiles.userId, userId)),
    db.select().from(hirerProfiles).where(eq(hirerProfiles.userId, userId)),
  ]);
  return { worker: worker ?? null, hirer: hirer ?? null };
}

// --- Contadores de navegación ---

export async function hirerNavCounts(hirerId: string) {
  const [[apps], [toReview], [views], [pending]] = await Promise.all([
    db
      .select({ total: sql<string>`count(*)` })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .where(and(eq(jobs.hirerId, hirerId), eq(applications.status, "pending"))),
    db
      .select({ total: sql<string>`count(*)` })
      .from(deliverables)
      .innerJoin(contracts, eq(contracts.id, deliverables.contractId))
      .where(and(eq(contracts.hirerId, hirerId), eq(deliverables.status, "submitted"))),
    db
      .select({ total: sql<string>`count(*)` })
      .from(viewSnapshots)
      .innerJoin(deliverables, eq(deliverables.id, viewSnapshots.deliverableId))
      .innerJoin(contracts, eq(contracts.id, deliverables.contractId))
      .where(and(eq(contracts.hirerId, hirerId), eq(viewSnapshots.status, "pending"))),
    db
      .select({ total: sql<string>`count(*)` })
      .from(payouts)
      .innerJoin(contracts, eq(contracts.id, payouts.contractId))
      .where(and(eq(contracts.hirerId, hirerId), eq(payouts.status, "pending"))),
  ]);
  return {
    applications: Number(apps.total),
    toReview: Number(toReview.total) + Number(views.total),
    pendingPayouts: Number(pending.total),
  };
}

export async function workerNavCounts(workerId: string) {
  const [requested] = await db
    .select({ total: sql<string>`count(*)` })
    .from(deliverables)
    .innerJoin(contracts, eq(contracts.id, deliverables.contractId))
    .where(and(eq(contracts.workerId, workerId), eq(deliverables.status, "requested")));
  const [toConfirm] = await db
    .select({ total: sql<string>`count(*)` })
    .from(payouts)
    .innerJoin(contracts, eq(contracts.id, payouts.contractId))
    .where(and(eq(contracts.workerId, workerId), eq(payouts.status, "released"), sql`${payouts.confirmedAt} is null`));
  return { requested: Number(requested.total), paymentsToConfirm: Number(toConfirm.total) };
}

// --- Actividad e insignias del gestor ---

/** Semanas que muestra el calendario de actividad: seis meses. */
const ACTIVITY_WEEKS = 26;

/** Calendario de actividad e insignias de un gestor, calculados de sus videos aprobados. */
export async function getWorkerActivity(workerId: string) {
  const rows = await db
    .select({ submittedAt: deliverables.submittedAt, createdAt: deliverables.createdAt, views: deliverables.views })
    .from(deliverables)
    .innerJoin(contracts, eq(contracts.id, deliverables.contractId))
    .where(and(eq(contracts.workerId, workerId), eq(deliverables.status, "approved")));

  // Un video cuenta en el día en que el gestor lo cargó.
  const counts = countByDay(rows.map((row) => row.submittedAt ?? row.createdAt));
  const facts = {
    totalViews: rows.reduce((sum, row) => sum + row.views, 0),
    approvedVideos: rows.length,
    bestVideoViews: rows.reduce((best, row) => Math.max(best, row.views), 0),
    longestStreak: longestStreak(counts),
  };
  return { calendar: buildCalendar(counts, ACTIVITY_WEEKS), badges: earnedBadges(facts), next: nextBadge(facts) };
}

// --- Datos de pago propios ---

export async function getMyPaymentDetails(userId: string) {
  return getPaymentDetails(db, userId);
}
