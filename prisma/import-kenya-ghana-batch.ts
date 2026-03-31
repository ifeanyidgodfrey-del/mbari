/**
 * import-kenya-ghana-batch.ts
 * Imports 5 new films from Kenya and Ghana (2023–2026).
 *
 * Run:  npx tsx prisma/import-kenya-ghana-batch.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("M'Bari — Kenya & Ghana Batch Import");

  // ── Language map ──────────────────────────────────────────────────────────
  const langs = await prisma.language.findMany();
  const lm: Record<string, string> = {};
  for (const l of langs) lm[l.code] = l.id;

  const ensureLang = async (code: string, name: string, native: string) => {
    if (!lm[code]) {
      const l = await prisma.language.upsert({
        where: { code },
        update: {},
        create: { code, name, native },
      });
      lm[code] = l.id;
    }
  };

  await ensureLang("sw", "Swahili", "Kiswahili");
  await ensureLang("ak", "Akan", "Akan");
  await ensureLang("en", "English", "English");

  // ── Helpers ───────────────────────────────────────────────────────────────
  type FilmData = Parameters<typeof prisma.film.upsert>[0]["create"];
  async function upsertFilm(data: FilmData) {
    return prisma.film.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  async function addLang(filmId: string, code: string, pct: number) {
    const languageId = lm[code];
    if (!languageId) return;
    await prisma.filmLanguage
      .upsert({
        where: { filmId_languageId: { filmId, languageId } },
        update: {},
        create: { filmId, languageId, percentage: pct },
      })
      .catch(() => {});
  }

  async function addAvail(
    filmId: string,
    countryCode: string,
    platform: string,
    accessType = "svod"
  ) {
    await prisma.availability
      .upsert({
        where: { filmId_countryCode_platform: { filmId, countryCode, platform } },
        update: {},
        create: { filmId, countryCode, platform, accessType },
      })
      .catch(() => {});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // KENYA
  // ═══════════════════════════════════════════════════════════════════════════

  // Un-Adult-erated (2023)
  const unadulterated = await upsertFilm({
    slug: "un-adult-erated",
    title: "Un-Adult-erated",
    year: 2023,
    runtime: null,
    country: "KE",
    genres: ["Action", "Crime"],
    tagline: "The past never stops chasing you.",
    synopsis:
      "When the ghosts of his past catch up with him, Matheu must confront and fight them to find love. A Guy Ritchie-style Kenyan crime story praised for its high ambition, sharp stunt work, and gritty street-level energy.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [],
    imdbId: "tt27545154",
  });

  // Beneath The Tides (2026)
  const beneathTheTides = await upsertFilm({
    slug: "beneath-the-tides",
    title: "Beneath The Tides",
    year: 2026,
    runtime: null,
    country: "KE",
    genres: ["Drama"],
    tagline: "Five films. One continent. Countless truths.",
    synopsis:
      "A curated collection of five short films — Baba (Mbithi Masya), Stero (Tevin Kimathi & Millan Tarus), Mawimbi (Mark Wambui), Inheritance, and Ziwa (Samuel Tebandeke) — exploring family, identity, and post-colonial memory across Africa. Baba won the Baobab Award for Best Short Film at Film Africa London 2022. The collection has screened at TIFF, IFFR, FESPACO, and ZIFF before its Kenyan theatrical run.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: true,
    awards: [
      "Film Africa London 2022: Baobab Award for Best Short Film (Baba)",
      "TIFF: Official Selection",
      "IFFR: Official Selection",
      "FESPACO: Official Selection",
      "ZIFF: Official Selection",
    ],
  });

  // Inside Job (2025)
  const insideJob = await upsertFilm({
    slug: "inside-job-ke",
    title: "Inside Job",
    year: 2025,
    runtime: "1h 15m",
    country: "KE",
    genres: ["Comedy", "Crime"],
    tagline: "The best revenge? Rob him blind.",
    synopsis:
      "When a heartless businessman fires his honest housekeeper without warning or a pension, her jobless daughter and niece decide to make things right by breaking into his house and robbing him blind. What follows is a chaotic, hilarious heist as the two cousins team up to right a wrong and reclaim their aunt's dignity. From Tosh Gitonga, director of Nairobi Half Life.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [],
    imdbId: "tt37427762",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GHANA
  // ═══════════════════════════════════════════════════════════════════════════

  // TWO (2026 — upcoming)
  const two = await upsertFilm({
    slug: "two-gh",
    title: "TWO",
    year: 2026,
    runtime: null,
    country: "GH",
    genres: ["Crime", "Drama", "Neo-Noir"],
    tagline: "Retire from crime. Your past won't.",
    synopsis:
      "Marcus, a reformed criminal who deliberately botched his last job to escape a life of violence, has found peace in the church and fallen in love. But when his old mentor and boss reappear, demanding that he tie up one final loose end, his quiet new life begins to unravel. Ghana's first neo-noir feature, directed by Nana Kofi Asihene.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    upcoming: true,
    awards: [],
  });

  // The Fisherman (2024)
  const theFisherman = await upsertFilm({
    slug: "the-fisherman-gh",
    title: "The Fisherman",
    year: 2024,
    runtime: "1h 45m",
    country: "GH",
    genres: ["Comedy", "Fantasy", "Drama"],
    tagline: "Some dreams are worth casting your net for.",
    synopsis:
      "When elderly fisherman Atta Oko is forced into retirement, he is improbably partnered with a modern, sophisticated talking fish. As fishy chaos ensues, Atta and three quirky associates navigate the vibrant streets of Accra, chasing their shared dream of owning a fishing boat. A whimsical, heartfelt tale of family, resilience, and Ghanaian culture — and the first Ghanaian film officially selected for the Venice International Film Festival.",
    posterUrl: null,
    criticScore: 76,
    audienceScore: 75,
    verifiedScore: 75,
    heatScore: 72,
    criticCount: 14,
    audienceCount: 5200,
    verifiedCount: 940,
    boxLive: false,
    awards: [
      "Venice International Film Festival 2024: UNESCO Fellini Medal (Enrico Fulchignoni Prize)",
      "Venice International Film Festival 2024: First Ghanaian film selected",
      "Regal Film Festival Awards (REFFAA) 2025: Best Ghanaian Film",
      "Regal Film Festival Awards (REFFAA) 2025: Best Actor in Leading Role (Ricky Adelayitar)",
      "AFRIFF Globe Awards 2025: Best Director (Zoey Martinson)",
      "American Black Film Festival: Best Director",
      "American Black Film Festival: Best Narrative Feature",
    ],
    imdbId: "tt32986677",
  });

  console.log("Films upserted.");

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGES
  // ═══════════════════════════════════════════════════════════════════════════

  // Kenya
  await addLang(unadulterated.id, "en", 60);
  await addLang(unadulterated.id, "sw", 40);
  await addLang(beneathTheTides.id, "sw", 50);
  await addLang(beneathTheTides.id, "en", 50);
  await addLang(insideJob.id, "en", 60);
  await addLang(insideJob.id, "sw", 40);

  // Ghana
  await addLang(two.id, "en", 80);
  await addLang(two.id, "ak", 20);
  await addLang(theFisherman.id, "en", 50);
  await addLang(theFisherman.id, "ak", 50);

  console.log("Languages assigned.");

  // ═══════════════════════════════════════════════════════════════════════════
  // AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  await addAvail(insideJob.id, "KE", "Netflix");
  await addAvail(beneathTheTides.id, "KE", "Cinema", "theatrical");
  await addAvail(theFisherman.id, "GH", "Cinema", "theatrical");

  console.log("Availability records added.");
  console.log("\nDone. 5 films imported across KE / GH.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
