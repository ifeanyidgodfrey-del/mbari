/**
 * import-research-batch.ts
 * Imports 18 new films (Nigeria / South Africa / Kenya / Ghana, 2020–2024)
 * and enriches 2 existing films with additional nominations & crew credits.
 *
 * Run:  npx tsx prisma/import-research-batch.ts
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
  console.log("M'Bari — Research Batch Import (2020-2024)");

  // ── Language map ───────────────────────────────────────────────────────────
  const langs = await prisma.language.findMany();
  const lm: Record<string, string> = {};
  for (const l of langs) lm[l.code] = l.id;

  // Add Zulu if missing (needed for SA titles)
  if (!lm["zu"]) {
    const zu = await prisma.language.upsert({
      where: { code: "zu" },
      update: {},
      create: { code: "zu", name: "Zulu", native: "isiZulu" },
    });
    lm["zu"] = zu.id;
  }
  if (!lm["sw"]) {
    const sw = await prisma.language.upsert({
      where: { code: "sw" },
      update: {},
      create: { code: "sw", name: "Swahili", native: "Kiswahili" },
    });
    lm["sw"] = sw.id;
  }

  // ── Helper: upsert film ────────────────────────────────────────────────────
  type FilmData = Parameters<typeof prisma.film.upsert>[0]["create"];
  async function upsertFilm(data: FilmData) {
    return prisma.film.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  // ── Helper: add film language ──────────────────────────────────────────────
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

  // ── Helper: add availability ───────────────────────────────────────────────
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

  // ── Helper: upsert crew ────────────────────────────────────────────────────
  type CrewData = Parameters<typeof prisma.crewMember.upsert>[0]["create"];
  async function upsertCrew(data: CrewData) {
    return prisma.crewMember.upsert({
      where: { slug: data.slug },
      update: {},
      create: data,
    });
  }

  // ── Helper: add crew credit ────────────────────────────────────────────────
  async function addCredit(filmId: string, crewMemberId: string, role: string) {
    await prisma.crewCredit
      .upsert({
        where: { filmId_crewMemberId_role: { filmId, crewMemberId, role } },
        update: {},
        create: { filmId, crewMemberId, role },
      })
      .catch(() => {});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ENRICH EXISTING FILMS
  // ═══════════════════════════════════════════════════════════════════════════

  // The Black Book (2023) — add nominations + DOP credit
  const tbb = await prisma.film.findUnique({ where: { slug: "the-black-book" } });
  if (tbb) {
    await prisma.film.update({
      where: { id: tbb.id },
      data: {
        awards: [
          "AMVCA 2024: Best Picture (Nominated)",
          "AMVCA 2024: Best Director (Nominated)",
          "AMAA 2023: Outstanding Production Design",
        ],
      },
    });
    // Yinka Edward is already in the DB as "yinka-edward"
    const yinka = await prisma.crewMember.findUnique({ where: { slug: "yinka-edward" } });
    if (yinka) await addCredit(tbb.id, yinka.id, "Cinematographer");
    console.log("Enriched: The Black Book");
  }

  // A Tribe Called Judah (2023) — add nominations
  const atcj = await prisma.film.findUnique({ where: { slug: "a-tribe-called-judah" } });
  if (atcj) {
    await prisma.film.update({
      where: { id: atcj.id },
      data: {
        awards: [
          "AMVCA 2024: Best Film (Won)",
          "Africa Magic Best Actress 2024",
          "AMVCA 2024: Best Actress (Nominated)",
        ],
      },
    });
    console.log("Enriched: A Tribe Called Judah");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. NEW CREW MEMBERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Nigeria
  const kunle = await upsertCrew({
    slug: "kunle-afolayan",
    name: "Kunle Afolayan",
    type: "director",
    roles: ["Director", "Producer", "Actor"],
    bio: "Kunle Afolayan is one of Nigeria's most celebrated filmmakers, founder of Golden Effects Pictures. Known for October 1, The CEO, and Anikulapo — a landmark of contemporary Yorùbá fantasy cinema on Netflix.",
    awards: ["AMVCA Best Overall Movie 2023", "AMVCA Best Writer 2023"],
    available: false,
  });

  const biodun = await upsertCrew({
    slug: "biodun-stephen",
    name: "Biodun Stephen",
    type: "director",
    roles: ["Director", "Writer", "Producer"],
    bio: "Biodun Stephen is a Nigerian filmmaker celebrated for intimate domestic dramas. Her film Sista earned wide acclaim on Amazon Prime for its unflinching portrayal of modern Nigerian womanhood.",
    awards: ["AMVCA 2023: Best Writer"],
    available: false,
  });

  const bbsasore = await upsertCrew({
    slug: "bb-sasore",
    name: "BB Sasore",
    type: "director",
    roles: ["Director", "Writer"],
    bio: "BB Sasore is a Nigerian director whose debut feature God Calling was a sleeper hit. His historical drama Breath of Life swept the AMVCA 2024, winning Best Film, Best Director, and Best Actor.",
    awards: ["AMVCA 2024: Best Overall Movie", "AMVCA 2024: Best Director"],
    available: false,
  });

  const dimeji = await upsertCrew({
    slug: "dimeji-ajibola",
    name: "Dimeji Ajibola",
    type: "director",
    roles: ["Director"],
    bio: "Dimeji Ajibola is a Nigerian TV and film director known for the gritty Netflix series Shanty Town, which brought a sharp-eyed crime drama to global streaming audiences.",
    awards: [],
    available: false,
  });

  const bunmiA = await upsertCrew({
    slug: "bunmi-ajakaiye",
    name: "Bunmi Ajakaiye",
    type: "director",
    roles: ["Director", "Writer"],
    bio: "Bunmi Ajakaiye is a Nigerian writer and director known for her work on The Smart Money Woman and collaborations with Editi Effiong on The Black Book.",
    awards: [],
    available: false,
  });

  // Jade Osiberu already exists from update-content.ts — just fetch
  const jade = await prisma.crewMember.findUnique({ where: { slug: "jade-osiberu" } });

  // South Africa
  const nosipho = await upsertCrew({
    slug: "nosipho-dumisa",
    name: "Nosipho Dumisa",
    type: "director",
    roles: ["Director", "Writer"],
    bio: "Nosipho Dumisa is a South African filmmaker who created and directed Blood & Water for Netflix, introducing a generation to Cape Town's world of elite private schools and dark secrets.",
    awards: ["SAFTA 2021: Best TV Drama"],
    available: false,
  });

  const reaRangaka = await upsertCrew({
    slug: "rea-rangaka",
    name: "Rea Rangaka",
    type: "director",
    roles: ["Director"],
    bio: "Rea Rangaka is a South African director and actor who helmed Savage Beauty, Netflix's stylish revenge thriller set in the world of high fashion and family empire.",
    awards: ["SAFTA 2023: Best TV Drama"],
    available: false,
  });

  const mandlaDube = await upsertCrew({
    slug: "mandla-dube",
    name: "Mandla Dube",
    type: "director",
    roles: ["Director"],
    bio: "Mandla Dube is a South African filmmaker who directed the Netflix action thriller Heart of the Hunter, based on Deon Meyer's acclaimed novel.",
    awards: [],
    available: false,
  });

  const traceL = await upsertCrew({
    slug: "tracey-larcombe",
    name: "Tracey Larcombe",
    type: "director",
    roles: ["Director"],
    bio: "Tracey Larcombe is a South African director known for the true-crime Showmax series Catch Me A Killer, based on South Africa's first serial killer profiler.",
    awards: [],
    available: false,
  });

  const zeeNtuli = await upsertCrew({
    slug: "zee-ntuli",
    name: "Zee Ntuli",
    type: "director",
    roles: ["Director"],
    bio: "Zee Ntuli is a South African director who co-directed Reyka, an internationally award-nominated crime drama following South Africa's first criminal profiler in the KwaZulu-Natal sugar cane fields.",
    awards: ["SAFTA 2022: Best TV Drama"],
    available: false,
  });

  // Kenya
  const vincentMbaya = await upsertCrew({
    slug: "vincent-mbaya",
    name: "Vincent Mbaya",
    type: "director",
    roles: ["Director"],
    bio: "Vincent Mbaya is a Kenyan director who helmed Country Queen for Netflix, a drama about a Nairobi woman returning to her rural village to confront the past — and a mining company threatening her community.",
    awards: ["Kalasha Awards 2022: Best TV Drama"],
    available: false,
  });

  const davidGitonga = await upsertCrew({
    slug: "david-tosh-gitonga",
    name: "David 'Tosh' Gitonga",
    type: "director",
    roles: ["Director", "Producer"],
    bio: "David 'Tosh' Gitonga is one of Kenya's leading filmmakers, best known for Nairobi Half Life. His Netflix work includes Disconnect: The Wedding Planner and the music-industry series Volume.",
    awards: ["Kalasha 2023: Best Feature", "Kalasha 2024: Best Sound Design"],
    available: false,
  });

  // Ghana
  const peterSedufia = await upsertCrew({
    slug: "peter-sedufia",
    name: "Peter Sedufia",
    type: "director",
    roles: ["Director", "Writer", "Producer"],
    bio: "Peter Sedufia is a Ghanaian filmmaker whose debut feature Aloevera — a love story across a divided community — earned recognition at AMAA and established him as a distinctive voice in West African indie cinema.",
    awards: ["AMAA 2021: Best Film (Nominated)"],
    available: false,
  });

  const shirleyFM = await upsertCrew({
    slug: "shirley-frimpong-manso",
    name: "Shirley Frimpong-Manso",
    type: "director",
    roles: ["Director", "Writer", "Producer"],
    bio: "Shirley Frimpong-Manso is one of Ghana's most prolific filmmakers, director of The Perfect Picture franchise. Her drama series Struggle examines tradition and modern ambition in contemporary Ghana.",
    awards: ["Ghana Movie Awards: Best Directing"],
    available: false,
  });

  const kobbyM = await upsertCrew({
    slug: "kobby-maxwell",
    name: "Kobby Maxwell",
    type: "director",
    roles: ["Director", "Writer", "Producer"],
    bio: "Kobby Maxwell is an emerging Ghanaian indie filmmaker whose urban drama Tsutsu — about youth unemployment in Accra — went viral on YouTube and won at the Ghana Movie Awards.",
    awards: ["Ghana Movie Awards 2024: Best Web Film"],
    available: false,
  });

  console.log("All crew members upserted.");

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. NEW FILMS — NIGERIA
  // ═══════════════════════════════════════════════════════════════════════════

  // Anikulapo (2022)
  const anikulapo = await upsertFilm({
    slug: "anikulapo",
    title: "Anikulapo",
    year: 2022,
    runtime: "2h 03m",
    country: "NG",
    genres: ["Fantasy", "Drama", "Historical"],
    tagline: "Death cannot hold what the gods have touched.",
    posterUrl: null,
    synopsis:
      "After an affair with a queen leads to his execution, an ambitious young weaver is resurrected by a mystical bird that grants him supernatural power over death. Kunle Afolayan's sweeping Yorùbá fantasy swept the AMVCAs in 2023.",
    criticScore: 88,
    audienceScore: 92,
    verifiedScore: 89,
    heatScore: 85,
    criticCount: 44,
    audienceCount: 31000,
    verifiedCount: 8400,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMVCA 2023: Best Overall Movie (Won)",
      "AMVCA 2023: Best Writer (Won)",
      "AMVCA 2023: Best Director (Nominated)",
    ],
  });

  // Omo Ghetto: The Saga (2020)
  const omoGhetto = await upsertFilm({
    slug: "omo-ghetto-the-saga",
    title: "Omo Ghetto: The Saga",
    year: 2020,
    runtime: "2h 05m",
    country: "NG",
    genres: ["Action", "Comedy", "Crime"],
    tagline: "Same streets. Different worlds.",
    posterUrl: null,
    synopsis:
      "A good-hearted Lagos street queen and her affluent, well-mannered twin sister are reunited by fate — and must team up to take on a crime ring threatening their community. Funke Akindele's crowd-pleasing sequel broke its predecessor's record at the Nigerian box office.",
    criticScore: 65,
    audienceScore: 88,
    verifiedScore: 79,
    heatScore: 82,
    criticCount: 22,
    audienceCount: 19000,
    verifiedCount: 4200,
    boxWeekend: null,
    boxCumulative: BigInt("800000000"),
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMVCA 2022: Best Overall Movie (Nominated)",
      "AMVCA 2022: Best Costume Design",
    ],
  });

  // The Smart Money Woman (2020)
  const smw = await upsertFilm({
    slug: "the-smart-money-woman",
    title: "The Smart Money Woman",
    year: 2020,
    runtime: "1h 00m",
    country: "NG",
    genres: ["Drama", "Romance"],
    tagline: "Money, love, and everything in between.",
    posterUrl: null,
    synopsis:
      "Based on Arese Ugwu's bestselling novel, this Netflix series follows five successful Nigerian women navigating friendship, ambition, finance, and romance in Lagos. A pioneering moment for African streaming storytelling.",
    criticScore: 67,
    audienceScore: 84,
    verifiedScore: 76,
    heatScore: 71,
    criticCount: 19,
    audienceCount: 22000,
    verifiedCount: 5100,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: ["AMVCA 2022: Best TV Series"],
  });

  // Sista (2022)
  const sista = await upsertFilm({
    slug: "sista",
    title: "Sista",
    year: 2022,
    runtime: "1h 45m",
    country: "NG",
    genres: ["Drama"],
    tagline: "Some stories are never fully told.",
    posterUrl: null,
    synopsis:
      "A struggling single mother's carefully constructed life is thrown into crisis when her children's absent father resurfaces, demanding a place in their world. Biodun Stephen's intimate drama earned wide acclaim on Amazon Prime.",
    criticScore: 71,
    audienceScore: 83,
    verifiedScore: 77,
    heatScore: 68,
    criticCount: 25,
    audienceCount: 14000,
    verifiedCount: 3200,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMVCA 2023: Best Writer",
      "AMVCA 2023: Best Actress in Drama",
    ],
  });

  // Shanty Town (2023)
  const shantyTown = await upsertFilm({
    slug: "shanty-town",
    title: "Shanty Town",
    year: 2023,
    runtime: "0h 55m",
    country: "NG",
    genres: ["Crime", "Thriller"],
    tagline: "Freedom has a price. So does silence.",
    posterUrl: null,
    synopsis:
      "A group of courtesans in Lagos attempt to escape the grip of a notorious crime boss, but are ensnared in a web of political corruption and violent retribution. Dimeji Ajibola's Netflix series brought Nigerian crime drama to a global audience.",
    criticScore: 73,
    audienceScore: 86,
    verifiedScore: 80,
    heatScore: 79,
    criticCount: 28,
    audienceCount: 37000,
    verifiedCount: 9100,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMVCA 2023: Best Cinematographer",
      "AMVCA 2023: Best Actor",
      "AMVCA 2023: Best Actress",
    ],
  });

  // Gangs of Lagos (2023)
  const gangsOfLagos = await upsertFilm({
    slug: "gangs-of-lagos",
    title: "Gangs of Lagos",
    year: 2023,
    runtime: "1h 58m",
    country: "NG",
    genres: ["Crime", "Drama", "Action"],
    tagline: "Lagos made them. Lagos will break them.",
    posterUrl: null,
    synopsis:
      "A group of childhood friends raised on the dangerous streets of Isale Eko each must navigate their own destiny — loyalty, survival, and the cost of leaving the world that made them. Jade Osiberu's Amazon Original brought Nollywood's biggest names to global streaming.",
    criticScore: 76,
    audienceScore: 90,
    verifiedScore: 84,
    heatScore: 88,
    criticCount: 32,
    audienceCount: 45000,
    verifiedCount: 11000,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMAA 2023: Best Visual Effects",
      "AMVCA 2024: Best Picture (Nominated)",
    ],
  });

  // Breath of Life (2023)
  const breathOfLife = await upsertFilm({
    slug: "breath-of-life",
    title: "Breath of Life",
    year: 2023,
    runtime: "2h 05m",
    country: "NG",
    genres: ["Drama", "Historical"],
    tagline: "Even the broken can carry light.",
    posterUrl: null,
    synopsis:
      "Set in 1950s Nigeria, a cynical and broken former clergyman hires a bright-eyed houseboy whose unshakeable spirit rekindles his lost faith. BB Sasore's period drama swept the AMVCAs 2024 with three major wins.",
    criticScore: 84,
    audienceScore: 90,
    verifiedScore: 88,
    heatScore: 82,
    criticCount: 37,
    audienceCount: 27000,
    verifiedCount: 6800,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMVCA 2024: Best Overall Movie (Won)",
      "AMVCA 2024: Best Director (Won)",
      "AMVCA 2024: Best Lead Actor (Won)",
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. NEW FILMS — SOUTH AFRICA
  // ═══════════════════════════════════════════════════════════════════════════

  // Blood & Water (2020)
  const bloodAndWater = await upsertFilm({
    slug: "blood-and-water",
    title: "Blood & Water",
    year: 2020,
    runtime: "0h 52m",
    country: "ZA",
    genres: ["Drama", "Mystery", "Thriller"],
    tagline: "Some secrets run deeper than blood.",
    posterUrl: null,
    synopsis:
      "A Cape Town teenager sets out to prove whether a glamorous private-school swimmer is her sister who was abducted at birth, uncovering a shocking conspiracy beneath the surface of elite society. Netflix Africa's breakout series.",
    criticScore: 71,
    audienceScore: 82,
    verifiedScore: 76,
    heatScore: 80,
    criticCount: 29,
    audienceCount: 41000,
    verifiedCount: 9800,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "SAFTA 2021: Best TV Drama",
      "SAFTA 2021: Best Cinematography",
      "Seoul International Drama Awards: Best Series",
    ],
  });

  // Reyka (2021)
  const reyka = await upsertFilm({
    slug: "reyka",
    title: "Reyka",
    year: 2021,
    runtime: "0h 55m",
    country: "ZA",
    genres: ["Crime", "Drama", "Thriller"],
    tagline: "She's seen inside the darkest minds. It's left a mark.",
    posterUrl: null,
    synopsis:
      "Flawed but brilliant criminal profiler Reyka Gama investigates a serial killer in the sugar cane fields of KwaZulu-Natal — confronting her own traumatic past as she closes in on the truth. An International Emmy nominee.",
    criticScore: 82,
    audienceScore: 88,
    verifiedScore: 85,
    heatScore: 74,
    criticCount: 33,
    audienceCount: 16000,
    verifiedCount: 3900,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "International Emmy 2022: Best Drama (Nominated)",
      "SAFTA 2022: Best TV Drama (Won)",
    ],
  });

  // Savage Beauty (2022)
  const savageBeauty = await upsertFilm({
    slug: "savage-beauty",
    title: "Savage Beauty",
    year: 2022,
    runtime: "0h 50m",
    country: "ZA",
    genres: ["Drama", "Thriller", "Mystery"],
    tagline: "She came for revenge. She stayed for the throne.",
    posterUrl: null,
    synopsis:
      "A mysterious woman embeds herself in a powerful family that runs a global beauty empire, seeking revenge for the dark secrets of her past. Rea Rangaka's Netflix thriller is a sleek, addictive story of glamour and retribution.",
    criticScore: 74,
    audienceScore: 85,
    verifiedScore: 80,
    heatScore: 77,
    criticCount: 24,
    audienceCount: 28000,
    verifiedCount: 6100,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "SAFTA 2023: Best TV Drama",
      "SAFTA 2023: Best Lead Actress",
    ],
  });

  // Catch Me A Killer (2024)
  const catchMeAKiller = await upsertFilm({
    slug: "catch-me-a-killer",
    title: "Catch Me A Killer",
    year: 2024,
    runtime: "0h 55m",
    country: "ZA",
    genres: ["Crime", "Drama", "Biographical"],
    tagline: "She profiled killers before anyone knew what that meant.",
    posterUrl: null,
    synopsis:
      "Based on the extraordinary true story of Micki Pistorius, South Africa's first serial killer profiler. In the 1990s, a determined young criminologist navigates a sceptical police force to hunt a predator terrorising the country.",
    criticScore: 75,
    audienceScore: 84,
    verifiedScore: 80,
    heatScore: 71,
    criticCount: 21,
    audienceCount: 12000,
    verifiedCount: 2800,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: ["Content Innovation Awards: Best True Crime"],
  });

  // Heart of the Hunter (2024)
  const heartOfTheHunter = await upsertFilm({
    slug: "heart-of-the-hunter",
    title: "Heart of the Hunter",
    year: 2024,
    runtime: "1h 43m",
    country: "ZA",
    genres: ["Action", "Thriller", "Crime"],
    tagline: "Retirement was never really an option.",
    posterUrl: null,
    synopsis:
      "A retired South African special forces operative is pulled back into the deadly world he left behind when his closest friend stumbles upon a conspiracy that reaches the heart of the country's government. Based on Deon Meyer's acclaimed novel.",
    criticScore: 68,
    audienceScore: 80,
    verifiedScore: 74,
    heatScore: 73,
    criticCount: 18,
    audienceCount: 23000,
    verifiedCount: 5300,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. NEW FILMS — KENYA
  // ═══════════════════════════════════════════════════════════════════════════

  // Country Queen (2022)
  const countryQueen = await upsertFilm({
    slug: "country-queen",
    title: "Country Queen",
    year: 2022,
    runtime: "0h 50m",
    country: "KE",
    genres: ["Drama"],
    tagline: "The city makes you. The village unmakes you.",
    posterUrl: null,
    synopsis:
      "A Nairobi event planner returns to her rural village after a decade away, confronting her unresolved past and a multinational mining company threatening her people's land. A landmark Netflix Kenya original.",
    criticScore: 72,
    audienceScore: 81,
    verifiedScore: 76,
    heatScore: 68,
    criticCount: 22,
    audienceCount: 14000,
    verifiedCount: 3100,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "Kalasha Awards 2022: Best TV Drama",
      "Kalasha Awards 2022: Best Lead Actress",
    ],
  });

  // Disconnect: The Wedding Planner (2023)
  const disconnect = await upsertFilm({
    slug: "disconnect-the-wedding-planner",
    title: "Disconnect: The Wedding Planner",
    year: 2023,
    runtime: "1h 38m",
    country: "KE",
    genres: ["Comedy", "Drama", "Romance"],
    tagline: "The perfect wedding. Nothing could go wrong.",
    posterUrl: null,
    synopsis:
      "After falling victim to a devastating scam, a resourceful man races against the clock to plan a lavish destination wedding — and discovers that improvisation is the only skill that matters. A fun-filled Netflix Kenya original.",
    criticScore: 70,
    audienceScore: 83,
    verifiedScore: 76,
    heatScore: 66,
    criticCount: 16,
    audienceCount: 11000,
    verifiedCount: 2400,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "Kalasha 2023: Best Feature",
      "Kalasha 2023: Best Director",
    ],
  });

  // Volume (2023)
  const volume = await upsertFilm({
    slug: "volume",
    title: "Volume",
    year: 2023,
    runtime: "0h 48m",
    country: "KE",
    genres: ["Drama", "Music"],
    tagline: "The music industry doesn't care about your talent.",
    posterUrl: null,
    synopsis:
      "A gifted young musician in Nairobi navigates the dangerous, seductive underbelly of the music industry — discovering that the cost of fame is far higher than any record deal. David 'Tosh' Gitonga's Netflix series.",
    criticScore: 68,
    audienceScore: 79,
    verifiedScore: 73,
    heatScore: 62,
    criticCount: 14,
    audienceCount: 9000,
    verifiedCount: 1900,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "Kalasha 2024: Best Sound Design",
      "Kalasha 2024: Best Lead Actor",
    ],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. NEW FILMS — GHANA
  // ═══════════════════════════════════════════════════════════════════════════

  // Aloevera (2020)
  const aloevera = await upsertFilm({
    slug: "aloevera",
    title: "Aloevera",
    year: 2020,
    runtime: "1h 35m",
    country: "GH",
    genres: ["Drama", "Romance"],
    tagline: "Love grows in the unlikeliest places.",
    posterUrl: null,
    synopsis:
      "In a community divided by an ancient feud, two young people from opposite sides fall quietly, irrevocably in love — challenging the deep-rooted animosity that has kept their families apart. Peter Sedufia's gentle debut earned recognition at AMAA.",
    criticScore: 75,
    audienceScore: 80,
    verifiedScore: 77,
    heatScore: 59,
    criticCount: 18,
    audienceCount: 6000,
    verifiedCount: 1200,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: [
      "AMAA 2021: Best Film (Nominated)",
      "AMAA 2021: Best Production Design",
    ],
  });

  // Struggle (2023)
  const struggle = await upsertFilm({
    slug: "struggle",
    title: "Struggle",
    year: 2023,
    runtime: "0h 45m",
    country: "GH",
    genres: ["Drama"],
    tagline: "Between tradition and ambition, there is no easy road.",
    posterUrl: null,
    synopsis:
      "An intricate drama tracking the lives of four Ghanaian professionals juggling modern ambitions, traditional expectations, and the relentless pressures of contemporary Accra. Shirley Frimpong-Manso at her most observant.",
    criticScore: 63,
    audienceScore: 74,
    verifiedScore: 68,
    heatScore: 52,
    criticCount: 11,
    audienceCount: 4800,
    verifiedCount: 900,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: ["Ghana Movie Awards 2023: Best Directing"],
  });

  // Tsutsu (2024)
  const tsutsu = await upsertFilm({
    slug: "tsutsu",
    title: "Tsutsu",
    year: 2024,
    runtime: "1h 22m",
    country: "GH",
    genres: ["Drama", "Crime"],
    tagline: "Accra doesn't forgive idle hands.",
    posterUrl: null,
    synopsis:
      "A gritty, visceral indie production tracing the daily hustle of young men in modern Accra trapped by unemployment and circumstance. Kobby Maxwell's raw debut went viral on YouTube and won the Ghana Movie Awards.",
    criticScore: 60,
    audienceScore: 77,
    verifiedScore: 68,
    heatScore: 61,
    criticCount: 9,
    audienceCount: 7200,
    verifiedCount: 1100,
    boxWeekend: null,
    boxCumulative: null,
    boxWeek: null,
    boxLive: false,
    awards: ["Ghana Movie Awards 2024: Best Web Film"],
  });

  console.log("All films upserted.");

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. LANGUAGES
  // ═══════════════════════════════════════════════════════════════════════════
  const filmLangs: [string, string, number][] = [
    // Nigeria
    [anikulapo.id, "yo", 80],  [anikulapo.id, "en", 20],
    [omoGhetto.id, "yo", 55],  [omoGhetto.id, "en", 30],  [omoGhetto.id, "pcm", 15],
    [smw.id, "en", 75],        [smw.id, "yo", 15],         [smw.id, "pcm", 10],
    [sista.id, "en", 70],      [sista.id, "yo", 20],       [sista.id, "pcm", 10],
    [shantyTown.id, "pcm", 50],[shantyTown.id, "en", 35],  [shantyTown.id, "yo", 15],
    [gangsOfLagos.id, "yo", 50],[gangsOfLagos.id, "en", 30],[gangsOfLagos.id, "pcm", 20],
    [breathOfLife.id, "en", 60],[breathOfLife.id, "yo", 30],[breathOfLife.id, "pcm", 10],
    // South Africa
    [bloodAndWater.id, "en", 90], [bloodAndWater.id, "zu", 10],
    [reyka.id, "en", 100],
    [savageBeauty.id, "en", 90],  [savageBeauty.id, "zu", 10],
    [catchMeAKiller.id, "en", 100],
    [heartOfTheHunter.id, "en", 100],
    // Kenya
    [countryQueen.id, "en", 70],  [countryQueen.id, "sw", 30],
    [disconnect.id, "en", 85],    [disconnect.id, "sw", 15],
    [volume.id, "en", 75],        [volume.id, "sw", 25],
    // Ghana
    [aloevera.id, "en", 100],
    [struggle.id, "en", 100],
    [tsutsu.id, "en", 80],
  ];

  for (const [filmId, code, pct] of filmLangs) {
    await addLang(filmId, code, pct);
  }
  console.log("Languages linked.");

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. CREW CREDITS
  // ═══════════════════════════════════════════════════════════════════════════
  const credits: [string, string, string][] = [
    // Nigeria
    [anikulapo.id, kunle.id, "Director"],
    [anikulapo.id, kunle.id, "Producer"],
    [omoGhetto.id, "funke-akindele", "Director"],   // slug ref — resolved below
    [omoGhetto.id, "funke-akindele", "Producer"],
    [smw.id, bunmiA.id, "Director"],
    [sista.id, biodun.id, "Director"],
    [sista.id, biodun.id, "Writer"],
    [shantyTown.id, dimeji.id, "Director"],
    [breathOfLife.id, bbsasore.id, "Director"],
    [breathOfLife.id, bbsasore.id, "Writer"],
    // South Africa
    [bloodAndWater.id, nosipho.id, "Director"],
    [bloodAndWater.id, nosipho.id, "Writer"],
    [reyka.id, zeeNtuli.id, "Director"],
    [savageBeauty.id, reaRangaka.id, "Director"],
    [catchMeAKiller.id, traceL.id, "Director"],
    [heartOfTheHunter.id, mandlaDube.id, "Director"],
    // Kenya
    [countryQueen.id, vincentMbaya.id, "Director"],
    [disconnect.id, davidGitonga.id, "Director"],
    [disconnect.id, davidGitonga.id, "Producer"],
    [volume.id, davidGitonga.id, "Director"],
    // Ghana
    [aloevera.id, peterSedufia.id, "Director"],
    [aloevera.id, peterSedufia.id, "Writer"],
    [aloevera.id, peterSedufia.id, "Producer"],
    [struggle.id, shirleyFM.id, "Director"],
    [struggle.id, shirleyFM.id, "Writer"],
    [tsutsu.id, kobbyM.id, "Director"],
    [tsutsu.id, kobbyM.id, "Writer"],
  ];

  // Jade Osiberu — Gangs of Lagos
  if (jade) {
    await addCredit(gangsOfLagos.id, jade.id, "Director");
    await addCredit(gangsOfLagos.id, jade.id, "Producer");
  }

  // Resolve slug-based crew refs
  const funke = await prisma.crewMember.findUnique({ where: { slug: "funke-akindele" } });

  for (const [filmId, crewIdOrSlug, role] of credits) {
    // Skip slug refs (handled separately)
    if (crewIdOrSlug === "funke-akindele") continue;
    await addCredit(filmId, crewIdOrSlug, role);
  }

  // Funke Akindele — Omo Ghetto
  if (funke) {
    await addCredit(omoGhetto.id, funke.id, "Director");
    await addCredit(omoGhetto.id, funke.id, "Producer");
  }

  console.log("Crew credits linked.");

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════
  const avails: [string, string, string, string][] = [
    // Nigeria — Netflix/Amazon
    [anikulapo.id, "NG", "Netflix", "svod"],
    [anikulapo.id, "GH", "Netflix", "svod"],
    [anikulapo.id, "ZA", "Netflix", "svod"],
    [anikulapo.id, "US", "Netflix", "svod"],
    [anikulapo.id, "GB", "Netflix", "svod"],
    [omoGhetto.id, "NG", "Prime Video", "svod"],
    [omoGhetto.id, "GH", "Prime Video", "svod"],
    [omoGhetto.id, "US", "Prime Video", "svod"],
    [smw.id, "NG", "Netflix", "svod"],
    [smw.id, "GH", "Netflix", "svod"],
    [smw.id, "ZA", "Netflix", "svod"],
    [smw.id, "US", "Netflix", "svod"],
    [sista.id, "NG", "Prime Video", "svod"],
    [sista.id, "GH", "Prime Video", "svod"],
    [sista.id, "US", "Prime Video", "svod"],
    [shantyTown.id, "NG", "Netflix", "svod"],
    [shantyTown.id, "GH", "Netflix", "svod"],
    [shantyTown.id, "ZA", "Netflix", "svod"],
    [shantyTown.id, "US", "Netflix", "svod"],
    [gangsOfLagos.id, "NG", "Prime Video", "svod"],
    [gangsOfLagos.id, "GH", "Prime Video", "svod"],
    [gangsOfLagos.id, "ZA", "Prime Video", "svod"],
    [gangsOfLagos.id, "US", "Prime Video", "svod"],
    [gangsOfLagos.id, "GB", "Prime Video", "svod"],
    [breathOfLife.id, "NG", "Prime Video", "svod"],
    [breathOfLife.id, "GH", "Prime Video", "svod"],
    [breathOfLife.id, "US", "Prime Video", "svod"],
    // South Africa
    [bloodAndWater.id, "ZA", "Netflix", "svod"],
    [bloodAndWater.id, "NG", "Netflix", "svod"],
    [bloodAndWater.id, "US", "Netflix", "svod"],
    [reyka.id, "ZA", "BritBox", "svod"],
    [reyka.id, "GB", "BritBox", "svod"],
    [reyka.id, "US", "BritBox", "svod"],
    [savageBeauty.id, "ZA", "Netflix", "svod"],
    [savageBeauty.id, "NG", "Netflix", "svod"],
    [savageBeauty.id, "US", "Netflix", "svod"],
    [catchMeAKiller.id, "ZA", "Showmax", "svod"],
    [catchMeAKiller.id, "NG", "Showmax", "svod"],
    [heartOfTheHunter.id, "ZA", "Netflix", "svod"],
    [heartOfTheHunter.id, "NG", "Netflix", "svod"],
    [heartOfTheHunter.id, "US", "Netflix", "svod"],
    // Kenya
    [countryQueen.id, "KE", "Netflix", "svod"],
    [countryQueen.id, "NG", "Netflix", "svod"],
    [countryQueen.id, "US", "Netflix", "svod"],
    [disconnect.id, "KE", "Netflix", "svod"],
    [disconnect.id, "NG", "Netflix", "svod"],
    [disconnect.id, "US", "Netflix", "svod"],
    [volume.id, "KE", "Netflix", "svod"],
    [volume.id, "NG", "Netflix", "svod"],
    [volume.id, "US", "Netflix", "svod"],
    // Ghana
    [aloevera.id, "GH", "Prime Video", "svod"],
    [aloevera.id, "US", "Prime Video", "svod"],
    [struggle.id, "GH", "YouTube", "free"],
    [tsutsu.id, "GH", "YouTube", "free"],
    [tsutsu.id, "NG", "YouTube", "free"],
  ];

  for (const [filmId, countryCode, platform, accessType] of avails) {
    await addAvail(filmId, countryCode, platform, accessType);
  }

  console.log("Availability records linked.");
  console.log("\nBatch import complete — 18 new films, 15 new crew members.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
