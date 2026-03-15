/**
 * prisma/enrich-portraits.ts
 *
 * Scrapes professional headshots for Actor and CrewMember records that have
 * no imageUrl and stores them in R2 (or uses TMDb URL directly if R2 is absent).
 *
 * Confidence scoring:
 *  +20  — person's TMDb movie credits overlap with a Film.tmdbId in our DB  ← strongest
 *  +10  — exact name match (case-insensitive)
 *  + 5  — known_for_department matches expected role
 *  + 2  — popularity > 5  (popular people are easier to identify correctly)
 *  + 1  — popularity > 1
 *
 *  Threshold ≥ 20 → auto-accept   (cross-film match required by default)
 *  Threshold 10–19 → low-confidence, logged and skipped
 *  < 10 → no match, skipped
 *
 * Run locally:  npx tsx prisma/enrich-portraits.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config";

// ── Prisma ────────────────────────────────────────────────────────────────────

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// ── R2 ────────────────────────────────────────────────────────────────────────

const BUCKET = process.env.R2_BUCKET_NAME ?? "mbari-media";
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "https://media.mbari.art").replace(/\/$/, "");

function buildR2(): S3Client | null {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

async function r2Exists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Uploads an image to R2 and returns the public URL.
 * If R2 is not configured, returns the source URL as-is.
 */
async function storeImage(
  r2: S3Client | null,
  sourceUrl: string,
  key: string
): Promise<string> {
  if (!r2) return sourceUrl; // no R2 → use external URL directly

  if (await r2Exists(r2, key)) return `${PUBLIC_URL}/${key}`;

  const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${sourceUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${PUBLIC_URL}/${key}`;
}

// ── TMDb helpers ──────────────────────────────────────────────────────────────

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/h632"; // 632px tall portrait

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not set");
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`TMDb ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

interface TmdbPerson {
  id: number;
  name: string;
  popularity: number;
  profile_path: string | null;
  known_for_department: string;
}

interface TmdbPersonSearch { results: TmdbPerson[] }
interface TmdbMovieCredits {
  cast: { id: number }[];
  crew: { id: number }[];
}

// ── Confidence scoring ────────────────────────────────────────────────────────

async function score(
  candidate: TmdbPerson,
  queryName: string,
  filmTmdbIds: Set<number>,
  expectedDept: string
): Promise<number> {
  let s = 0;

  if (candidate.name.toLowerCase() === queryName.toLowerCase()) s += 10;
  else if (candidate.name.toLowerCase().includes(queryName.toLowerCase())) s += 3;

  if (candidate.known_for_department === expectedDept) s += 5;

  if (candidate.popularity > 5) s += 2;
  else if (candidate.popularity > 1) s += 1;

  // Cross-reference: shared film is near-definitive proof of identity
  if (filmTmdbIds.size > 0) {
    try {
      const credits = await tmdbGet<TmdbMovieCredits>(`/person/${candidate.id}/movie_credits`);
      const theirIds = new Set([
        ...credits.cast.map((m) => m.id),
        ...credits.crew.map((m) => m.id),
      ]);
      for (const fid of filmTmdbIds) {
        if (theirIds.has(fid)) { s += 20; break; }
      }
    } catch {
      // TMDb error — don't penalise
    }
  }

  return s;
}

// ── Rate limiter ──────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Enrich one person ─────────────────────────────────────────────────────────

const THRESHOLD = 20;

type Result =
  | { ok: true; url: string; score: number; matched: string }
  | { ok: false; reason: "no_result" | "low_confidence" | "no_photo" | "error"; score?: number; top?: string };

async function enrichPerson(
  r2: S3Client | null,
  name: string,
  r2Key: string,
  filmTmdbIds: Set<number>,
  expectedDept: string
): Promise<Result> {
  let candidates: TmdbPerson[];
  try {
    const resp = await tmdbGet<TmdbPersonSearch>("/search/person", { query: name });
    candidates = resp.results.slice(0, 5);
  } catch {
    return { ok: false, reason: "error" };
  }

  if (candidates.length === 0) return { ok: false, reason: "no_result" };

  const scored: { p: TmdbPerson; s: number }[] = [];
  for (const p of candidates) {
    const s = await score(p, name, filmTmdbIds, expectedDept);
    scored.push({ p, s });
    await sleep(250); // ~4 req/s (TMDb allows 40/s)
  }
  scored.sort((a, b) => b.s - a.s);
  const best = scored[0];

  if (best.s < THRESHOLD) {
    return {
      ok: false,
      reason: "low_confidence",
      score: best.s,
      top: `${best.p.name} (pop=${best.p.popularity.toFixed(1)}, dept=${best.p.known_for_department})`,
    };
  }

  if (!best.p.profile_path) {
    return { ok: false, reason: "no_photo", score: best.s };
  }

  try {
    const url = await storeImage(r2, `${TMDB_IMG_BASE}${best.p.profile_path}`, r2Key);
    return { ok: true, url, score: best.s, matched: best.p.name };
  } catch (err) {
    console.error(`  R2 upload failed for ${name}:`, err);
    return { ok: false, reason: "error" };
  }
}

// ── Department inference for crew ─────────────────────────────────────────────

function inferDept(roles: string[]): string {
  if (roles.some((r) => ["Director"].includes(r))) return "Directing";
  if (roles.some((r) => ["Writer", "Screenplay"].includes(r))) return "Writing";
  if (roles.some((r) => ["Producer", "Executive Producer"].includes(r))) return "Production";
  if (roles.some((r) => ["Original Music Composer"].includes(r))) return "Sound";
  if (roles.some((r) => ["Director of Photography", "Cinematographer", "Editor", "Visual Effects Supervisor"].includes(r))) return "Camera";
  return "Crew";
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const r2 = buildR2();
  console.log("── Portrait enrichment ──────────────────────────────────────");
  console.log(`  R2     : ${r2 ? "enabled (" + PUBLIC_URL + ")" : "disabled — using TMDb URLs directly"}`);
  console.log(`  Threshold: score ≥ ${THRESHOLD} (cross-film match required)\n`);

  let actorUpdated = 0, actorLowConf = 0, actorNoHit = 0;
  let crewUpdated = 0, crewLowConf = 0, crewNoHit = 0;

  // ── Actors ─────────────────────────────────────────────────────────────────
  const actors = await prisma.actor.findMany({
    where: { imageUrl: null },
    include: { credits: { include: { film: { select: { tmdbId: true } } } } },
    orderBy: { name: "asc" },
  });

  console.log(`Actors missing photo: ${actors.length}`);

  for (const actor of actors) {
    const filmTmdbIds = new Set(
      actor.credits.map((c) => c.film.tmdbId).filter((id): id is number => id != null)
    );

    const result = await enrichPerson(
      r2,
      actor.name,
      `portraits/actors/${actor.slug}.jpg`,
      filmTmdbIds,
      "Acting"
    );

    if (result.ok) {
      await prisma.actor.update({ where: { slug: actor.slug }, data: { imageUrl: result.url } });
      console.log(`  ✓ [${result.score}] ${actor.name} → ${result.matched}`);
      actorUpdated++;
    } else if (result.reason === "low_confidence") {
      console.log(`  ⚠ [${result.score}] ${actor.name} — LOW CONF → ${result.top}`);
      actorLowConf++;
    } else if (result.reason === "no_result") {
      console.log(`  — ${actor.name} — no TMDb person found`);
      actorNoHit++;
    } else if (result.reason === "no_photo") {
      console.log(`  — [${result.score}] ${actor.name} — matched but no profile photo on TMDb`);
    }

    await sleep(350);
  }

  // ── Crew ───────────────────────────────────────────────────────────────────
  const crew = await prisma.crewMember.findMany({
    where: { imageUrl: null },
    include: { credits: { include: { film: { select: { tmdbId: true } } } } },
    orderBy: { name: "asc" },
  });

  console.log(`\nCrew missing photo: ${crew.length}`);

  for (const member of crew) {
    const filmTmdbIds = new Set(
      member.credits.map((c) => c.film.tmdbId).filter((id): id is number => id != null)
    );

    const result = await enrichPerson(
      r2,
      member.name,
      `portraits/crew/${member.slug}.jpg`,
      filmTmdbIds,
      inferDept(member.roles)
    );

    if (result.ok) {
      await prisma.crewMember.update({ where: { slug: member.slug }, data: { imageUrl: result.url } });
      console.log(`  ✓ [${result.score}] ${member.name} (${member.roles[0] ?? "?"}) → ${result.matched}`);
      crewUpdated++;
    } else if (result.reason === "low_confidence") {
      console.log(`  ⚠ [${result.score}] ${member.name} — LOW CONF → ${result.top}`);
      crewLowConf++;
    } else if (result.reason === "no_result") {
      console.log(`  — ${member.name} — no TMDb person found`);
      crewNoHit++;
    } else if (result.reason === "no_photo") {
      console.log(`  — [${result.score}] ${member.name} — matched, no photo`);
    }

    await sleep(350);
  }

  console.log("\n── Summary ───────────────────────────────────────────────────");
  console.log(`  Actors: ${actorUpdated} updated | ${actorLowConf} low-confidence | ${actorNoHit} no hit`);
  console.log(`  Crew  : ${crewUpdated} updated | ${crewLowConf} low-confidence | ${crewNoHit} no hit`);
  console.log("");
  console.log("  Low-confidence entries are logged above for manual review.");
  console.log("  To manually set a photo: update imageUrl directly in the admin.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
