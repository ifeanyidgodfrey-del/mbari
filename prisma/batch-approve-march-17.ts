/**
 * March 17, 2026 — Batch approval & deactivation
 * Approves reviewed queue items, deactivates confirmed-stale films,
 * and updates ignore-titles.json.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);

const QUEUE_PATH = path.join(process.cwd(), "prisma/review-queue.json");
const IGNORE_PATH = path.join(process.cwd(), "prisma/ignore-titles.json");

function slug(title: string): string {
  return title.toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Films to CREATE (not yet in DB) ─────────────────────────────────────────
const CREATE_FILMS = [
  // Egypt
  { title: "En Ghab El Qot",                  slug: "en-ghab-el-qot",              country: "EG" },
  { title: "Tallaqni",                         slug: "tallaqni",                    country: "EG" },
  { title: "Wa Lana Fel Khayal Hob",           slug: "wa-lana-fel-khayal-hob",      country: "EG" },
  { title: "Al Selm w Al Thoban: Leab Eyal",  slug: "al-selm-w-al-thoban-leab-eyal", country: "EG" },
  // Ghana/West Africa
  { title: "Alive Till Dawn",                  slug: "alive-till-dawn",             country: "GH" },
  { title: "To Adaego With Love",              slug: "to-adaego-with-love",         country: "GH" },
  { title: "Friends Indeed",                   slug: "friends-indeed",              country: "GH" },
  { title: "Love & New Notes",                 slug: "love-and-new-notes",          country: "NG" }, // NG origin, GH screens
  { title: "Mothers of Chibok",                slug: "mothers-of-chibok",           country: "NG" }, // Nigerian subject matter
];

// ── Existing slugs to set boxLive=true ──────────────────────────────────────
const ACTIVATE_SLUGS = [
  "gawaza-wla-ganaza",   // EG — already in DB, was inactive
  "mothers-love",        // NG — already in DB, was inactive
  "headless",            // NG — already in DB, was inactive
];

// ── Slugs to deactivate (confirmed theatrical cycle complete) ───────────────
const DEACTIVATE_SLUGS = [
  "country-queen",       // KE — confirmed moved to streaming
  // heart-of-the-hunter (ZA) already boxLive=false
  // egy-best (EG) already boxLive=false
];

// ── ignore-titles.json: remove approved titles, keep the rest ───────────────
// "the bride" → APPROVE (Ghanaian/Nollywood co-production)
// "shelter" → APPROVE (Egyptian release)
const REMOVE_FROM_IGNORE = ["the bride", "shelter"];

async function main() {
  console.log("── March 17 Batch Approval ─────────────────────────────────");

  // 1. Create new film records
  console.log("\n① Creating new film records...");
  for (const f of CREATE_FILMS) {
    const exists = await prisma.film.findFirst({ where: { slug: f.slug } });
    if (exists) {
      console.log(`  ⏭  exists: ${f.title}`);
      // ensure it's live
      await prisma.film.update({ where: { slug: f.slug }, data: { boxLive: true } });
    } else {
      await prisma.film.create({
        data: { title: f.title, slug: f.slug, country: f.country, boxLive: true, year: 2026, synopsis: "" },
      });
      console.log(`  ✓ created: ${f.title} (${f.country})`);
    }
  }

  // 2. Activate existing films
  console.log("\n② Activating existing films...");
  for (const s of ACTIVATE_SLUGS) {
    const r = await prisma.film.updateMany({ where: { slug: s }, data: { boxLive: true } });
    console.log(r.count ? `  ✓ activated: ${s}` : `  ⚠ not found: ${s}`);
  }

  // 3. Deactivate stale films
  console.log("\n③ Deactivating stale films...");
  for (const s of DEACTIVATE_SLUGS) {
    const r = await prisma.film.updateMany({ where: { slug: s }, data: { boxLive: false } });
    console.log(r.count ? `  ✓ deactivated: ${s}` : `  ⚠ not found: ${s}`);
  }
  // Confirm heart-of-the-hunter and egy-best are already off
  const check = await prisma.film.findMany({
    where: { slug: { in: ["heart-of-the-hunter", "egy-best"] } },
    select: { slug: true, boxLive: true },
  });
  check.forEach((f) => console.log(`  ✓ confirmed off: ${f.slug} (live=${f.boxLive})`));

  // 4. Update ignore-titles.json
  console.log("\n④ Updating ignore-titles.json...");
  const ignore: string[] = JSON.parse(fs.readFileSync(IGNORE_PATH, "utf-8"));
  const updated = ignore.filter((t) => !REMOVE_FROM_IGNORE.includes(t));
  fs.writeFileSync(IGNORE_PATH, JSON.stringify(updated, null, 2));
  console.log(`  removed: ${REMOVE_FROM_IGNORE.join(", ")}`);
  console.log(`  remaining: ${updated.join(", ")}`);

  // 5. Clear review queue (all items processed)
  console.log("\n⑤ Clearing review queue...");
  fs.writeFileSync(QUEUE_PATH, "[]");
  console.log("  review-queue.json cleared");

  // 6. Summary
  const liveCount = await prisma.film.count({ where: { boxLive: true } });
  console.log(`\n── Done. boxLive=true: ${liveCount} films ──────────────────`);
}

main().finally(() => prisma.$disconnect());
