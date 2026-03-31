/**
 * prisma/import-canonical-nollywood.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds 11 missing canonical Nollywood films from 2018–2024.
 * Skips any that already exist (by slug or tmdbId).
 *
 * Run:  npx tsx prisma/import-canonical-nollywood.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const IMG = "https://image.tmdb.org/t/p/w500";
const BACK = "https://image.tmdb.org/t/p/w1280";
const YT = "https://www.youtube.com/watch?v=";

const FILMS = [
  {
    slug: "lionheart",
    title: "Lionheart",
    year: 2018,
    country: "NG",
    tmdbId: 543774,
    imdbId: "tt7707314",
    genres: ["Drama", "Comedy"],
    synopsis: "Adaeze Obiagu must take over her father's struggling bus transport company. Faced with a buyout from a corporate rival, she works with her uncle to save the family business — navigating male-dominated boardrooms and the traditions that bind them.",
    tagline: "Family is everything.",
    runtime: "1h 35m",
    posterUrl: `${IMG}/ndS2uJ8Sum1qEU0fn5c8tdGAMDe.jpg`,
    trailerUrl: `${YT}v45GprEyM7U`,
    criticScore: 82,
  },
  {
    slug: "living-in-bondage-breaking-free",
    title: "Living in Bondage: Breaking Free",
    year: 2019,
    country: "NG",
    tmdbId: 648041,
    imdbId: "tt12539758",
    genres: ["Drama", "Thriller"],
    synopsis: "Nino, the son of Andy Okeke — the iconic antihero of the original 1992 film — arrives in Lagos hungry for wealth and power. Seduced by the same dark forces that destroyed his father, he makes choices that echo across generations.",
    tagline: "The sins of the father.",
    runtime: "2h 03m",
    posterUrl: `${IMG}/8r4t7UW2ZlivGkytgEBy5idkAmV.jpg`,
    trailerUrl: `${YT}hJhfreO1xmI`,
    criticScore: 78,
  },
  {
    slug: "sugar-rush",
    title: "Sugar Rush",
    year: 2019,
    country: "NG",
    tmdbId: 721574,
    imdbId: "tt11430264",
    genres: ["Comedy", "Crime"],
    synopsis: "Three sisters accidentally stumble upon $800,000 in cash belonging to a dangerous criminal and must decide what to do with their sudden fortune — while avoiding the people who want it back.",
    tagline: null,
    runtime: "1h 47m",
    posterUrl: `${IMG}/o4gJaAkUTxyFJXPbjnyO2ubBV6g.jpg`,
    trailerUrl: `${YT}pvoYpx6W2RM`,
    criticScore: 72,
  },
  {
    slug: "rattlesnake-the-ahanna-story",
    title: "Rattlesnake: The Ahanna Story",
    year: 2020,
    country: "NG",
    tmdbId: 800415,
    imdbId: "tt13890834",
    genres: ["Crime", "Drama", "Thriller"],
    synopsis: "A remake of the classic 1995 Nollywood film. A young man from a poor background becomes one of Nigeria's most feared criminals, tracing his descent from desperation into a life of violence.",
    tagline: null,
    runtime: "2h 02m",
    posterUrl: `${IMG}/ebo8C1dZeQyYy295VIDKrlYtNK2.jpg`,
    trailerUrl: `${YT}fGkINQho588`,
    criticScore: 69,
  },
  {
    slug: "amina",
    title: "Amina",
    year: 2021,
    country: "NG",
    tmdbId: 885110,
    imdbId: "tt15847872",
    genres: ["History", "Drama", "Action"],
    synopsis: "The story of Amina of Zazzau, a 16th-century Hausa warrior queen who expanded her kingdom's territory across what is now Northern Nigeria. A rare telling of pre-colonial African female leadership.",
    tagline: "A warrior. A queen. A legend.",
    runtime: "2h 00m",
    posterUrl: `${IMG}/hMIQiwLpBfTfe3ZbRlNx4225Mgg.jpg`,
    trailerUrl: `${YT}RW87asYGq7g`,
    criticScore: 74,
  },
  {
    slug: "eyimofe",
    title: "Eyimofe (This Is My Desire)",
    year: 2021,
    country: "NG",
    tmdbId: 665429,
    imdbId: "tt10365870",
    genres: ["Drama"],
    synopsis: "Two Lagos residents — a factory worker and a hairdresser — pursue their separate dreams of emigrating to Europe. A quiet, observational film that maps the invisible labour and bureaucratic walls facing ordinary Nigerians.",
    tagline: "This is my desire.",
    runtime: "1h 56m",
    posterUrl: `${IMG}/kWt6xCyoCIpLr7mbTpxeN6St46o.jpg`,
    trailerUrl: `${YT}H9LbzskTaBQ`,
    criticScore: 90,
  },
  {
    slug: "mami-wata",
    title: "Mami Wata",
    year: 2023,
    country: "NG",
    tmdbId: 1013865,
    imdbId: "tt6315898",
    genres: ["Drama", "Fantasy", "Horror"],
    synopsis: "In a fictional West African coastal village, a healer's power derives from the spirit Mami Wata. When a mysterious stranger arrives and challenges the village's belief in the deity, the community fractures between tradition and change. Shot entirely in black and white.",
    tagline: "The sea gives. The sea takes.",
    runtime: "1h 47m",
    posterUrl: `${IMG}/uiYCfBmoY7c5m19Jhtbjxu5l1Ed.jpg`,
    trailerUrl: `${YT}BRmj7lyvRlk`,
    criticScore: 86,
  },
  {
    slug: "a-tribe-called-judah",
    title: "A Tribe Called Judah",
    year: 2023,
    country: "NG",
    tmdbId: 1206988,
    imdbId: "tt29769154",
    genres: ["Crime", "Comedy", "Drama"],
    synopsis: "A single mother and her four sons — each with a different father — execute an elaborate heist on a corrupt politician. A sharp-edged crime comedy about class, family loyalty, and the particular texture of Lagos survival.",
    tagline: null,
    runtime: "2h 16m",
    posterUrl: `${IMG}/9aMG2ftIFqFAN69FdjovKJY0hsd.jpg`,
    trailerUrl: `${YT}pEUZVfeCU94`,
    criticScore: 79,
  },
  {
    slug: "the-black-book",
    title: "The Black Book",
    year: 2023,
    country: "NG",
    tmdbId: 1172009,
    imdbId: "tt24083908",
    genres: ["Action", "Thriller", "Crime"],
    synopsis: "A deacon's son is murdered and the crime is pinned on his grieving father, a former spy. To clear his son's name, the father returns to his violent past — unearthing a conspiracy that reaches the highest levels of Nigerian power.",
    tagline: null,
    runtime: "2h 10m",
    posterUrl: `${IMG}/kn28W24slBLyGr8ZIZnxNE5YZrY.jpg`,
    trailerUrl: `${YT}6PPH4SOm9gk`,
    criticScore: 77,
  },
  {
    slug: "jagun-jagun",
    title: "Jagun Jagun",
    year: 2023,
    country: "NG",
    tmdbId: 1163045,
    imdbId: "tt28546464",
    genres: ["Action", "Drama", "History"],
    synopsis: "Set in pre-colonial Yorùbáland, a powerful warlord takes a young warrior under his wing — only for the apprentice to discover the dark truth behind his mentor's legend. A spectacular Yorùbá epic.",
    tagline: null,
    runtime: "2h 06m",
    posterUrl: `${IMG}/uPZtE5DSo9VIX2N3NPtmTayhgP8.jpg`,
    trailerUrl: `${YT}InNrl2-tl58`,
    criticScore: 72,
  },
  {
    slug: "lisabi-the-uprising",
    title: "Lisabi: The Uprising",
    year: 2024,
    country: "NG",
    tmdbId: 1362418,
    imdbId: "tt33255000",
    genres: ["Action", "History", "Drama"],
    synopsis: "The story of Lisabi Agbongbo-Akala, the legendary Egba warrior who led a successful revolt against the oppressive Oyo Empire in the 18th century. A large-scale historical epic celebrating Yorùbá resistance.",
    tagline: null,
    runtime: "2h 05m",
    posterUrl: `${IMG}/p63pNkA43NUoQSVjoWJV6B4k8xC.jpg`,
    trailerUrl: `${YT}EyjesbX13vM`,
    criticScore: 74,
  },
];

async function main() {
  console.log("── Importing canonical Nollywood films ──────────────────────\n");
  let created = 0, skipped = 0;

  for (const f of FILMS) {
    const exists = await prisma.film.findFirst({
      where: { OR: [{ slug: f.slug }, ...(f.tmdbId ? [{ tmdbId: f.tmdbId }] : [])] },
    });
    if (exists) {
      console.log(`  ⏭  "${f.title}" — already exists as "${exists.slug}"`);
      skipped++;
      continue;
    }

    await prisma.film.create({
      data: {
        slug: f.slug,
        title: f.title,
        year: f.year,
        country: f.country,
        tmdbId: f.tmdbId,
        imdbId: f.imdbId,
        genres: f.genres,
        synopsis: f.synopsis,
        tagline: f.tagline ?? null,
        runtime: f.runtime,
        posterUrl: f.posterUrl,
        trailerUrl: f.trailerUrl,
        criticScore: f.criticScore,
        awards: [],
        boxLive: false,
        upcoming: false,
      },
    });
    console.log(`  ✓  "${f.title}" (${f.year})`);
    created++;
  }

  console.log(`\nDone. Created: ${created}  Skipped: ${skipped}`);
  const total = await prisma.film.count();
  console.log(`Total films in DB: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
