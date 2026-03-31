/**
 * prisma/enrich-cast-crew.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * For every film in the DB with a tmdbId, fetches:
 *   • Credits (director, writer, DP, editor, composer, producers, top cast)
 *   • Backdrop URL (if missing)
 *   • Watch providers for NG, ZA, KE, GH, US, GB
 *
 * Creates/upserts CrewMember, Actor, CrewCredit, ActorCredit, and Availability
 * records. Safe to re-run — uses upsert/findFirst everywhere.
 *
 * Run:  npx tsx prisma/enrich-cast-crew.ts
 *
 * Rate limits: 300ms between TMDb requests (API allows ~40 req/s).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const TMDB_KEY = process.env.TMDB_API_KEY!;
const IMG = "https://image.tmdb.org/t/p/w1280";
const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Crew roles to pull from TMDb
const WANTED_JOBS = new Set([
  "Director", "Screenplay", "Writer", "Story", "Producer",
  "Executive Producer", "Director of Photography", "Original Music Composer",
  "Editor", "Production Designer", "Costume Design",
]);
const ROLE_LABELS: Record<string, string> = {
  "Director of Photography": "Cinematographer",
  "Original Music Composer": "Composer",
  "Costume Design": "Costume Designer",
};

function slugify(name: string): string {
  return name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ── TMDb API helpers ──────────────────────────────────────────────────────────

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!res.ok) throw new Error(`TMDb ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

interface TmdbCredits {
  cast: { id: number; name: string; character: string; order: number; profile_path: string | null; known_for_department: string }[];
  crew: { id: number; name: string; job: string; department: string; profile_path: string | null }[];
}

interface TmdbProviders {
  results: Record<string, {
    flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
    rent?: { provider_id: number; provider_name: string }[];
    buy?: { provider_id: number; provider_name: string }[];
  }>;
}

// ── Upsert helpers ────────────────────────────────────────────────────────────

async function upsertCrewMember(tmdbId: number, name: string, role: string, profilePath: string | null) {
  const slug = slugify(name);
  const type = ["Director", "Screenplay", "Writer", "Story"].includes(role) ? "director" : "producer";
  const existing = await prisma.crewMember.findUnique({ where: { slug } });
  if (existing) {
    // Update imageUrl if missing
    if (!existing.imageUrl && profilePath) {
      await prisma.crewMember.update({ where: { slug }, data: { imageUrl: `${PROFILE_IMG}${profilePath}` } });
    }
    return existing;
  }
  return prisma.crewMember.create({
    data: {
      slug,
      name,
      type,
      roles: [role],
      awards: [],
      imageUrl: profilePath ? `${PROFILE_IMG}${profilePath}` : null,
    },
  });
}

async function upsertActor(tmdbId: number, name: string, profilePath: string | null) {
  const slug = slugify(name);
  const existing = await prisma.actor.findUnique({ where: { slug } });
  if (existing) {
    if (!existing.imageUrl && profilePath) {
      await prisma.actor.update({ where: { slug }, data: { imageUrl: `${PROFILE_IMG}${profilePath}` } });
    }
    return existing;
  }
  return prisma.actor.create({
    data: {
      slug,
      name,
      awards: [],
      imageUrl: profilePath ? `${PROFILE_IMG}${profilePath}` : null,
    },
  });
}

// ── Country → ISO for providers ──────────────────────────────────────────────
const PROVIDER_REGIONS = ["NG", "ZA", "KE", "GH", "US", "GB"];

// Known streaming platform name → normalised
const PLATFORM_NORM: Record<string, string> = {
  "Netflix": "Netflix",
  "Amazon Prime Video": "Prime Video",
  "Prime Video": "Prime Video",
  "Apple TV Plus": "Apple TV+",
  "Apple TV+": "Apple TV+",
  "Showmax": "Showmax",
  "Disney Plus": "Disney+",
  "HBO Max": "Max",
  "Max": "Max",
  "Mubi": "MUBI",
  "MUBI": "MUBI",
  "YouTube Premium": "YouTube",
};

// ── Main enrichment per film ──────────────────────────────────────────────────

async function enrichFilm(film: {
  id: string;
  slug: string;
  title: string;
  tmdbId: number;
  backdropUrl: string | null;
  country: string;
}) {
  const tag = `"${film.title}"`;
  let crewAdded = 0, castAdded = 0, availAdded = 0;

  try {
    // 1. Credits
    const credits = await tmdb<TmdbCredits>(`/movie/${film.tmdbId}/credits`);
    await sleep(300);

    // Crew
    for (const member of credits.crew) {
      if (!WANTED_JOBS.has(member.job)) continue;
      const role = ROLE_LABELS[member.job] ?? member.job;
      const crewMember = await upsertCrewMember(member.id, member.name, role, member.profile_path);

      const existingCredit = await prisma.crewCredit.findUnique({
        where: { filmId_crewMemberId_role: { filmId: film.id, crewMemberId: crewMember.id, role } },
      });
      if (!existingCredit) {
        await prisma.crewCredit.create({ data: { filmId: film.id, crewMemberId: crewMember.id, role } });
        crewAdded++;
      }
    }

    // Cast: top 8 billed actors
    const topCast = credits.cast.filter((c) => c.order < 8).slice(0, 8);
    for (const member of topCast) {
      const actor = await upsertActor(member.id, member.name, member.profile_path);
      const existingCredit = await prisma.actorCredit.findUnique({
        where: { filmId_actorId: { filmId: film.id, actorId: actor.id } },
      });
      if (!existingCredit) {
        await prisma.actorCredit.create({
          data: { filmId: film.id, actorId: actor.id, character: member.character || null, order: member.order },
        });
        castAdded++;
      }
    }

    // 2. Backdrop URL (if missing)
    if (!film.backdropUrl) {
      const detail = await tmdb<{ backdrop_path: string | null }>(`/movie/${film.tmdbId}`);
      await sleep(300);
      if (detail.backdrop_path) {
        await prisma.film.update({ where: { id: film.id }, data: { backdropUrl: `${IMG}${detail.backdrop_path}` } });
      }
    }

    // 3. Watch providers
    const providersRes = await tmdb<TmdbProviders>(`/movie/${film.tmdbId}/watch/providers`);
    await sleep(300);

    for (const countryCode of PROVIDER_REGIONS) {
      const regionData = providersRes.results[countryCode];
      if (!regionData) continue;

      const flatrate = regionData.flatrate ?? [];
      for (const p of flatrate) {
        const platform = PLATFORM_NORM[p.provider_name] ?? p.provider_name;
        const exists = await prisma.availability.findUnique({
          where: { filmId_countryCode_platform: { filmId: film.id, countryCode, platform } },
        });
        if (!exists) {
          await prisma.availability.create({
            data: { filmId: film.id, countryCode, platform, accessType: "svod" },
          });
          availAdded++;
        }
      }
    }

    console.log(`  ✓  ${tag} — crew+${crewAdded} cast+${castAdded} avail+${availAdded}`);
  } catch (err) {
    console.error(`  ✗  ${tag} — ${(err as Error).message}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!TMDB_KEY) { console.error("TMDB_API_KEY not set in .env"); process.exit(1); }

  console.log("── Cast/crew enrichment ─────────────────────────────────────\n");

  const films = await prisma.film.findMany({
    where: { tmdbId: { not: null } },
    select: { id: true, slug: true, title: true, tmdbId: true, backdropUrl: true, country: true },
    orderBy: { year: "asc" },
  });

  console.log(`Enriching ${films.length} films with tmdbId...\n`);

  for (const film of films) {
    await enrichFilm(film as typeof films[0] & { tmdbId: number });
    await sleep(400);
  }

  const actorCount = await prisma.actor.count();
  const crewCount = await prisma.crewMember.count();
  const creditCount = await prisma.actorCredit.count();
  const availCount = await prisma.availability.count();

  console.log("\n── Summary ────────────────────────────────────────────────────");
  console.log(`  Actors in DB     : ${actorCount}`);
  console.log(`  Crew in DB       : ${crewCount}`);
  console.log(`  Actor credits    : ${creditCount}`);
  console.log(`  Availability rows: ${availCount}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
