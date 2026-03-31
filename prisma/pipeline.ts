/**
 * prisma/pipeline.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Cinema intelligence pipeline for M'Bari.
 *
 * Flow:
 *   1. Scrape tier-1/2 sources (FilmOne, Nollywire, elCinema, LBx Africa, …)
 *   2. TMDb search to enrich each scraped title
 *   3. Diff against existing DB (by tmdbId + slug)
 *   4. Append new candidates to prisma/review-queue.json — NEVER auto-imports
 *
 * Run manually:  npx tsx prisma/pipeline.ts
 * Via cron:      see scheduled-tasks (mbari-pipeline)
 *
 * Requires: TMDB_API_KEY in .env
 * Optional: TMDB_API_TOKEN (Bearer, used if API key not set)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const QUEUE_PATH = path.join(__dirname, "review-queue.json");
const TMDB_BASE = "https://api.themoviedb.org/3";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SOURCE DEFINITIONS  (tier-1 = distributors, tier-2 = press)
// ─────────────────────────────────────────────────────────────────────────────

interface Source {
  id: string;
  name: string;
  tier: 1 | 2;
  region: string;
  url: string;
  /** Extract film title strings from raw HTML */
  extract: (html: string) => string[];
}

const SOURCES: Source[] = [
  // ── Tier 1: Distributors ──────────────────────────────────────────────────

  {
    id: "filmone",
    name: "FilmOne Entertainment",
    tier: 1,
    region: "NG",
    url: "https://www.filmone.ng/movies",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*class="[^"]*(?:title|movie)[^"]*"[^>]*>([^<]+)<\/h[23]>/gi,
      /<a[^>]*class="[^"]*movie[^"]*"[^>]*>\s*<[^>]+>\s*([A-Z][^<]{3,60})<\/[^>]+>/gi,
      /"movie[_-]title"[^>]*>([^<]{3,80})</gi,
    ]),
  },
  {
    id: "elcinema",
    name: "elCinema",
    tier: 1,
    region: "EG",
    url: "https://www.elcinema.com/en/nowshowing/",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*>([^<]{3,80})<\/h[23]>/gi,
      /class="[^"]*film[^"]*title[^"]*"[^>]*>([^<]{3,80})</gi,
      /<a[^>]*href="\/en\/work\/[^"]*"[^>]*>([^<]{3,80})<\/a>/gi,
    ]),
  },
  {
    id: "lbx-africa",
    name: "LBx Africa",
    tier: 1,
    region: "KE",
    url: "https://www.lbxafrica.com/news",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*class="[^"]*(?:entry|post)[^"]*title[^"]*"[^>]*>([^<]{3,80})<\/h[23]>/gi,
      /<a[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]{3,80})<\/a>/gi,
      /<h[23][^>]*>([A-Z][^<]{3,80})<\/h[23]>/gi,
    ]),
  },
  {
    id: "showmax-stories",
    name: "Showmax Stories",
    tier: 1,
    region: "ZA",
    url: "https://stories.showmax.com/za/category/movies/",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*>([A-Z][^<]{3,80})<\/h[23]>/gi,
      /"headline"[^>]*>([^<]{3,80})</gi,
    ]),
  },

  // ── Tier 2: Press ─────────────────────────────────────────────────────────

  {
    id: "nollywire",
    name: "Nollywire",
    tier: 2,
    region: "NG",
    url: "https://nollywire.com/category/movies/",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*class="[^"]*(?:entry|post)[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]{3,80})<\/a>/gi,
      /<h[23][^>]*>([A-Z][^<]{3,80})<\/h[23]>/gi,
    ]),
  },
  {
    id: "sinema-focus",
    name: "SinemaFocus",
    tier: 2,
    region: "KE",
    url: "https://www.sinemafocus.com/category/review/",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*>([A-Z][^<]{3,80})<\/h[23]>/gi,
      /<a[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]{3,80})<\/a>/gi,
    ]),
  },
  {
    id: "akoroko",
    name: "Akoroko",
    tier: 2,
    region: "PAN",
    url: "https://akoroko.com/category/reviews/",
    extract: (html) => extractByPattern(html, [
      /<h[23][^>]*>([A-Z][^<]{3,80})<\/h[23]>/gi,
      /<a[^>]*class="[^"]*post-title[^"]*"[^>]*>([^<]{3,80})<\/a>/gi,
    ]),
  },
];

/** Apply multiple regex patterns and return unique non-empty matches */
function extractByPattern(html: string, patterns: RegExp[]): string[] {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    // Reset lastIndex for each pattern
    pattern.lastIndex = 0;
    while ((match = pattern.exec(html)) !== null) {
      const raw = match[1]
        ?.replace(/&amp;/g, "&")
        .replace(/&rsquo;|&#8217;/g, "'")
        .replace(/&ndash;|&#8211;/g, "–")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]+>/g, "")
        .trim();

      if (!raw || raw.length < 3 || raw.length > 80) continue;
      // Skip navigation / generic labels
      if (/^(movies?|films?|series|watch|home|about|contact|more|read|see all|showing|coming)/i.test(raw)) continue;

      const key = raw.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(raw);
      }
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SCRAPE
// ─────────────────────────────────────────────────────────────────────────────

interface ScrapeResult {
  source: string;
  tier: 1 | 2;
  region: string;
  titles: string[];
}

async function scrapeSource(source: Source): Promise<ScrapeResult> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MbariBot/1.0; +https://mbari.art)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`  ⚠  ${source.name}: HTTP ${res.status}`);
      return { source: source.id, tier: source.tier, region: source.region, titles: [] };
    }

    const html = await res.text();
    const titles = source.extract(html);
    console.log(`  ✓  ${source.name} [${source.region}]: ${titles.length} titles extracted`);
    return { source: source.id, tier: source.tier, region: source.region, titles };
  } catch (err) {
    console.warn(`  ✗  ${source.name}: ${(err as Error).message}`);
    return { source: source.id, tier: source.tier, region: source.region, titles: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TMDB ENRICH
// ─────────────────────────────────────────────────────────────────────────────

const AFRICAN_COUNTRIES = new Set([
  "DZ","EG","LY","MA","MR","SD","TN",
  "BJ","BF","CV","CI","GM","GH","GN","GW","LR","ML","NE","NG","SN","SL","TG",
  "AO","CM","CF","TD","CG","CD","GQ","GA","ST",
  "BI","KM","DJ","ER","ET","KE","MG","MW","MU","MZ","RW","SC","SO","SS","TZ","UG","ZA",
  "BW","LS","NA","SZ","ZM","ZW",
]);

async function tmdbGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  const token = process.env.TMDB_API_TOKEN;
  if (!key && !token) throw new Error("TMDB_API_KEY or TMDB_API_TOKEN not set");

  const url = new URL(`${TMDB_BASE}${path}`);
  if (key) url.searchParams.set("api_key", key);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token && !key) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`TMDb ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

function slugify(title: string, year: number | null): string {
  return (
    title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  ) + (year ? `-${year}` : "");
}

interface Candidate {
  tmdbId: number | null;
  imdbId: string | null;
  title: string;
  year: number | null;
  runtime: string | null;
  country: string;
  genres: string[];
  tagline: string | null;
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  tmdbRating: number | null;
  tmdbVotes: number | null;
  suggestedSlug: string;
  discoveredFrom: string[];
  discoveredAt: string;
  /** Admin fields — fill in before importing */
  approved: false;
  notes: string;
}

async function enrichWithTmdb(
  title: string,
  regionHint: string,
  sourceId: string,
  existingTmdbIds: Set<number | null>,
  existingSlugs: Set<string>
): Promise<Candidate | null> {
  try {
    const search = await tmdbGet<{
      results: { id: number; title: string; release_date?: string; original_language: string }[]
    }>("/search/movie", { query: title });

    await sleep(250);

    if (!search.results.length) return null;

    const match = search.results[0];
    if (existingTmdbIds.has(match.id)) return null;

    // Fetch full detail
    const detail = await tmdbGet<{
      id: number;
      title: string;
      original_title: string;
      overview: string;
      release_date: string;
      tagline: string;
      runtime: number | null;
      poster_path: string | null;
      backdrop_path: string | null;
      genres: { id: number; name: string }[];
      production_countries: { iso_3166_1: string }[];
      vote_average: number;
      vote_count: number;
      videos?: { results: { key: string; site: string; type: string; official: boolean }[] };
      external_ids?: { imdb_id: string | null };
    }>(`/movie/${match.id}`, { append_to_response: "videos,external_ids" });

    await sleep(300);

    // Validate African origin
    const country =
      detail.production_countries.find((c) => AFRICAN_COUNTRIES.has(c.iso_3166_1))?.iso_3166_1
      ?? (AFRICAN_COUNTRIES.has(regionHint) ? regionHint : null);

    if (!country) return null;

    const year = detail.release_date ? Number(detail.release_date.slice(0, 4)) : null;
    const suggestedSlug = slugify(detail.title, year);
    if (existingSlugs.has(suggestedSlug)) return null;

    const trailer =
      detail.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
      detail.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");

    let runtime: string | null = null;
    if (detail.runtime) {
      const h = Math.floor(detail.runtime / 60);
      const m = detail.runtime % 60;
      runtime = h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
    }

    return {
      tmdbId: detail.id,
      imdbId: detail.external_ids?.imdb_id ?? null,
      title: detail.title,
      year,
      runtime,
      country,
      genres: detail.genres.map((g) => g.name),
      tagline: detail.tagline || null,
      synopsis: detail.overview,
      posterUrl: detail.poster_path ? `https://image.tmdb.org/t/p/w500${detail.poster_path}` : null,
      backdropUrl: detail.backdrop_path ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}` : null,
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
      tmdbRating: detail.vote_average,
      tmdbVotes: detail.vote_count,
      suggestedSlug,
      discoveredFrom: [sourceId],
      discoveredAt: new Date().toISOString(),
      approved: false,
      notes: "",
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. QUEUE  (read / merge / write)
// ─────────────────────────────────────────────────────────────────────────────

interface QueueFile {
  lastUpdated: string;
  totalCandidates: number;
  note: string;
  candidates: Candidate[];
}

function loadQueue(): QueueFile {
  if (!fs.existsSync(QUEUE_PATH)) {
    return {
      lastUpdated: new Date().toISOString(),
      totalCandidates: 0,
      note: "Review each entry. Set approved:true and run import-from-queue.ts to import.",
      candidates: [],
    };
  }
  return JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8")) as QueueFile;
}

function saveQueue(queue: QueueFile) {
  queue.lastUpdated = new Date().toISOString();
  queue.totalCandidates = queue.candidates.length;
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const hasTmdb = !!(process.env.TMDB_API_KEY || process.env.TMDB_API_TOKEN);

  console.log("══════════════════════════════════════════════════════════");
  console.log("  M'Bari Cinema Intelligence Pipeline");
  console.log(`  TMDb enrichment : ${hasTmdb ? "enabled" : "disabled — set TMDB_API_KEY"}`);
  console.log("══════════════════════════════════════════════════════════\n");

  // Load existing DB state
  const existingFilms = await prisma.film.findMany({
    select: { tmdbId: true, slug: true },
  });
  const existingTmdbIds = new Set(existingFilms.map((f) => f.tmdbId));
  const existingSlugs = new Set(existingFilms.map((f) => f.slug));

  // Load existing queue to avoid re-adding known candidates
  const queue = loadQueue();
  const queuedTmdbIds = new Set(queue.candidates.map((c) => c.tmdbId).filter(Boolean));
  const queuedSlugs = new Set(queue.candidates.map((c) => c.suggestedSlug));

  console.log(`DB     : ${existingFilms.length} films`);
  console.log(`Queue  : ${queue.candidates.length} pending candidates\n`);

  // ── Step 1: Scrape all sources ─────────────────────────────────────────────
  console.log("── Step 1: Scraping sources ──────────────────────────────");
  const scrapeResults: ScrapeResult[] = [];
  for (const source of SOURCES) {
    const result = await scrapeSource(source);
    scrapeResults.push(result);
    await sleep(1_000); // polite delay between sites
  }

  // Deduplicate titles across sources, tracking which source found each
  const titleSourceMap = new Map<string, { title: string; sources: string[]; region: string }>();
  for (const result of scrapeResults) {
    for (const title of result.titles) {
      const key = title.toLowerCase();
      if (titleSourceMap.has(key)) {
        titleSourceMap.get(key)!.sources.push(result.source);
      } else {
        titleSourceMap.set(key, { title, sources: [result.source], region: result.region });
      }
    }
  }

  const uniqueTitles = Array.from(titleSourceMap.values());
  console.log(`\nTotal unique titles from scrape: ${uniqueTitles.length}\n`);

  if (!hasTmdb) {
    // Without TMDb: write raw scraped titles to queue without enrichment
    let rawAdded = 0;
    for (const { title, sources, region } of uniqueTitles) {
      const slug = slugify(title, null);
      if (existingSlugs.has(slug) || queuedSlugs.has(slug)) continue;

      queue.candidates.push({
        tmdbId: null,
        imdbId: null,
        title,
        year: null,
        runtime: null,
        country: region,
        genres: [],
        tagline: null,
        synopsis: "",
        posterUrl: null,
        backdropUrl: null,
        trailerUrl: null,
        tmdbRating: null,
        tmdbVotes: null,
        suggestedSlug: slug,
        discoveredFrom: sources,
        discoveredAt: new Date().toISOString(),
        approved: false,
        notes: "⚠ No TMDb enrichment — add TMDB_API_KEY and re-run to enrich.",
      });
      queuedSlugs.add(slug);
      rawAdded++;
    }
    console.log(`⚠  TMDb disabled. Added ${rawAdded} raw titles to queue (no posters/synopses).`);
  } else {
    // ── Step 2: TMDb enrich ───────────────────────────────────────────────────
    console.log("── Step 2: TMDb enrichment ───────────────────────────────");
    let enriched = 0, skipped = 0;

    for (const { title, sources, region } of uniqueTitles) {
      const candidate = await enrichWithTmdb(
        title,
        region,
        sources[0],
        new Set([...existingTmdbIds, ...queuedTmdbIds]),
        new Set([...existingSlugs, ...queuedSlugs])
      );

      if (!candidate) { skipped++; continue; }

      // Merge sources if discovered from multiple places
      const existing = queue.candidates.find((c) => c.tmdbId === candidate.tmdbId);
      if (existing) {
        for (const s of sources) {
          if (!existing.discoveredFrom.includes(s)) existing.discoveredFrom.push(s);
        }
        skipped++;
        continue;
      }

      candidate.discoveredFrom = sources;
      queue.candidates.push(candidate);
      if (candidate.tmdbId) queuedTmdbIds.add(candidate.tmdbId);
      queuedSlugs.add(candidate.suggestedSlug);
      enriched++;

      console.log(`  + ${candidate.title} (${candidate.year}) [${candidate.country}] ★${candidate.tmdbRating?.toFixed(1)}`);
    }

    console.log(`\nEnriched: ${enriched}  Skipped/non-African: ${skipped}`);
  }

  // Sort by TMDb rating desc (nulls last)
  queue.candidates.sort((a, b) => {
    if (a.approved !== b.approved) return a.approved ? -1 : 1; // approved first
    return (b.tmdbRating ?? 0) - (a.tmdbRating ?? 0);
  });

  saveQueue(queue);

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  Queue updated: ${queue.candidates.length} total candidates`);
  console.log(`  File: prisma/review-queue.json`);
  console.log("══════════════════════════════════════════════════════════");
  console.log('\nNext: open review-queue.json, set "approved": true on chosen');
  console.log('      entries, then run:  npx tsx prisma/import-from-queue.ts');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
