/**
 * scripts/batch-import.ts
 *
 * Batch-imports currently-playing African films from TMDb directly into
 * the M'Bari database, skipping R2 image mirroring (TMDb CDN URLs used).
 *
 * Usage:
 *   DATABASE_URL=... TMDB_API_KEY=... npx tsx scripts/batch-import.ts
 *
 * Only imports films whose production_countries include an African ISO code.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { getMovieDetail, tmdbToFilmShape, TMDB_POSTER_URL } from "../lib/tmdb";

const AFRICAN_ISO = new Set([
  "NG","GH","ZA","KE","ET","EG","MA","TN","CM","SN","CI","TZ","UG","RW",
  "ZW","MZ","AO","BJ","BF","GN","ML","NE","TD","SO","SD","ER","MG","MU",
]);

// Films currently playing in African cinemas (from /api/admin/now-playing)
// Filtered to exclude obvious Hollywood cross-overs
const TMDB_IDS_TO_IMPORT = [
  // Nigeria
  1657629, // Aba Blues
  1659486, // Evi
  // Egypt
  1514381, // EgyBest
  1124796, // Cheat Sheet
  1567555, // Family Business
  // Ethiopia
  1657195, // Sanita 2026
  1653803, // Kalkidan 2026
  1637597, // Medreshaye
  1642954, // Markos 2026
  1652783, // Baloch ena Mistoch
  // South Africa — English-language local productions
  1171145, // Crime 101
  1383731, // Protector
  938150,  // Wardriver
];

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const tmdbId of TMDB_IDS_TO_IMPORT) {
    try {
      const detail = await getMovieDetail(tmdbId);

      // Only import if production country is African
      const isAfrican = detail.production_countries.some((c) => AFRICAN_ISO.has(c.iso_3166_1));
      if (!isAfrican) {
        console.log(`  SKIP  ${detail.title} — no African production country`);
        skipped++;
        continue;
      }

      const shape = tmdbToFilmShape(detail);
      const year = shape.year ?? new Date().getFullYear();

      // Ensure year is in slug
      const slug = shape.slug.includes(String(year)) ? shape.slug : `${shape.slug}-${year}`;

      // Use TMDb image URLs directly (no R2)
      const posterUrl = detail.poster_path ? TMDB_POSTER_URL(detail.poster_path, "w500") : null;
      const backdropUrl = detail.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
        : null;

      // Upsert the film
      const film = await prisma.film.upsert({
        where: { slug },
        create: {
          slug,
          title: shape.title,
          year,
          runtime: shape.runtime,
          tagline: shape.tagline,
          synopsis: shape.synopsis,
          posterUrl,
          backdropUrl,
          country: shape.country,
          genres: shape.genres,
          tmdbId: shape.tmdbId,
          imdbId: shape.imdbId,
          trailerUrl: shape.trailerUrl,
          originalLanguage: shape.originalLanguage,
          boxLive: true,
        },
        update: {
          title: shape.title,
          posterUrl,
          backdropUrl,
          tmdbId: shape.tmdbId,
          boxLive: true,
        },
      });

      // Upsert crew members
      for (const crewItem of shape.crew) {
        const memberSlug = crewItem.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
        const member = await prisma.crewMember.upsert({
          where: { slug: memberSlug },
          create: {
            slug: memberSlug,
            name: crewItem.name,
            type: "filmmaker",
            roles: [crewItem.job],
          },
          update: {},
        });
        await prisma.crewCredit.upsert({
          where: { filmId_crewMemberId_role: { filmId: film.id, crewMemberId: member.id, role: crewItem.job } },
          create: { filmId: film.id, crewMemberId: member.id, role: crewItem.job },
          update: {},
        });
      }

      console.log(`  OK    ${shape.title} (${shape.country}, ${year}) → slug: ${slug}`);
      imported++;

      // Polite rate limit: 250ms between TMDb calls
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.error(`  FAIL  tmdbId ${tmdbId}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  await prisma.$disconnect();
  await pool.end();
  console.log(`\nDone — imported: ${imported}, skipped: ${skipped}, failed: ${failed}`);
}

main().catch(console.error);
