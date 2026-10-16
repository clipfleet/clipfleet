// Busca streamers medianos de habla hispana en Kick para el outreach (docs/marketing.md).
// Recorre los directos en español que hay en este momento, consulta cada canal y guarda los
// que entran en el rango de seguidores en leads/kick.csv. Cada corrida suma a lo que ya
// había, así que conviene correrlo a distintas horas, pero no más de un par de veces por día:
// los pedidos van espaciados y los canales ya consultados no se vuelven a pedir.
//
//   pnpm exec tsx scripts/kick-leads.ts
//   MIN_FOLLOWERS=5000 MAX_FOLLOWERS=500000 MIN_VIEWERS=20 pnpm exec tsx scripts/kick-leads.ts
//
// Usa los endpoints públicos que usa la web de Kick: pueden cambiar sin aviso.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const MIN_FOLLOWERS = Number(process.env.MIN_FOLLOWERS ?? 10_000);
const MAX_FOLLOWERS = Number(process.env.MAX_FOLLOWERS ?? 300_000);
const MIN_VIEWERS = Number(process.env.MIN_VIEWERS ?? 30);
const MAX_PAGES = Number(process.env.MAX_PAGES ?? 10);
// Tope de canales consultados por corrida y pausa entre pedidos: un ritmo de persona
// navegando, no de robot.
const MAX_LOOKUPS = Number(process.env.MAX_LOOKUPS ?? 150);
const DELAY_MS = Number(process.env.DELAY_MS ?? 2000);
// Un canal ya consultado no se vuelve a pedir hasta pasados estos días.
const REFRESH_DAYS = Number(process.env.REFRESH_DAYS ?? 14);
const OUT = "leads/kick.csv";
// Canales fuera del rango de seguidores, para no volver a consultarlos: "slug,fecha" por línea.
const SKIPPED = "leads/kick-descartados.csv";

const HEADERS = { "User-Agent": "Mozilla/5.0", Accept: "application/json" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// En bio y redes cualquier "clip" cuenta (suele ser su cuenta de clips). En el título no:
// "vemos clips" es mirar clips ajenos, así que solo cuenta si busca clippers.
const CLIP = /clip|cortes/i;
const CLIP_TITLE = /clipper|clipping|!clip/i;
// Lugares de Argentina o voseo y lunfardo, que también puede ser Uruguay.
const ARGENTINA =
  /argentin|🇦🇷|buenos aires|\bbs\.? ?as\b|\bcaba\b|c[oó]rdoba|rosario|mendoza|la plata|tucum[aá]n|mar del plata|santa fe|neuqu[eé]n|salta\b|\bconurbano\b|\b(ten[eé]s|quer[eé]s|pod[eé]s|segu[ií]me|bancame|bancar|boludo|boludeces|pibes?|laburo|chab[oó]n|birra|quilombo)\b/i;

type Live = {
  title: string;
  viewer_count: number;
  channel: { slug: string; username: string };
  category?: { name: string };
};

type Channel = {
  followers_count?: number;
  verified?: boolean;
  user?: {
    bio?: string | null;
    country?: string | null;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    discord?: string;
  };
};

const COLUMNS = [
  "Usuario",
  "Link al perfil",
  "Seguidores",
  "Verificado",
  "Señales de clips",
  "Posible Argentina",
  "Categoría",
  "Espectadores (máx. visto)",
  "Título del stream",
  "Bio",
  "Instagram",
  "X",
  "TikTok",
  "YouTube",
  "Discord",
  "Visto por primera vez",
  "Visto por última vez",
  "Veces visto",
] as const;

type Row = Record<(typeof COLUMNS)[number], string>;

// Si Kick frena (429) o bloquea (403, 503 de Cloudflare), se corta la corrida en lugar de
// insistir: insistir es lo que termina en un bloqueo de la IP.
class Blocked extends Error {}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: HEADERS });
  if (res.ok) return (await res.json()) as T;
  if (res.status === 404) return null;
  if ([403, 429, 503].includes(res.status)) throw new Blocked(`Kick respondió ${res.status} en ${url}`);
  console.warn(`No se pudo leer ${url} (${res.status})`);
  return null;
}

// Pausa entre pedidos, con algo de azar para no pegarle a ritmo fijo.
const pause = () => sleep(DELAY_MS + Math.random() * DELAY_MS * 0.5);

async function liveInSpanish(): Promise<Live[]> {
  const all: Live[] = [];
  let cursor = "";
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `https://web.kick.com/api/v1/livestreams?language=es&limit=100&sort=viewer_count_desc${cursor ? `&after=${cursor}` : ""}`;
    const data = await getJson<{ data: { livestreams: Live[]; pagination?: { next_cursor?: string } } }>(url);
    const batch = data?.data.livestreams ?? [];
    all.push(...batch);
    cursor = data?.data.pagination?.next_cursor ?? "";
    if (!cursor || batch.length === 0 || batch.at(-1)!.viewer_count < MIN_VIEWERS) break;
    await pause();
  }
  return all.filter((l) => l.viewer_count >= MIN_VIEWERS);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function readExisting(): Map<string, Row> {
  const map = new Map<string, Row>();
  if (!existsSync(OUT)) return map;
  const [header, ...rows] = parseCsv(readFileSync(OUT, "utf8"));
  for (const values of rows) {
    const row = Object.fromEntries(header.map((h, i) => [h, values[i] ?? ""])) as Row;
    map.set(row.Usuario.toLowerCase(), row);
  }
  return map;
}

function rank(row: Row) {
  return (row["Señales de clips"] ? 2 : 0) + (row["Posible Argentina"] ? 1 : 0);
}

function readSkipped(): Map<string, string> {
  if (!existsSync(SKIPPED)) return new Map();
  return new Map(parseCsv(readFileSync(SKIPPED, "utf8")).map(([slug, date]) => [slug, date] as [string, string]));
}

const daysSince = (date: string) => (Date.now() - Date.parse(date)) / 864e5;

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const leads = readExisting();
  const skipped = readSkipped();
  let added = 0;
  let checked = 0;
  let blocked = "";

  try {
    const lives = await liveInSpanish();
    console.log(`${lives.length} directos en español con ${MIN_VIEWERS} espectadores o más.`);

    for (const live of lives) {
      const slug = live.channel.slug;
      const key = live.channel.username.toLowerCase();
      const prev = leads.get(key);

      // Lo que ya se consultó hace poco no se vuelve a pedir: un lead conocido solo suma
      // que se lo volvió a ver.
      const skippedOn = skipped.get(slug);
      if (skippedOn && daysSince(skippedOn) < REFRESH_DAYS) continue;
      if (prev && daysSince(prev["Visto por última vez"]) < REFRESH_DAYS) {
        if (prev["Visto por última vez"] !== today) {
          prev["Veces visto"] = String(Number(prev["Veces visto"]) + 1);
          prev["Visto por última vez"] = today;
        }
        prev["Espectadores (máx. visto)"] = String(Math.max(live.viewer_count, Number(prev["Espectadores (máx. visto)"])));
        continue;
      }

      if (checked >= MAX_LOOKUPS) break;
      await pause();
      const channel = await getJson<Channel>(`https://kick.com/api/v2/channels/${slug}`);
      checked++;
      if (checked % 25 === 0) console.log(`  ${checked} canales consultados`);

      const followers = channel?.followers_count ?? 0;
      if (followers < MIN_FOLLOWERS || followers > MAX_FOLLOWERS) {
        skipped.set(slug, today);
        continue;
      }

      const u = channel?.user ?? {};
      const bio = (u.bio ?? "").replace(/\s+/g, " ").trim();
      const socials = [u.instagram, u.twitter, u.tiktok, u.youtube, u.discord].filter(Boolean).join(" ");
      const clipSignals = [
        CLIP.test(bio) && "bio",
        CLIP_TITLE.test(live.title) && "título",
        CLIP.test(socials) && "redes",
      ].filter(Boolean);
      const argentina = u.country === "AR" || ARGENTINA.test(`${bio} ${live.title}`);

      if (!prev) added++;
      leads.set(key, {
        Usuario: live.channel.username,
        "Link al perfil": `https://kick.com/${slug}`,
        Seguidores: String(followers),
        Verificado: channel?.verified ? "Sí" : "No",
        "Señales de clips": [...new Set([...(prev?.["Señales de clips"].split(" / ").filter(Boolean) ?? []), ...clipSignals])].join(" / "),
        "Posible Argentina": argentina || prev?.["Posible Argentina"] ? "Sí" : "",
        Categoría: live.category?.name ?? "",
        "Espectadores (máx. visto)": String(Math.max(live.viewer_count, Number(prev?.["Espectadores (máx. visto)"] ?? 0))),
        "Título del stream": live.title,
        Bio: bio,
        Instagram: u.instagram ?? "",
        X: u.twitter ?? "",
        TikTok: u.tiktok ?? "",
        YouTube: u.youtube ?? "",
        Discord: u.discord ?? "",
        "Visto por primera vez": prev?.["Visto por primera vez"] ?? today,
        "Visto por última vez": today,
        "Veces visto": String(Number(prev?.["Veces visto"] ?? 0) + 1),
      });
    }
  } catch (error) {
    if (!(error instanceof Blocked)) throw error;
    blocked = error.message;
  }

  // Se guarda lo conseguido aunque Kick haya cortado a mitad de camino.
  const rows = [...leads.values()].sort(
    (a, b) => rank(b) - rank(a) || Number(b.Seguidores) - Number(a.Seguidores),
  );
  mkdirSync("leads", { recursive: true });
  writeFileSync(OUT, [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\n") + "\n");
  writeFileSync(SKIPPED, [...skipped].map(([slug, date]) => `${slug},${date}`).join("\n") + "\n");

  const withClips = rows.filter((r) => r["Señales de clips"]).length;
  const fromAr = rows.filter((r) => r["Posible Argentina"]).length;
  console.log(
    `${checked} canales consultados, ${added} nuevos. ${rows.length} en total en ${OUT}: ${withClips} con señales de clips, ${fromAr} con señales de Argentina.`,
  );
  if (blocked) {
    console.error(`\nCorrida cortada: ${blocked}. Esperá unas horas antes de volver a correrlo.`);
    process.exitCode = 1;
  }
}

main();
