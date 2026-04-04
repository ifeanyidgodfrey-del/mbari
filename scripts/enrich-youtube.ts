/**
 * scripts/enrich-youtube.ts
 *
 * Enriches M'Bari films using the YouTube Data API v3 (free, 10k units/day):
 *   1. Finds official trailer for each film → stores trailerUrl if missing
 *   2. Pulls view count from trailer video → normalises to 0-100 heatScore
 *   3. Stores raw YouTube videoId and viewCount for future re-scoring
 *
 * Heat score formula:
 *   0–10k views     → 1–20
 *   10k–100k views  → 20–40
 *   100k–1M views   → 40–60
 *   1M–10M views    → 60–80
 *   10M+ views      → 80–100
 *
 * Quota cost: ~100 units per film (search) + 1 unit (stats) = ~101 units/film
 * For 100 films: ~10,100 units — just at the free daily limit.
 * Run with --limit=50 to stay safe if you have many films.
 *
 * Usage:
 *   npx tsx scripts/enrich-youtube.ts
 *   npx tsx scripts/enrich-youtube.ts --limit=50
 *   npx tsx scripts/enrich-youtube.ts --force   (re-score even if trailerUrl exists)
 */

import { Client } from "pg";

const YT_BASE = "https://www.googleapis.com/youtube/v3";

const args = process.argv.slice(2);
const LIMIT = (() => {
  const l = args.find((a) => a.startsWith("--limit="));
  return l ? parseInt(l.split("=")[1], 10) : 999;
})();
const FORCE = args.includes("--force");
const DEBUG = args.includes("--debug");

type Film = {
  id: string;
  title: string;
  year: number;
  country: string;
  trailerUrl: string | null;
  heatScore: number | null;
};

type YtSearchItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    description: string;
  };
};

type YtSearchResponse = {
  items?: YtSearchItem[];
};

type YtVideoStats = {
  items?: {
    statistics: { viewCount?: string; likeCount?: string };
  }[];
};

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigerian", GH: "Ghanaian", ZA: "South African",
  KE: "Kenyan", EG: "Egyptian", ET: "Ethiopian",
  MA: "Moroccan", SN: "Senegalese", TZ: "Tanzanian",
  CM: "Cameroonian", CI: "Ivorian",
};

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY not set");
  const qs = new URLSearchParams({ ...params, key }).toString();
  const res = await fetch(`${YT_BASE}${path}?${qs}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/** Build search queries in priority order */
function buildQueries(film: Film): string[] {
  const countryAdj = COUNTRY_NAME[film.country] ?? "";
  return [
    `"${film.title}" ${film.year} official trailer`,
    `"${film.title}" official trailer`,
    `${film.title} ${film.year} ${countryAdj} film trailer`,
    `${film.title} ${countryAdj} movie trailer`,
    `${film.title} ${film.year} film`,
  ];
}

/** Score how likely a search result is the right trailer */
function scoreResult(item: YtSearchItem, film: Film): number {
  const titleLower = item.snippet.title.toLowerCase();
  const filmTitleLower = film.title.toLowerCase();
  const channelLower = item.snippet.channelTitle.toLowerCase();

  let score = 0;

  // Title match
  if (titleLower.includes(filmTitleLower)) score += 40;
  else if (filmTitleLower.split(" ").filter(w => w.length > 3).every(w => titleLower.includes(w))) score += 20;

  // Trailer keyword
  if (titleLower.includes("official trailer")) score += 30;
  else if (titleLower.includes("trailer")) score += 20;
  else if (titleLower.includes("official")) score += 10;

  // Year
  if (titleLower.includes(String(film.year))) score += 15;

  // Channel signals
  if (channelLower.includes("official") || channelLower.includes("entertainment") ||
      channelLower.includes("films") || channelLower.includes("cinema") ||
      channelLower.includes("nollywood") || channelLower.includes("netflix")) score += 10;

  // Penalise reaction/review videos
  if (titleLower.includes("reaction") || titleLower.includes("review") ||
      titleLower.includes("explained") || titleLower.includes("breakdown")) score -= 30;

  return score;
}

/** Log-scale view count → 0-100 heat score */
function viewsToHeat(views: number): number {
  if (views <= 0) return 0;
  const log = Math.log10(views);
  // log10 scale: 0=1, 3=1k, 4=10k, 5=100k, 6=1M, 7=10M, 8=100M
  // Map 0–8 → 0–100
  const raw = Math.round((log / 8) * 100);
  return Math.min(100, Math.max(1, raw));
}

async function findTrailer(film: Film): Promise<{ videoId: string; views: number } | null> {
  const queries = buildQueries(film);

  for (const q of queries) {
    try {
      const data = await ytFetch<YtSearchResponse>("/search", {
        part: "snippet",
        q,
        type: "video",
        maxResults: "8",
      });

      if (!data.items?.length) {
        if (DEBUG) console.log(`        no results for: ${q}`);
        continue;
      }

      // Score and pick best result
      const scored = data.items
        .map((item) => ({ item, score: scoreResult(item, film) }));

      if (DEBUG) {
        scored.forEach(({ item, score }) =>
          console.log(`        [${score}] "${item.snippet.title}" — ${item.snippet.channelTitle}`)
        );
      }

      const passing = scored.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);

      if (!passing.length) continue;

      const best = passing[0].item;
      const videoId = best.id.videoId;

      // Fetch view stats
      const stats = await ytFetch<YtVideoStats>("/videos", {
        part: "statistics",
        id: videoId,
      });

      const viewCount = parseInt(stats.items?.[0]?.statistics?.viewCount ?? "0", 10);

      console.log(`      ✓ "${best.snippet.title}" by ${best.snippet.channelTitle}`);
      console.log(`        views: ${viewCount.toLocaleString()} → heat: ${viewsToHeat(viewCount)}`);

      return { videoId, views: viewCount };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("quotaExceeded")) {
        console.error("\n  ⚠️  YouTube quota exceeded for today. Run again tomorrow or use --limit.");
        process.exit(1);
      }
      // Other errors: try next query
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  return null;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows: films } = await db.query<Film>(
    `SELECT id, title, year, country, "trailerUrl", "heatScore"
     FROM "Film"
     WHERE "tmdbId" IS NOT NULL
     ORDER BY title
     LIMIT $1`,
    [LIMIT]
  );

  console.log(`\nEnriching ${films.length} films via YouTube${FORCE ? " (force mode)" : ""}...\n`);

  let trailerAdded = 0, heatUpdated = 0, skipped = 0, failed = 0;

  for (const film of films) {
    const hasTrailer = film.trailerUrl != null;
    const hasHeat = film.heatScore != null;

    if (hasTrailer && hasHeat && !FORCE) {
      console.log(`  SKIP  ${film.title} — already complete`);
      skipped++;
      continue;
    }

    console.log(`  → ${film.title} (${film.country}, ${film.year})`);

    try {
      const result = await findTrailer(film);

      if (!result) {
        console.log(`      ✗ no suitable video found`);
        failed++;
        continue;
      }

      const trailerUrl = `https://www.youtube.com/watch?v=${result.videoId}`;
      const heat = viewsToHeat(result.views);

      const updates: string[] = [];
      const vals: (string | number)[] = [];
      let idx = 1;

      if (!hasTrailer || FORCE) {
        updates.push(`"trailerUrl" = $${idx++}`);
        vals.push(trailerUrl);
        trailerAdded++;
      }

      updates.push(`"heatScore" = $${idx++}`);
      vals.push(heat);
      heatUpdated++;

      vals.push(film.id);
      await db.query(
        `UPDATE "Film" SET ${updates.join(", ")}, "updatedAt" = NOW() WHERE id = $${idx}`,
        vals
      );

    } catch (err) {
      console.error(`  FAIL  ${film.title}:`, err instanceof Error ? err.message : err);
      failed++;
    }

    // Polite pause — YouTube rate limits at ~100 req/s but we want to be gentle
    await new Promise((r) => setTimeout(r, 500));
  }

  await db.end();

  console.log(`\n── Done ──`);
  console.log(`  Trailers found  : ${trailerAdded}`);
  console.log(`  Heat scores set : ${heatUpdated}`);
  console.log(`  Skipped         : ${skipped}`);
  console.log(`  Not found       : ${failed}`);
}

main().catch(console.error);
