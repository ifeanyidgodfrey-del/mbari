/**
 * prisma/discover-upcoming.ts
 *
 * Discovers African films that are announced or about to release by querying
 * TMDb's /movie/upcoming and /movie/now_playing endpoints for each covered
 * country. New films not yet in our DB are created with upcoming=true.
 * Films currently in now_playing get boxLive=true, upcoming=false.
 *
 * Also queries YouTube Data API (if YOUTUBE_API_KEY is set) for recently
 * uploaded official trailers from major African film channels, to surface
 * films announced on social before they hit TMDb.
 *
 * Run locally:  npx tsx prisma/discover-upcoming.ts
 * CI/CD:        called from deploy.yml
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// ── Config ────────────────────────────────────────────────────────────────────

// African countries we actively track — ISO 3166-1 alpha-2
const COVERED_REGIONS = ["NG", "ZA", "KE", "GH", "ET", "EG", "MA", "CI", "SN", "CM"];

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const AFRICAN_COUNTRIES = new Set([
  "DZ","EG","LY","MA","MR","SD","TN",
  "BJ","BF","CV","CI","GM","GH","GN","GW","LR","ML","NE","NG","SN","SL","TG",
  "AO","CM","CF","TD","CG","CD","GQ","GA","ST",
  "BI","KM","DJ","ER","ET","KE","MG","MW","MU","MZ","RW","SC","SO","SS","TZ","UG",
  "BW","LS","NA","ZA","SZ","ZM","ZW",
]);

// ── TMDb helpers ──────────────────────────────────────────────────────────────

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

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  production_countries?: { iso_3166_1: string }[];
}

interface TmdbMovieDetail extends TmdbMovie {
  runtime: number | null;
  tagline: string;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  credits: {
    cast: { id: number; name: string; character: string; order: number }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos?: { results: { key: string; site: string; type: string; official: boolean }[] };
  external_ids?: { imdb_id: string | null };
}

interface TmdbMoviePage { results: TmdbMovie[]; total_pages: number }

const GENRE_MAP: Record<number, string> = {
  28:"Action", 12:"Adventure", 16:"Animation", 35:"Comedy", 80:"Crime",
  99:"Documentary", 18:"Drama", 10751:"Family", 14:"Fantasy", 36:"History",
  27:"Horror", 10402:"Music", 9648:"Mystery", 10749:"Romance", 878:"Science Fiction",
  53:"Thriller", 10752:"War", 37:"Western",
};

function slugify(text: string, year?: number | null): string {
  const base = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return year && !base.includes(String(year)) ? `${base}-${year}` : base;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Fetch upcoming + now_playing for a region ─────────────────────────────────

async function fetchRegionFilms(region: string): Promise<{
  upcoming: TmdbMovie[];
  nowPlaying: TmdbMovie[];
}> {
  const [upPage, npPage] = await Promise.all([
    tmdbGet<TmdbMoviePage>("/movie/upcoming", { region, page: "1" }),
    tmdbGet<TmdbMoviePage>("/movie/now_playing", { region, page: "1" }),
  ]);
  return {
    upcoming: upPage.results,
    nowPlaying: npPage.results,
  };
}

// ── Process one film ──────────────────────────────────────────────────────────

async function processFilm(
  tmdbMovie: TmdbMovie,
  isNowPlaying: boolean,
  primaryRegion: string
): Promise<"created_upcoming" | "updated_live" | "skipped_existing" | "skipped_non_african" | "error"> {
  try {
    // Fetch full detail to get production_countries
    const detail = await tmdbGet<TmdbMovieDetail>(`/movie/${tmdbMovie.id}`, {
      append_to_response: "credits,videos,external_ids",
    });
    await sleep(300);

    // Validate African origin
    const country =
      detail.production_countries.find((c) => AFRICAN_COUNTRIES.has(c.iso_3166_1))?.iso_3166_1
      ?? (AFRICAN_COUNTRIES.has(primaryRegion) ? primaryRegion : null);

    if (!country) return "skipped_non_african";

    const year = detail.release_date ? Number(detail.release_date.slice(0, 4)) : null;
    if (!year) return "error";

    const slug = slugify(detail.title, year);

    // Check if already exists — by tmdbId, slug, or title+year (prevents seed vs discover dupes)
    const existing = await prisma.film.findFirst({
      where: {
        OR: [
          { tmdbId: detail.id },
          { slug },
          { title: { equals: detail.title, mode: "insensitive" }, year },
        ],
      },
    });

    if (existing) {
      // Update live flag if now playing
      if (isNowPlaying && existing.upcoming) {
        await prisma.film.update({
          where: { id: existing.id },
          data: { upcoming: false, boxLive: true },
        });
        return "updated_live";
      }
      return "skipped_existing";
    }

    // Prepare genres
    const genres = detail.genres.map((g) => g.name);

    // Trailer
    const trailer = detail.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
    ) ?? detail.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

    await prisma.film.create({
      data: {
        slug,
        title: detail.title,
        year,
        runtime: detail.runtime ? `${detail.runtime} min` : null,
        tagline: detail.tagline || null,
        synopsis: detail.overview || `${detail.title} — coming to African screens.`,
        posterUrl: detail.poster_path ? `${TMDB_IMG}${detail.poster_path}` : null,
        backdropUrl: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
        country,
        genres,
        tmdbId: detail.id,
        imdbId: detail.external_ids?.imdb_id ?? null,
        trailerUrl,
        upcoming: !isNowPlaying,
        boxLive: isNowPlaying,
        awards: [],
      },
    });

    return "created_upcoming";
  } catch (err) {
    console.error(`  Error processing TMDb ${tmdbMovie.id} "${tmdbMovie.title}":`, (err as Error).message);
    return "error";
  }
}

// ── YouTube channel discovery (bonus signal) ──────────────────────────────────
// Scans official African film channel uploads for trailer keywords.
// Only adds films not already in DB. Purely additive — no overwrites.

const AFRICAN_FILM_CHANNELS = [
  // Channel IDs for major African film distributors/studios
  "UCtvO_DgPkMCGjvKOvE5e2ZA", // FilmOne Entertainment
  "UCqcTSjckRnYTjFqAx_9WM5A", // EbonyLife Films
  "UCGCIjl6nLlHVsBFKFQd56Bw", // Nollywood Blockbusters
];

async function discoverFromYouTube(): Promise<number> {
  const ytKey = process.env.YOUTUBE_API_KEY;
  if (!ytKey) return 0;

  let found = 0;
  for (const channelId of AFRICAN_FILM_CHANNELS) {
    try {
      const url = new URL("https://www.googleapis.com/youtube/v3/search");
      url.searchParams.set("key", ytKey);
      url.searchParams.set("channelId", channelId);
      url.searchParams.set("part", "snippet");
      url.searchParams.set("order", "date");
      url.searchParams.set("type", "video");
      url.searchParams.set("q", "trailer OR official OR teaser");
      url.searchParams.set("maxResults", "10");
      url.searchParams.set("publishedAfter", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) continue;

      const data = await res.json() as {
        items: { id: { videoId: string }; snippet: { title: string; publishedAt: string } }[]
      };

      for (const item of data.items ?? []) {
        const title = item.snippet.title
          .replace(/official|trailer|teaser|extended|clip|hd|4k|\|.*$/gi, "")
          .trim();
        if (!title || title.length < 3) continue;

        // Search TMDb to find a matching upcoming film
        try {
          const search = await tmdbGet<{ results: { id: number; title: string; release_date?: string }[] }>(
            "/search/movie", { query: title }
          );
          const match = search.results[0];
          if (!match) continue;

          const exists = await prisma.film.findFirst({
            where: { tmdbId: match.id },
          });
          if (exists) continue;

          // Process this film
          const basic: TmdbMovie = {
            id: match.id,
            title: match.title,
            overview: "",
            release_date: match.release_date ?? "",
            poster_path: null,
            backdrop_path: null,
            genre_ids: [],
            original_language: "en",
          };
          const result = await processFilm(basic, false, "NG");
          if (result === "created_upcoming") {
            console.log(`  ► YouTube discovery: "${match.title}" (from channel ${channelId})`);
            found++;
          }
        } catch { /* skip */ }

        await sleep(200);
      }
    } catch (err) {
      console.error(`  YouTube channel ${channelId} error:`, (err as Error).message);
    }
  }
  return found;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── Upcoming film discovery ───────────────────────────────────");
  console.log(`  Regions: ${COVERED_REGIONS.join(", ")}`);
  console.log(`  YouTube: ${process.env.YOUTUBE_API_KEY ? "enabled" : "disabled (set YOUTUBE_API_KEY)"}\n`);

  let created = 0, updated = 0, skippedExisting = 0, skippedNonAfrican = 0;

  // Deduplicate across regions (same TMDb film may appear for multiple countries)
  const seen = new Set<number>();

  for (const region of COVERED_REGIONS) {
    try {
      console.log(`  Scanning ${region}...`);
      const { upcoming, nowPlaying } = await fetchRegionFilms(region);
      await sleep(500);

      for (const film of upcoming) {
        if (seen.has(film.id)) continue;
        seen.add(film.id);
        const result = await processFilm(film, false, region);
        if (result === "created_upcoming") { created++; console.log(`    + UPCOMING: "${film.title}" (${film.release_date?.slice(0,4) ?? "?"}) [TMDb ${film.id}]`); }
        else if (result === "skipped_non_african") skippedNonAfrican++;
        else if (result === "skipped_existing") skippedExisting++;
        await sleep(350);
      }

      for (const film of nowPlaying) {
        if (seen.has(film.id)) continue;
        seen.add(film.id);
        const result = await processFilm(film, true, region);
        if (result === "created_upcoming") { created++; console.log(`    + NOW PLAYING: "${film.title}" [TMDb ${film.id}]`); }
        else if (result === "updated_live") { updated++; console.log(`    ↑ LIVE flagged: "${film.title}"`); }
        else if (result === "skipped_non_african") skippedNonAfrican++;
        else if (result === "skipped_existing") skippedExisting++;
        await sleep(350);
      }
    } catch (err) {
      console.error(`  Region ${region} error:`, (err as Error).message);
    }
  }

  // YouTube bonus discovery
  const ytFound = await discoverFromYouTube();

  console.log("\n── Summary ───────────────────────────────────────────────────");
  console.log(`  New upcoming films created : ${created}`);
  console.log(`  Existing films set to LIVE : ${updated}`);
  console.log(`  YouTube discoveries        : ${ytFound}`);
  console.log(`  Already in DB (skipped)    : ${skippedExisting}`);
  console.log(`  Non-African (rejected)     : ${skippedNonAfrican}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
