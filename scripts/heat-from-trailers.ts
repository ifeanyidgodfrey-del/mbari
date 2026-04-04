/**
 * scripts/heat-from-trailers.ts
 *
 * Gets YouTube view counts for films that already have trailerUrl stored.
 * Uses the /videos endpoint (no billing required — only /search needs billing).
 *
 * Usage:
 *   npx tsx scripts/heat-from-trailers.ts
 *   npx tsx scripts/heat-from-trailers.ts --force   (re-score films that already have heatScore)
 */

import { Client } from "pg";

const FORCE = process.argv.includes("--force");

function viewsToHeat(views: number): number {
  if (views <= 0) return 0;
  const log = Math.log10(views);
  return Math.min(100, Math.max(1, Math.round((log / 8) * 100)));
}

async function main() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY not set");

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows } = await db.query<{
    id: string; title: string; trailerUrl: string; heatScore: number | null;
  }>(
    `SELECT id, title, "trailerUrl", "heatScore"
     FROM "Film"
     WHERE "trailerUrl" LIKE '%youtube.com/watch?v=%'
     ORDER BY title`
  );

  console.log(`\nFetching heat scores for ${rows.length} films with trailers...\n`);
  let updated = 0, skipped = 0, failed = 0;

  for (const film of rows) {
    if (film.heatScore != null && !FORCE) {
      console.log(`  SKIP  ${film.title} — heat ${film.heatScore} already set`);
      skipped++;
      continue;
    }

    let videoId: string | null = null;
    try {
      videoId = new URL(film.trailerUrl).searchParams.get("v");
    } catch {
      console.log(`  SKIP  ${film.title} — invalid URL`);
      skipped++;
      continue;
    }

    if (!videoId) {
      console.log(`  SKIP  ${film.title} — no video ID`);
      skipped++;
      continue;
    }

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${key}`
      );
      const data = await res.json() as {
        items?: { statistics: { viewCount?: string } }[]
      };

      if (!data.items?.length) {
        console.log(`  MISS  ${film.title} — video not found on YouTube`);
        failed++;
        continue;
      }

      const views = parseInt(data.items[0].statistics.viewCount ?? "0", 10);
      const heat = viewsToHeat(views);

      await db.query(
        `UPDATE "Film" SET "heatScore" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [heat, film.id]
      );

      console.log(`  OK    ${film.title} — ${views.toLocaleString()} views → heat ${heat}`);
      updated++;
    } catch (err) {
      console.error(`  FAIL  ${film.title}:`, err instanceof Error ? err.message : err);
      failed++;
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  await db.end();
  console.log(`\n── Done ──`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Failed  : ${failed}`);
}

main().catch(console.error);
