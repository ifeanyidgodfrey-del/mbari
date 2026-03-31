/**
 * prisma/import-from-queue.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads prisma/review-queue.json and imports every entry where approved=true.
 * Imported entries are removed from the queue file.
 *
 * Run:  npx tsx prisma/import-from-queue.ts
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

const QUEUE_PATH = path.join(__dirname, "review-queue.json");

async function main() {
  if (!fs.existsSync(QUEUE_PATH)) {
    console.log("No review-queue.json found. Run pipeline.ts first.");
    return;
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
  const approved = (queue.candidates ?? []).filter((c: { approved: boolean }) => c.approved === true);
  const pending = (queue.candidates ?? []).filter((c: { approved: boolean }) => c.approved !== true);

  if (!approved.length) {
    console.log(`No approved entries found. Queue has ${pending.length} pending candidates.`);
    console.log('Set "approved": true on entries in prisma/review-queue.json to import them.');
    return;
  }

  console.log(`Importing ${approved.length} approved film(s)...\n`);

  let imported = 0;
  let failed = 0;

  for (const c of approved) {
    try {
      // Check for conflicts
      const conflict = await prisma.film.findFirst({
        where: {
          OR: [
            ...(c.tmdbId ? [{ tmdbId: c.tmdbId }] : []),
            { slug: c.suggestedSlug },
          ],
        },
        select: { slug: true },
      });

      if (conflict) {
        console.log(`  ⏭  "${c.title}" — already in DB as "${conflict.slug}", skipping`);
        imported++; // treat as success so it's removed from queue
        continue;
      }

      await prisma.film.create({
        data: {
          slug: c.suggestedSlug,
          title: c.title,
          year: c.year ?? new Date().getFullYear(),
          runtime: c.runtime ?? null,
          tagline: c.tagline ?? null,
          synopsis: c.synopsis || `${c.title} — added via M'Bari pipeline.`,
          posterUrl: c.posterUrl ?? null,
          backdropUrl: c.backdropUrl ?? null,
          country: c.country,
          genres: c.genres ?? [],
          tmdbId: c.tmdbId ?? null,
          imdbId: c.imdbId ?? null,
          trailerUrl: c.trailerUrl ?? null,
          awards: [],
          boxLive: false,
          upcoming: true,
        },
      });

      console.log(`  ✓  "${c.title}" (${c.year}) [${c.country}] — imported`);
      imported++;
    } catch (err) {
      console.error(`  ✗  "${c.title}" — ${(err as Error).message}`);
      failed++;
    }
  }

  // Remove successfully imported entries from queue
  queue.candidates = [
    ...pending,
    // Keep failed ones so they can be retried
    ...approved.slice(imported),
  ];
  queue.lastUpdated = new Date().toISOString();
  queue.totalCandidates = queue.candidates.length;
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));

  console.log(`\nDone. Imported: ${imported}  Failed: ${failed}`);
  console.log(`Queue now has ${queue.candidates.length} remaining candidates.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
