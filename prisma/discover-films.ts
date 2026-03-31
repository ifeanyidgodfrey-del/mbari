/**
 * discover-films.ts
 * Searches TMDb for recent films from M'Bari's tracked regions, compares
 * against the existing DB, and writes NEW candidates to prisma/review-queue.json
 * for admin review. Nothing is imported automatically.
 *
 * Requires TMDB_API_KEY in .env
 * Run:  npx tsx prisma/discover-films.ts
 * Review output: prisma/review-queue.json
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";
import { discoverByRegion, getMovieDetail, TMDB_POSTER_URL, GENRE_MAP } from "../lib/tmdb";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// Regions to scan — add more as M'Bari expands
const SCAN_REGIONS = ["NG", "GH", "ZA", "KE", "ET", "EG", "SN", "CI", "CM"];

// Years to scan (current + previous)
const SCAN_YEARS = [2025, 2026];

interface Candidate {
  tmdbId: number;
  imdbId: string | null;
  title: string;
  originalTitle: string;
  year: number | null;
  runtime: string | null;
  country: string;
  genres: string[];
  tagline: string | null;
  synopsis: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  tmdbRating: number;
  tmdbVotes: number;
  suggestedSlug: string;
  source: string;
  discoveredAt: string;
}

function makeSlug(title: string, year: number | null): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") + (year ? `-${year}` : "")
  );
}

async function main() {
  if (!process.env.TMDB_API_KEY && !process.env.TMDB_API_TOKEN) {
    console.error("❌  Set TMDB_API_KEY or TMDB_API_TOKEN in .env first.");
    process.exit(1);
  }

  console.log("M'Bari — Film Discovery Observer\n");

  // Load existing records to avoid duplicates (check tmdbId, slug, and title+year)
  const existing = await prisma.film.findMany({
    select: { tmdbId: true, slug: true, title: true, year: true },
  });
  const existingTmdbIds = new Set(existing.map((f) => f.tmdbId).filter(Boolean));
  const existingSlugs = new Set(existing.map((f) => f.slug));
  // title+year set: "anikulapo_2022"
  const existingTitleYears = new Set(
    existing.map((f) => f.title.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + f.year)
  );

  console.log(`DB has ${existing.length} films. Scanning ${SCAN_REGIONS.length} regions × ${SCAN_YEARS.length} years...\n`);

  const candidates: Candidate[] = [];
  const seen = new Set<number>();

  for (const region of SCAN_REGIONS) {
    for (const year of SCAN_YEARS) {
      try {
        // Page 1 = top 20 by popularity for this region/year
        const results = await discoverByRegion(region, 1, "popularity.desc", year);
        await new Promise((r) => setTimeout(r, 250)); // rate limit

        for (const movie of results.results) {
          if (seen.has(movie.id)) continue;
          seen.add(movie.id);

          // Skip if already in DB (by tmdbId or title+year)
          if (existingTmdbIds.has(movie.id)) continue;
          const titleYearKey = movie.title.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + (movie.release_date?.slice(0, 4) ?? "");
          if (existingTitleYears.has(titleYearKey)) continue;

          // Skip very low-signal entries
          if (movie.vote_count < 3) continue;

          seen.add(movie.id);

          // Fetch full details for poster, trailer, runtime
          let detail;
          try {
            detail = await getMovieDetail(movie.id);
            await new Promise((r) => setTimeout(r, 300));
          } catch {
            continue;
          }

          const releaseYear = detail.release_date
            ? Number(detail.release_date.slice(0, 4))
            : null;

          const trailer =
            detail.videos?.results.find(
              (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
            ) ??
            detail.videos?.results.find(
              (v) => v.site === "YouTube" && v.type === "Trailer"
            );

          const suggestedSlug = makeSlug(detail.title, releaseYear);
          if (existingSlugs.has(suggestedSlug)) continue;

          let runtime: string | null = null;
          if (detail.runtime) {
            const h = Math.floor(detail.runtime / 60);
            const m = detail.runtime % 60;
            runtime = h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
          }

          candidates.push({
            tmdbId: detail.id,
            imdbId: detail.external_ids?.imdb_id ?? null,
            title: detail.title,
            originalTitle: detail.original_title,
            year: releaseYear,
            runtime,
            country: region,
            genres: detail.genres.map((g) => g.name),
            tagline: detail.tagline || null,
            synopsis: detail.overview,
            posterUrl: detail.poster_path ? TMDB_POSTER_URL(detail.poster_path, "w500") : null,
            backdropUrl: detail.backdrop_path
              ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
              : null,
            trailerUrl: trailer
              ? `https://www.youtube.com/watch?v=${trailer.key}`
              : null,
            tmdbRating: detail.vote_average,
            tmdbVotes: detail.vote_count,
            suggestedSlug,
            source: `TMDb discover — region:${region} year:${year}`,
            discoveredAt: new Date().toISOString(),
          });
        }

        console.log(
          `  ${region} ${year}: ${results.results.length} results, ` +
          `${results.results.filter((r) => !existingTmdbIds.has(r.id)).length} new candidates`
        );
      } catch (err) {
        console.error(`  ✗ ${region} ${year}: ${err}`);
      }
    }
  }

  // Sort by TMDb rating desc
  candidates.sort((a, b) => b.tmdbRating - a.tmdbRating);

  const outputPath = path.join(__dirname, "review-queue.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalCandidates: candidates.length,
        note: "Review each entry and move approved films into an import script. Do NOT auto-import.",
        candidates,
      },
      null,
      2
    )
  );

  console.log(`\n✅  Found ${candidates.length} new candidates.`);
  console.log(`📄  Review queue written to: prisma/review-queue.json`);
  console.log(`\nNext step: open review-queue.json, approve entries, and run an import script.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
