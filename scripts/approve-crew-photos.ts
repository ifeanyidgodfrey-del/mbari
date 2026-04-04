/**
 * scripts/approve-crew-photos.ts
 *
 * Reads crew-photo-review-queue.json and applies approved entries to the database.
 * If R2 credentials are set, mirrors images to R2 first. Otherwise stores TMDb URL directly.
 *
 * Approval modes:
 *   --approve-all       Mark all pending (approved=null) entries as approved and apply
 *   --slug=ade-laoye    Approve a single crew member by slug
 *   --dry-run           Print what would happen without writing to DB
 *
 * Usage:
 *   npx tsx scripts/approve-crew-photos.ts --approve-all
 *   npx tsx scripts/approve-crew-photos.ts --approve-all --dry-run
 */

import { Client } from "pg";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

const QUEUE_FILE = path.resolve(process.cwd(), "crew-photo-review-queue.json");

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes("--dry-run");
const ALL      = args.includes("--approve-all");
const SLUG_ARG = args.find(a => a.startsWith("--slug="))?.split("=")[1];

type QueueEntry = {
  id: string;
  slug: string;
  name: string;
  roles: string[];
  currentImageUrl: string | null;
  tmdbId: number;
  tmdbName: string;
  tmdbImageUrl: string;
  tmdbProfilePage: string;
  approved: boolean | null;
};

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) return null;
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
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${sourceUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await client.send(new PutObjectCommand({
    Bucket: BUCKET(), Key: key, Body: buf,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { "source-url": sourceUrl, "tmdb-id": String(0) },
  }));
  return `${PUBLIC_URL()}/${key}`;
}

async function main() {
  if (!fs.existsSync(QUEUE_FILE)) {
    console.error(`Queue file not found: ${QUEUE_FILE}`);
    console.error(`Run: npx tsx scripts/enrich-crew-photos.ts first`);
    process.exit(1);
  }

  const queue: QueueEntry[] = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));

  // Determine which entries to apply
  let targets = queue.filter(e => e.approved === true);

  if (ALL) {
    // Mark all pending as approved in memory
    targets = queue.filter(e => e.approved === null);
    console.log(`Approving all ${targets.length} pending entries...`);
  } else if (SLUG_ARG) {
    targets = queue.filter(e => e.slug === SLUG_ARG && e.approved === null);
    if (targets.length === 0) {
      console.error(`No pending entry found for slug: ${SLUG_ARG}`);
      process.exit(1);
    }
  }

  if (targets.length === 0) {
    console.log("No entries to apply. Use --approve-all or --slug=<slug>");
    console.log(`Queue has ${queue.filter(e => e.approved === null).length} pending, ${queue.filter(e => e.approved === true).length} pre-approved`);
    process.exit(0);
  }

  const r2 = getR2();
  if (r2) {
    console.log("R2 configured — will mirror images to R2");
  } else {
    console.log("R2 not configured — will use TMDb URLs directly");
  }

  if (DRY_RUN) console.log("DRY RUN — no DB writes\n");

  const db = new Client({ connectionString: process.env.DATABASE_URL });
  if (!DRY_RUN) await db.connect();

  let applied = 0, failed = 0;

  for (const entry of targets) {
    try {
      let imageUrl = entry.tmdbImageUrl;

      if (r2 && !DRY_RUN) {
        const key = `crew/${entry.slug}.jpg`;
        imageUrl = await mirrorToR2(r2, entry.tmdbImageUrl, key);
      }

      if (DRY_RUN) {
        console.log(`  [DRY] ${entry.name} → ${imageUrl}`);
        applied++;
        continue;
      }

      await db.query(
        `UPDATE "CrewMember" SET "imageUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [imageUrl, entry.id]
      );
      console.log(`  OK  ${entry.name} → ${imageUrl}`);
      applied++;

      // Mark as approved in queue
      const idx = queue.findIndex(q => q.id === entry.id);
      if (idx >= 0) queue[idx].approved = true;
    } catch (err) {
      console.error(`  FAIL ${entry.name}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  if (!DRY_RUN) {
    await db.end();
    // Persist approval status
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  }

  console.log(`\n── Done ──`);
  console.log(`  Applied : ${applied}`);
  console.log(`  Failed  : ${failed}`);
  if (DRY_RUN) console.log(`  (dry run — nothing written)`);
}

main().catch(console.error);
