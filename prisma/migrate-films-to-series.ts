/**
 * prisma/migrate-films-to-series.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Migrates TV series records from the Film table to the new Series table.
 * Copies crew credits, availability, and language entries, then deletes the
 * original Film rows.
 *
 * Run:  npx tsx prisma/migrate-films-to-series.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// ─── Series metadata overrides ────────────────────────────────────────────────
// TMDb TV IDs differ from movie IDs; supply correct values here.
// Run `npx tsx prisma/migrate-films-to-series.ts` after verifying these IDs.
const SERIES_META: Record<string, {
  seasons?: number;
  episodes?: number;
  network?: string;
  status?: string;
  endYear?: number;
  tmdbId?: number;   // correct TMDb TV series ID (not movie ID)
  imdbId?: string;
}> = {
  "shanty-town":           { seasons: 1, episodes: 6, network: "Netflix", status: "ended", tmdbId: 228428, imdbId: "tt15686528" },
  "the-smart-money-woman": { seasons: 1, episodes: 6, network: "Netflix", status: "ended", tmdbId: 83197,  imdbId: "tt6682852" },
  "anikulapo":             { seasons: 1, episodes: 8, network: "Netflix", status: "ended", tmdbId: 230689, imdbId: "tt21253156" },
  "blood-and-water":       { seasons: 3, episodes: 18, network: "Netflix", status: "ended", tmdbId: 103411, imdbId: "tt10204160" },
  "reyka":                 { seasons: 1, episodes: 6, network: "M-Net",   status: "ended", tmdbId: 132629, imdbId: "tt10163204" },
  "spinners-s2":           { seasons: 2, network: "Netflix", status: "returning" },
  "reyka-s2":              { seasons: 2, network: "M-Net",   status: "returning" },
};

const SERIES_SLUGS = Object.keys(SERIES_META);

async function main() {
  console.log("── Film → Series migration ───────────────────────────────────\n");

  let migrated = 0;
  let skipped = 0;

  for (const filmSlug of SERIES_SLUGS) {
    // Load Film with all relations
    const film = await prisma.film.findUnique({
      where: { slug: filmSlug },
      include: {
        crew: { include: { crewMember: true } },
        availability: true,
        languages: { include: { language: true } },
      },
    });

    if (!film) {
      console.log(`  ⏭  "${filmSlug}" — not found in Film table, skipping`);
      skipped++;
      continue;
    }

    const meta = SERIES_META[filmSlug];

    // Check if already migrated
    const existing = await prisma.series.findUnique({ where: { slug: filmSlug } });
    if (existing) {
      console.log(`  ⏭  "${film.title}" — already in Series table`);
      skipped++;
      continue;
    }

    // Determine title (strip " S2" suffix for season-2 slugs)
    const title = film.title.replace(/\s+S\d+$/, "").replace(/\s+Season\s+\d+$/i, "");

    // Create Series record
    const series = await prisma.series.create({
      data: {
        slug: filmSlug,
        title,
        year: film.year,
        endYear: meta.endYear ?? null,
        seasons: meta.seasons ?? 1,
        episodes: meta.episodes ?? null,
        runtime: film.runtime,
        tagline: film.tagline,
        synopsis: film.synopsis,
        posterUrl: film.posterUrl,
        backdropUrl: film.backdropUrl,
        country: film.country,
        genres: film.genres,
        network: meta.network ?? null,
        status: meta.status ?? "returning",
        awards: film.awards,
        tmdbId: meta.tmdbId ?? null,
        imdbId: meta.imdbId ?? film.imdbId ?? null,
        trailerUrl: film.trailerUrl,
      },
    });

    // Migrate crew credits
    for (const cc of film.crew) {
      await prisma.seriesCrewCredit.create({
        data: {
          seriesId: series.id,
          crewMemberId: cc.crewMemberId,
          role: cc.role,
        },
      });
    }

    // Migrate availability
    for (const av of film.availability) {
      await prisma.seriesAvailability.create({
        data: {
          seriesId: series.id,
          countryCode: av.countryCode,
          platform: av.platform,
          accessType: av.accessType,
          url: av.url ?? null,
        },
      });
    }

    // Migrate languages
    for (const fl of film.languages) {
      await prisma.seriesLanguage.create({
        data: {
          seriesId: series.id,
          languageId: fl.languageId,
          percentage: fl.percentage,
        },
      });
    }

    // Delete Film relations (required before deleting the Film row)
    await prisma.crewCredit.deleteMany({ where: { filmId: film.id } });
    await prisma.availability.deleteMany({ where: { filmId: film.id } });
    await prisma.filmLanguage.deleteMany({ where: { filmId: film.id } });

    // Delete the Film record
    await prisma.film.delete({ where: { id: film.id } });

    console.log(
      `  ✓  "${film.title}" → Series [${meta.seasons ?? 1}S, ${meta.network ?? "?"}]` +
      `  crew=${film.crew.length} avail=${film.availability.length} lang=${film.languages.length}`
    );
    migrated++;
  }

  const remaining = await prisma.film.count();
  const totalSeries = await prisma.series.count();

  console.log(`\n── Summary ────────────────────────────────────────────────────`);
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Films DB : ${remaining} remaining`);
  console.log(`  Series DB: ${totalSeries} total`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
