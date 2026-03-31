/**
 * scripts/batch-import.ts
 *
 * Batch-imports currently-playing African films from TMDb directly into
 * the M'Bari database using raw pg queries (no Prisma adapter needed).
 * Uses TMDb image URLs directly (no R2 mirroring).
 *
 * Usage (inside Docker container):
 *   npx tsx scripts/batch-import.ts
 */

import { Client } from "pg";

const BASE = "https://api.themoviedb.org/3";

const AFRICAN_ISO = new Set([
  "NG","GH","ZA","KE","ET","EG","MA","TN","CM","SN","CI","TZ","UG","RW",
  "ZW","MZ","AO","BJ","BF","GN","ML","NE","TD","SO","SD","ER","MG","MU",
]);

// Currently playing in African cinemas — genuinely local productions
const TMDB_IDS: number[] = [
  1657629, // Aba Blues (NG)
  1659486, // Evi (NG)
  1514381, // EgyBest (EG)
  1124796, // Cheat Sheet (EG)
  1567555, // Family Business (EG)
  1657195, // Sanita 2026 (ET)
  1653803, // Kalkidan 2026 (ET)
  1637597, // Medreshaye (ET)
  1642954, // Markos 2026 (ET)
  1652783, // Baloch ena Mistoch (ET)
  1171145, // Crime 101 (ZA)
  1383731, // Protector (ZA)
  938150,  // Wardriver (ZA)
];

interface TmdbDetail {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  runtime: number | null;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string }[];
  original_language: string;
  credits: {
    cast: { id: number; name: string; character: string; order: number }[];
    crew: { id: number; name: string; job: string; department: string }[];
  };
  videos?: { results: { key: string; site: string; type: string; official: boolean }[] };
  external_ids?: { imdb_id: string | null };
}

async function tmdbFetch(path: string): Promise<TmdbDetail> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not set");
  const url = `${BASE}${path}?api_key=${key}&language=en-US&append_to_response=credits,videos,external_ids`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb ${res.status} for ${path}`);
  return res.json() as Promise<TmdbDetail>;
}

function makeSlug(title: string, year: number): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    + `-${year}`
  );
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  let imported = 0, skipped = 0, failed = 0;

  for (const tmdbId of TMDB_IDS) {
    try {
      const d = await tmdbFetch(`/movie/${tmdbId}`);

      const isAfrican = d.production_countries.some((c) => AFRICAN_ISO.has(c.iso_3166_1));
      if (!isAfrican) {
        console.log(`  SKIP  [${tmdbId}] ${d.title} — no African production country`);
        skipped++;
        continue;
      }

      const year = d.release_date ? Number(d.release_date.slice(0, 4)) : new Date().getFullYear();
      const slug = makeSlug(d.title, year);
      const country = d.production_countries.find((c) => AFRICAN_ISO.has(c.iso_3166_1))?.iso_3166_1 ?? "NG";
      const genres = d.genres.map((g) => g.name);
      const posterUrl = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null;
      const backdropUrl = d.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : null;
      const runtime = d.runtime ? `${d.runtime} min` : null;
      const trailer = d.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official)
        ?? d.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
      const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
      const imdbId = d.external_ids?.imdb_id ?? null;

      // Check if slug already exists, append suffix to avoid collision
      const existing = await db.query(`SELECT id, slug FROM "Film" WHERE "tmdbId" = $1 OR slug = $2 LIMIT 1`, [tmdbId, slug]);
      const finalSlug = existing.rows.length === 0 ? slug : existing.rows[0].slug;

      // Upsert film (conflict on tmdbId)
      const filmRes = await db.query(
        `INSERT INTO "Film" (
          id, slug, title, year, runtime, tagline, synopsis,
          "posterUrl", "backdropUrl", country, genres, "tmdbId", "imdbId",
          "trailerUrl", "boxLive", "criticCount",
          "audienceCount", "verifiedCount", awards, "isIndie", "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10::text[], $11, $12,
          $13, true, 0,
          0, 0, '{}', false, NOW(), NOW()
        )
        ON CONFLICT ("tmdbId") DO UPDATE SET
          "boxLive" = true,
          "posterUrl" = COALESCE(EXCLUDED."posterUrl", "Film"."posterUrl"),
          "backdropUrl" = COALESCE(EXCLUDED."backdropUrl", "Film"."backdropUrl"),
          "updatedAt" = NOW()
        RETURNING id, slug`,
        [finalSlug, d.title, year, runtime, d.tagline || null, d.overview,
         posterUrl, backdropUrl, country, genres, tmdbId, imdbId,
         trailerUrl]
      );

      console.log(`  OK    ${d.title} (${country}, ${year}) → ${filmRes.rows[0]?.slug ?? slug}`);
      imported++;
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  FAIL  tmdbId ${tmdbId}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  await db.end();
  console.log(`\nDone — imported/updated: ${imported}, skipped (non-African): ${skipped}, failed: ${failed}`);
}

main().catch(console.error);
