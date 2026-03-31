/**
 * prisma/dedup-films.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Finds film records that share the same title + year (i.e. the same real-world
 * film entered twice with different slugs), keeps the richer record, deletes
 * the duplicate, and prints the slugs that need next.config.js redirects.
 *
 * DRY RUN by default. Pass --apply to commit changes.
 *
 * Run:  npx tsx prisma/dedup-films.ts          # preview
 *       npx tsx prisma/dedup-films.ts --apply  # execute
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const APPLY = process.argv.includes("--apply");

/** Score a record by data richness — higher = keep this one */
function richness(f: {
  criticScore: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  tmdbId: number | null;
  boxCumulative: bigint | null;
  synopsis: string;
}) {
  let score = 0;
  if (f.criticScore != null) score += 10;
  if (f.posterUrl) score += 5;
  if (f.backdropUrl) score += 3;
  if (f.tmdbId != null) score += 4;
  if (f.boxCumulative != null) score += 8;
  if (f.synopsis.length > 100) score += 2;
  return score;
}

async function main() {
  console.log(`── Dedup films (${APPLY ? "APPLY" : "DRY RUN"}) ────────────────────────────────\n`);

  const films = await prisma.film.findMany({
    include: {
      cast: true,
      actorCredits: true,
      crew: true,
      availability: true,
      languages: true,
      reviews: true,
      submissions: true,
    },
    orderBy: { title: "asc" },
  });

  // Group by normalised title + year
  const groups = new Map<string, typeof films>();
  for (const f of films) {
    const key = f.title.trim().toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + f.year;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(f);
  }

  const dupeGroups = [...groups.values()].filter((g) => g.length > 1);

  if (!dupeGroups.length) {
    console.log("No duplicate title+year pairs found. DB is clean.");
    return;
  }

  const redirects: { from: string; to: string }[] = [];

  for (const group of dupeGroups) {
    // Sort by richness descending — keep the best
    group.sort((a, b) => richness(b) - richness(a));
    const [keep, ...drop] = group;

    console.log(`\n  "${keep.title}" (${keep.year}) — ${group.length} records`);
    console.log(`    KEEP  : ${keep.slug}  [richness=${richness(keep)}]`);

    for (const dupe of drop) {
      console.log(`    DROP  : ${dupe.slug}  [richness=${richness(dupe)}]`);
      redirects.push({ from: dupe.slug, to: keep.slug });

      if (!APPLY) continue;

      // Migrate any relations from dupe → keep (skip if already exists)
      for (const cc of dupe.crew) {
        const exists = await prisma.crewCredit.findUnique({
          where: { filmId_crewMemberId_role: { filmId: keep.id, crewMemberId: cc.crewMemberId, role: cc.role } },
        });
        if (!exists) await prisma.crewCredit.create({ data: { filmId: keep.id, crewMemberId: cc.crewMemberId, role: cc.role } });
      }
      for (const av of dupe.availability) {
        const exists = await prisma.availability.findUnique({
          where: { filmId_countryCode_platform: { filmId: keep.id, countryCode: av.countryCode, platform: av.platform } },
        });
        if (!exists) await prisma.availability.create({ data: { filmId: keep.id, countryCode: av.countryCode, platform: av.platform, accessType: av.accessType, url: av.url } });
      }
      for (const fl of dupe.languages) {
        const exists = await prisma.filmLanguage.findUnique({
          where: { filmId_languageId: { filmId: keep.id, languageId: fl.languageId } },
        });
        if (!exists) await prisma.filmLanguage.create({ data: { filmId: keep.id, languageId: fl.languageId, percentage: fl.percentage } });
      }

      // Delete dupe relations then the record
      await prisma.castMember.deleteMany({ where: { filmId: dupe.id } });
      await prisma.actorCredit.deleteMany({ where: { filmId: dupe.id } });
      await prisma.crewCredit.deleteMany({ where: { filmId: dupe.id } });
      await prisma.availability.deleteMany({ where: { filmId: dupe.id } });
      await prisma.filmLanguage.deleteMany({ where: { filmId: dupe.id } });
      await prisma.review.deleteMany({ where: { filmId: dupe.id } });
      await prisma.submission.updateMany({ where: { filmId: dupe.id }, data: { filmId: keep.id } });
      await prisma.film.delete({ where: { id: dupe.id } });
      console.log(`    ✓ Deleted ${dupe.slug}`);
    }
  }

  // Print redirect stanza for next.config.js
  console.log("\n── Add these redirects to next.config.js ─────────────────────");
  for (const r of redirects) {
    console.log(`  { source: "/film/${r.from}", destination: "/film/${r.to}", permanent: true },`);
  }

  if (!APPLY) {
    console.log(`\nRe-run with --apply to execute.`);
  } else {
    console.log(`\nDone. ${redirects.length} duplicate(s) removed.`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
