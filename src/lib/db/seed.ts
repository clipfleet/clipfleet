import { hashPassword } from "better-auth/crypto";
import { count } from "drizzle-orm";
import { confirmPayoutReceived, generatePayout, markPayoutPaid } from "@/lib/ledger/service";
import type { PayRule } from "@/lib/payrules";
import {
  account,
  applications,
  contracts,
  deliverables,
  hirerProfiles,
  jobs,
  messages,
  paymentDetails,
  reviews,
  user,
  viewSnapshots,
  workerProfiles,
} from "./schema";
import type { Db } from "./types";

/**
 * Datos de demostración para la base embebida de desarrollo. Son ficticios: sirven para
 * recorrer el producto, no representan usuarios reales. Nunca corre contra Postgres real.
 *
 * Cuentas (todas con la contraseña DEMO_PASSWORD):
 *   contratador@demo.local · clipper@demo.local · clipper2@demo.local · nuevo@demo.local
 */
export const DEMO_PASSWORD = "demo-clipfleet";

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

async function createUser(db: Db, input: { id: string; name: string; email: string; username: string; role: "hirer" | "worker" | "admin" }) {
  await db.insert(user).values({ ...input, emailVerified: true });
  await db.insert(account).values({
    id: `acc-${input.id}`,
    accountId: input.id,
    providerId: "credential",
    userId: input.id,
    password: await hashPassword(DEMO_PASSWORD),
  });
}

const cpmRule: PayRule = {
  fixedPerDeliverable: 0,
  variable: { type: "cpm", ratePerThousand: 80_000, minViews: 10_000, capPerDeliverable: 15_000_000 },
};
const tiersRule: PayRule = {
  fixedPerDeliverable: 0,
  variable: {
    type: "tiers",
    tiers: [
      { minViews: 10_000, amount: 800_000 },
      { minViews: 100_000, amount: 5_000_000 },
    ],
  },
};

type Post = { n: number; views: number; quality: number; handle: string; postedDaysAgo: number };

/** Videos ya publicados y aprobados. Las cuentas son descartables: se crean para el trabajo. */
function approvedPosts(contractId: string, label: string, posts: Post[]) {
  return posts.map((post) => ({
    contractId,
    title: `${label} ${post.n}`,
    kind: "post" as const,
    url: `https://www.tiktok.com/@${post.handle}/video/ejemplo-${post.n}`,
    platform: "tiktok",
    accountHandle: `@${post.handle}`,
    submittedAt: daysAgo(post.postedDaysAgo),
    status: "approved" as const,
    views: post.views,
    qualityRating: post.quality,
    reviewedAt: daysAgo(post.postedDaysAgo - 1),
    createdAt: daysAgo(post.postedDaysAgo),
  }));
}

export async function seedIfEmpty(db: Db): Promise<void> {
  const [{ users }] = await db.select({ users: count() }).from(user);
  if (users > 0) return;

  await createUser(db, { id: "demo-hirer", name: "Lucas Ferreyra", email: "contratador@demo.local", username: "lucasf", role: "hirer" });
  await createUser(db, { id: "demo-clipper", name: "Tomás Agüero", email: "clipper@demo.local", username: "tomiclips", role: "worker" });
  await createUser(db, { id: "demo-clipper2", name: "Camila Ríos", email: "clipper2@demo.local", username: "camirios", role: "worker" });
  await createUser(db, { id: "demo-new", name: "Bruno Sosa", email: "nuevo@demo.local", username: "brunososa", role: "worker" });

  await db.insert(hirerProfiles).values({
    userId: "demo-hirer",
    brandName: "Canal Demo",
    description: "Canal de ejemplo. Los datos son ficticios.",
  });
  await db.insert(workerProfiles).values([
    { userId: "demo-clipper", headline: "Recortes de podcasts y entrevistas", bio: "Perfil de ejemplo.", categories: ["multicuentas"] },
    { userId: "demo-clipper2", headline: "Clips de streams, 15 videos por día", bio: "Perfil de ejemplo.", categories: ["multicuentas"] },
    { userId: "demo-new", headline: "Disponible todos los días", bio: "Perfil de ejemplo sin trabajos todavía.", categories: ["multicuentas"] },
  ]);

  // Datos de pago de ejemplo. La segunda gestora no los cargó, para ver ese caso.
  await db.insert(paymentDetails).values([
    { userId: "demo-hirer", holderName: "Lucas Ferreyra" },
    { userId: "demo-clipper", holderName: "Tomás Agüero", account: "tomi.clips.demo", accountKind: "alias" },
  ]);

  const [cpmJob, tiersJob] = await db
    .insert(jobs)
    .values([
      {
        hirerId: "demo-hirer",
        title: "Recortes del podcast en TikTok",
        description:
          "Búsqueda de ejemplo. Te pasamos los episodios; creás las cuentas y subís recortes todos los días. Se paga por vistas aprobadas.",
        category: "multicuentas",
        platform: "tiktok",
        payRule: cpmRule,
        slots: 10,
        createdAt: daysAgo(40),
      },
      {
        hirerId: "demo-hirer",
        title: "Clips del stream: premio por video que explota",
        description: "Búsqueda de ejemplo. Material libre del canal. Cobra el video que pasa los 10 mil o los 100 mil.",
        category: "multicuentas",
        platform: "tiktok",
        payRule: tiersRule,
        slots: 25,
        createdAt: daysAgo(30),
      },
      {
        hirerId: "demo-hirer",
        title: "Shorts del podcast",
        description: "Búsqueda de ejemplo. Los mismos episodios, recortados en vertical para YouTube Shorts. Se paga por vistas aprobadas.",
        category: "multicuentas",
        platform: "youtube",
        payRule: cpmRule,
        slots: 10,
        createdAt: daysAgo(5),
      },
    ])
    .returning({ id: jobs.id });

  // Contratación activa, pago por cada 1.000 vistas.
  const [active] = await db
    .insert(contracts)
    .values({
      jobId: cpmJob.id,
      hirerId: "demo-hirer",
      workerId: "demo-clipper",
      origin: "job",
      title: "Recortes del podcast en TikTok",
      category: "multicuentas",
      platform: "tiktok",
      payRule: cpmRule,
      feeBps: 0,
      feePayer: "hirer",
      startedAt: daysAgo(35),
    })
    .returning({ id: contracts.id });
  await db.insert(applications).values([
    { jobId: cpmJob.id, workerId: "demo-clipper", message: "Hice recortes para dos canales. Puedo subir 10 videos por día.", status: "accepted", createdAt: daysAgo(36) },
    { jobId: cpmJob.id, workerId: "demo-new", message: "Recién arranco, pero subo todos los días.", createdAt: daysAgo(1) },
  ]);

  const approved = await db
    .insert(deliverables)
    .values(
      approvedPosts(active.id, "Recorte episodio", [
        { n: 1, views: 184_000, quality: 5, handle: "podcast.recortes.01", postedDaysAgo: 31 },
        { n: 2, views: 4_300, quality: 4, handle: "podcast.recortes.01", postedDaysAgo: 28 },
        { n: 3, views: 61_500, quality: 4, handle: "podcast.recortes.02", postedDaysAgo: 25 },
        { n: 4, views: 12_800, quality: 5, handle: "podcast.recortes.02", postedDaysAgo: 22 },
        { n: 5, views: 900, quality: 3, handle: "podcast.recortes.03", postedDaysAgo: 19 },
      ]),
    )
    .returning({ id: deliverables.id });
  // Los pagos se hacen por fuera: el contratador informa que pagó y el trabajador confirma que cobró.
  const firstPayout = (await generatePayout(db, active.id, daysAgo(10)))!;
  await markPayoutPaid(db, firstPayout, daysAgo(10));
  await confirmPayoutReceived(db, firstPayout, daysAgo(9));

  // Actividad de las últimas semanas para ver el calendario: videos que no llegaron al mínimo
  // de vistas, así que no cambian lo liquidado.
  const recent: Post[] = [];
  for (let day = 2; day <= 75; day++) {
    // Sube casi todos los días, algunos días varios videos, y cada tanto descansa.
    const perDay = day % 9 === 0 ? 0 : (day * 7) % 5 === 0 ? 4 : (day % 3) + 1;
    for (let i = 0; i < perDay; i++) {
      const n = 100 + recent.length;
      recent.push({ n, views: 400 + ((n * 137) % 9000), quality: 4, handle: `podcast.recortes.0${(n % 3) + 1}`, postedDaysAgo: day });
    }
  }
  await db.insert(deliverables).values(approvedPosts(active.id, "Recorte", recent));

  // Después de esa liquidación: un video siguió creciendo, hay un reporte de vistas y un video sin revisar.
  await db.insert(viewSnapshots).values({ deliverableId: approved[2].id, views: 97_200, capturedAt: daysAgo(1) });
  await db.insert(deliverables).values({
    contractId: active.id,
    title: "Recorte episodio 6",
    kind: "post",
    url: "https://www.tiktok.com/@podcast.recortes.03/video/ejemplo-6",
    platform: "tiktok",
    accountHandle: "@podcast.recortes.03",
    submittedAt: daysAgo(1),
    status: "submitted",
  });
  await db.insert(messages).values([
    { contractId: active.id, authorId: "demo-hirer", body: "Subí el episodio 7 a la carpeta compartida.", createdAt: daysAgo(2) },
    { contractId: active.id, authorId: "demo-clipper", body: "Genial, mañana salen los primeros recortes.", createdAt: daysAgo(2) },
  ]);

  // Contratación ya finalizada, pago por escalones, con reseñas.
  const [ended] = await db
    .insert(contracts)
    .values({
      jobId: tiersJob.id,
      hirerId: "demo-hirer",
      workerId: "demo-clipper2",
      origin: "job",
      title: "Clips del stream: premio por video que explota",
      category: "multicuentas",
      platform: "tiktok",
      payRule: tiersRule,
      feeBps: 0,
      feePayer: "hirer",
      status: "ended",
      startedAt: daysAgo(28),
      endedAt: daysAgo(6),
    })
    .returning({ id: contracts.id });
  await db.insert(applications).values({ jobId: tiersJob.id, workerId: "demo-clipper2", status: "accepted", createdAt: daysAgo(29) });
  await db.insert(deliverables).values(
    approvedPosts(ended.id, "Clip del stream", [
      { n: 1, views: 120_000, quality: 5, handle: "stream.clips.a", postedDaysAgo: 26 },
      { n: 2, views: 15_000, quality: 4, handle: "stream.clips.a", postedDaysAgo: 22 },
      { n: 3, views: 3_000, quality: 4, handle: "stream.clips.b", postedDaysAgo: 17 },
      { n: 4, views: 42_000, quality: 5, handle: "stream.clips.b", postedDaysAgo: 12 },
    ]),
  );
  const lastPayout = (await generatePayout(db, ended.id, daysAgo(6)))!;
  await markPayoutPaid(db, lastPayout, daysAgo(6));
  await confirmPayoutReceived(db, lastPayout, daysAgo(5));
  await db.insert(reviews).values([
    { contractId: ended.id, authorId: "demo-hirer", targetId: "demo-clipper2", rating: 5, comment: "Reseña de ejemplo: subió todos los días.", createdAt: daysAgo(5) },
    { contractId: ended.id, authorId: "demo-clipper2", targetId: "demo-hirer", rating: 5, comment: "Reseña de ejemplo: pagó el mismo día.", createdAt: daysAgo(5) },
  ]);
}
