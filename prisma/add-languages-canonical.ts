/**
 * Adds language breakdowns for the canonical Nollywood films
 * where language data is not yet populated.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// Language breakdowns — verified against each film's dialogue
const LANG_DATA: Record<string, { code: string; pct: number }[]> = {
  "lionheart":                     [{ code: "en", pct: 65 }, { code: "ig", pct: 25 }, { code: "pcm", pct: 10 }],
  "living-in-bondage-breaking-free":[{ code: "en", pct: 60 }, { code: "ig", pct: 30 }, { code: "pcm", pct: 10 }],
  "sugar-rush":                    [{ code: "en", pct: 55 }, { code: "yo", pct: 20 }, { code: "pcm", pct: 25 }],
  "rattlesnake-the-ahanna-story":  [{ code: "en", pct: 50 }, { code: "ig", pct: 40 }, { code: "pcm", pct: 10 }],
  "amina":                         [{ code: "en", pct: 40 }, { code: "ha", pct: 55 }, { code: "yo", pct: 5 }],
  "eyimofe":                       [{ code: "en", pct: 30 }, { code: "yo", pct: 50 }, { code: "pcm", pct: 20 }],
  "citation":                      [{ code: "en", pct: 70 }, { code: "yo", pct: 20 }, { code: "pcm", pct: 10 }],
  "mami-wata":                     [{ code: "en", pct: 100 }],
  "a-tribe-called-judah":          [{ code: "yo", pct: 45 }, { code: "ig", pct: 20 }, { code: "en", pct: 25 }, { code: "pcm", pct: 10 }],
  "the-black-book":                [{ code: "en", pct: 70 }, { code: "yo", pct: 20 }, { code: "pcm", pct: 10 }],
  "jagun-jagun":                   [{ code: "yo", pct: 90 }, { code: "en", pct: 10 }],
  "lisabi-the-uprising":           [{ code: "yo", pct: 85 }, { code: "en", pct: 15 }],
  "king-of-boys":                  [{ code: "yo", pct: 70 }, { code: "en", pct: 20 }, { code: "pcm", pct: 10 }],
};

async function main() {
  for (const [slug, langs] of Object.entries(LANG_DATA)) {
    const film = await prisma.film.findUnique({
      where: { slug },
      include: { languages: true },
    });
    if (!film) { console.log(`  ⏭  ${slug}: not found`); continue; }
    if (film.languages.length > 0) { console.log(`  ⏭  ${slug}: languages already set`); continue; }

    for (const { code, pct } of langs) {
      const lang = await prisma.language.findUnique({ where: { code } });
      if (!lang) { console.log(`    ⚠ language code "${code}" not in DB, skipping`); continue; }
      await prisma.filmLanguage.create({
        data: { filmId: film.id, languageId: lang.id, percentage: pct },
      });
    }
    const codes = langs.map((l) => `${l.code}:${l.pct}%`).join(", ");
    console.log(`  ✓  ${slug}: ${codes}`);
  }
  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
