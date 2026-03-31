/**
 * enrich-tmdb.ts
 * For every film in the DB that has a tmdbId but is missing a poster, backdrop,
 * trailer, or runtime — fetch from TMDb and patch the record.
 *
 * Requires TMDB_API_KEY in .env
 * Run:  npx tsx prisma/enrich-tmdb.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { getMovieDetail, TMDB_POSTER_URL, TMDB_BACKDROP_URL } from "../lib/tmdb";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  if (!process.env.TMDB_API_KEY && !process.env.TMDB_API_TOKEN) {
    console.error("❌  Set TMDB_API_KEY or TMDB_API_TOKEN in .env first.");
    process.exit(1);
  }

  // Films with a tmdbId that are missing at least one enrichable field
  const films = await prisma.film.findMany({
    where: {
      tmdbId: { not: null },
      OR: [
        { posterUrl: null },
        { backdropUrl: null },
        { trailerUrl: null },
        { runtime: null },
      ],
    },
    select: { id: true, slug: true, title: true, tmdbId: true },
  });

  console.log(`Found ${films.length} film(s) to enrich via TMDb.\n`);

  let updated = 0;
  let skipped = 0;

  for (const film of films) {
    try {
      const detail = await getMovieDetail(film.tmdbId!);

      // YouTube trailer (official first, then any)
      const trailer =
        detail.videos?.results.find(
          (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
        ) ??
        detail.videos?.results.find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );

      const patch: Record<string, unknown> = {};

      if (detail.poster_path) patch.posterUrl = TMDB_POSTER_URL(detail.poster_path, "w500");
      if (detail.backdrop_path) patch.backdropUrl = TMDB_BACKDROP_URL(detail.backdrop_path, "w1280");
      if (trailer) patch.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
      if (detail.runtime) {
        const h = Math.floor(detail.runtime / 60);
        const m = detail.runtime % 60;
        patch.runtime = h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
      }
      if (detail.external_ids?.imdb_id) patch.imdbId = detail.external_ids.imdb_id;

      if (Object.keys(patch).length === 0) {
        console.log(`  ⏭  ${film.title} — nothing new from TMDb`);
        skipped++;
        continue;
      }

      await prisma.film.update({ where: { id: film.id }, data: patch });

      const fields = Object.keys(patch).join(", ");
      console.log(`  ✓  ${film.title} — updated: ${fields}`);
      updated++;

      // Polite rate limit (TMDb allows ~40 req/10s)
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ✗  ${film.title} (tmdbId ${film.tmdbId}) — ${err}`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}  Skipped/Errors: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
