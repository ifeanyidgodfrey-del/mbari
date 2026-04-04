/**
 * scripts/enrich-actor-photos.ts
 *
 * Searches TMDb for actor headshots and writes candidates to a REVIEW QUEUE file.
 * Does NOT update the database — run approve-actor-photos.ts after reviewing.
 *
 * Usage:
 *   npx tsx scripts/enrich-actor-photos.ts
 *   npx tsx scripts/enrich-actor-photos.ts --force
 *   npx tsx scripts/enrich-actor-photos.ts --limit=50
 *
 * Output: QUEUE_FILE env var (default: actor-photo-review-queue.json)
 */

import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const TMDB_KEY  = "4511a094b25495db505c4909bc832781";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG  = "https://image.tmdb.org/t/p/w342";

const args  = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = (() => {
  const l = args.find(a => a.startsWith("--limit="));
  return l ? parseInt(l.split("=")[1], 10) : 9999;
})();

const QUEUE_FILE = process.env.QUEUE_FILE ?? path.resolve(process.cwd(), "actor-photo-review-queue.json");

type Actor = { id: string; slug: string; name: string; nationality: string | null; imageUrl: string | null };

type QueueEntry = {
  id: string;
  slug: string;
  name: string;
  nationality: string | null;
  currentImageUrl: string | null;
  tmdbId: number;
  tmdbName: string;
  tmdbImageUrl: string;
  tmdbProfilePage: string;
  approved: boolean | null;
};

async function tmdbSearchPerson(name: string): Promise<{ id: number; name: string; profile_path: string | null } | null> {
  const qs = new URLSearchParams({ api_key: TMDB_KEY, query: name });
  const res = await fetch(`${TMDB_BASE}/search/person?${qs}`);
  if (!res.ok) return null;
  const data = await res.json() as { results?: { id: number; name: string; profile_path: string | null }[] };
  const results = data.results ?? [];
  const exact = results.find(r => r.name.toLowerCase() === name.toLowerCase());
  return exact ?? results[0] ?? null;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows } = await db.query<Actor>(
    `SELECT id, slug, name, nationality, "imageUrl"
     FROM "Actor"
     ${FORCE ? "" : `WHERE "imageUrl" IS NULL`}
     ORDER BY name
     LIMIT $1`,
    [LIMIT]
  );

  console.log(`\nSearching TMDb for ${rows.length} actors...\n`);

  let existing: QueueEntry[] = [];
  if (fs.existsSync(QUEUE_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8")); } catch { existing = []; }
  }
  const existingIds = new Set(existing.map(e => e.id));

  const newEntries: QueueEntry[] = [];
  let found = 0, missed = 0;

  for (const actor of rows) {
    if (existingIds.has(actor.id) && !FORCE) {
      console.log(`  SKIP  ${actor.name} — already in queue`);
      continue;
    }

    try {
      const person = await tmdbSearchPerson(actor.name);
      if (!person || !person.profile_path) {
        console.log(`  MISS  ${actor.name} — no result on TMDb`);
        missed++;
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      newEntries.push({
        id: actor.id,
        slug: actor.slug,
        name: actor.name,
        nationality: actor.nationality,
        currentImageUrl: actor.imageUrl,
        tmdbId: person.id,
        tmdbName: person.name,
        tmdbImageUrl: `${TMDB_IMG}${person.profile_path}`,
        tmdbProfilePage: `https://www.themoviedb.org/person/${person.id}`,
        approved: null,
      });
      console.log(`  FOUND ${actor.name} → TMDb: ${person.name}`);
      found++;
    } catch (err) {
      console.error(`  FAIL  ${actor.name}:`, err instanceof Error ? err.message : err);
      missed++;
    }

    await new Promise(r => setTimeout(r, 120));
  }

  await db.end();

  const merged = [
    ...existing.filter(e => !newEntries.some(n => n.id === e.id)),
    ...newEntries,
  ];
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(merged, null, 2));

  console.log(`\n── Done ──`);
  console.log(`  Found    : ${found}`);
  console.log(`  Not found: ${missed}`);
  console.log(`  Queue    : ${merged.length} total entries`);
  console.log(`\nReview ${QUEUE_FILE}`);
  console.log(`Then run: QUEUE_FILE=/tmp/actor-photo-review-queue.json npx tsx scripts/approve-actor-photos.ts --approve-all`);
}

main().catch(console.error);
