/**
 * Sets boxLive=true for films that belong in the active box office chart.
 * These are released films with box office data or active theatrical runs.
 * Does NOT touch upcoming=true films.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);

const SLUGS_TO_ACTIVATE = [
  // Nigerian films
  "king-of-boys",
  "lionheart",
  "sugar-rush",
  "living-in-bondage-breaking-free",
  "rattlesnake-the-ahanna-story",
  "omo-ghetto-the-saga",
  "jagun-jagun",
  "a-tribe-called-judah",
  "the-black-book",
  "lisabi-the-uprising",
  "everybody-loves-jenifa",
  "gangs-of-lagos",
  "citation",
  "amina",
  "eyimofe",
  // South African
  "catch-me-a-killer",
  "heart-of-the-hunter",
  "the-fix",
  // Kenya
  "country-queen",
  // Pan-African
  "mami-wata",
  "breath-of-life",
];

async function main() {
  let updated = 0;
  for (const slug of SLUGS_TO_ACTIVATE) {
    const res = await prisma.film.updateMany({
      where: { slug, boxLive: false },
      data: { boxLive: true },
    });
    if (res.count > 0) { console.log("  ✓", slug); updated++; }
    else { console.log("  ⏭ ", slug, "(already set or not found)"); }
  }
  const total = await prisma.film.count({ where: { boxLive: true } });
  console.log(`\nUpdated ${updated} films. Total boxLive=true: ${total}`);
}

main().finally(() => prisma.$disconnect());
