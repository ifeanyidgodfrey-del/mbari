/**
 * scripts/enrich-crew-photos.ts
 *
 * Fetches crew member headshots from TMDb and mirrors them to R2.
 * Runs against all CrewMembers with no imageUrl (or --force to re-run all).
 *
 * Usage:
 *   npx tsx scripts/enrich-crew-photos.ts
 *   npx tsx scripts/enrich-crew-photos.ts --force
 *   npx tsx scripts/enrich-crew-photos.ts --limit=50
 */

import { Client } from "pg";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const TMDB_KEY    = "4511a094b25495db505c4909bc832781";
const TMDB_BASE   = "https://api.themoviedb.org/3";
const TMDB_IMG    = "https://image.tmdb.org/t/p/w342";

const args  = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = (() => {
  const l = args.find(a => a.startsWith("--limit="));
  return l ? parseInt(l.split("=")[1], 10) : 9999;
})();

type Crew = { id: string; slug: string; name: string; country: string | null; imageUrl: string | null };

function getR2() {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID not set");
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

const BUCKET     = () => process.env.R2_BUCKET_NAME ?? "mbari-media";
const PUBLIC_URL = () => process.env.R2_PUBLIC_URL  ?? "https://media.mbari.art";

async function r2Exists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET(), Key: key }));
    return true;
  } catch { return false; }
}

async function mirrorToR2(client: S3Client, sourceUrl: string, key: string): Promise<string> {
  if (await r2Exists(client, key)) return `${PUBLIC_URL()}/${key}`;
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await client.send(new PutObjectCommand({
    Bucket: BUCKET(), Key: key, Body: buf,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { "source-url": sourceUrl, "uploaded-by": "crew-photo-enricher" },
  }));
  return `${PUBLIC_URL()}/${key}`;
}

async function tmdbSearchPerson(name: string): Promise<{ id: number; profile_path: string | null } | null> {
  const qs = new URLSearchParams({ api_key: TMDB_KEY, query: name });
  const res = await fetch(`${TMDB_BASE}/search/person?${qs}`);
  if (!res.ok) return null;
  const data = await res.json() as { results?: { id: number; name: string; profile_path: string | null }[] };
  const results = data.results ?? [];
  // Find best match — prefer exact name match
  const exact = results.find(r => r.name.toLowerCase() === name.toLowerCase());
  const best  = exact ?? results[0] ?? null;
  return best ? { id: best.id, profile_path: best.profile_path } : null;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  const { rows } = await db.query<Crew>(
    `SELECT id, slug, name, country, "imageUrl"
     FROM "CrewMember"
     ${FORCE ? "" : `WHERE "imageUrl" IS NULL`}
     ORDER BY name
     LIMIT $1`,
    [LIMIT]
  );

  console.log(`\nEnriching photos for ${rows.length} crew members...\n`);

  const r2 = getR2();
  let updated = 0, skipped = 0, failed = 0;

  for (const crew of rows) {
    if (crew.imageUrl && !FORCE) {
      console.log(`  SKIP  ${crew.name} — photo already set`);
      skipped++;
      continue;
    }

    try {
      const person = await tmdbSearchPerson(crew.name);
      if (!person || !person.profile_path) {
        console.log(`  MISS  ${crew.name} — not found on TMDb`);
        failed++;
        await new Promise(r => setTimeout(r, 100));
        continue;
      }

      const sourceUrl = `${TMDB_IMG}${person.profile_path}`;
      const key       = `crew/${crew.slug}.jpg`;
      const url       = await mirrorToR2(r2, sourceUrl, key);

      await db.query(
        `UPDATE "CrewMember" SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [url, crew.id]
      );

      console.log(`  OK    ${crew.name} — ${url}`);
      updated++;
    } catch (err) {
      console.error(`  FAIL  ${crew.name}:`, err instanceof Error ? err.message : err);
      failed++;
    }

    await new Promise(r => setTimeout(r, 120)); // ~8 req/s — TMDb allows 50/s
  }

  await db.end();
  console.log(`\n── Done ──`);
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Not found: ${failed}`);
}

main().catch(console.error);
