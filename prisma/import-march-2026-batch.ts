/**
 * import-march-2026-batch.ts
 * Imports 17 new films across Ethiopia, Egypt, South Africa, and Nigeria (2024–2026).
 * Skips: La Borena 2026 (no data), Mikniyat (no data), Kirtina (no data)
 *
 * Run:  npx tsx prisma/import-march-2026-batch.ts
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
  console.log("M'Bari — March 2026 Batch Import (ET / EG / ZA / NG)");

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

  await ensureLang("am", "Amharic", "አማርኛ");
  await ensureLang("sid", "Sidama", "Sidaamu Afoo");
  await ensureLang("ar", "Arabic", "العربية");
  await ensureLang("af", "Afrikaans", "Afrikaans");
  await ensureLang("zu", "Zulu", "isiZulu");
  await ensureLang("ig", "Igbo", "Asụsụ Igbo");
  await ensureLang("yo", "Yorùbá", "Èdè Yorùbá");
  await ensureLang("pcm", "Pidgin", "Naijá");

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
  // ETHIOPIA
  // ═══════════════════════════════════════════════════════════════════════════

  // Affini (2024)
  const affini = await upsertFilm({
    slug: "affini",
    title: "Affini",
    year: 2024,
    runtime: "1h 42m",
    country: "ET",
    genres: ["Drama"],
    tagline: "A quest for justice. A tradition of peace.",
    synopsis:
      "Set in a tight-knit Sidama community in Southern Ethiopia, grieving farmer Digo Fasi is consumed by a quest for justice after his son's murder — until the traditional Sidama reconciliation system (Affini) intervenes. His path is further complicated when he finds himself drawn to a free-spirited American anthropology student whose modern ideals seem worlds apart from his own.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "1st Film Festival Malta 2024: Opening Film",
      "5th Ethiopian Film Festival London",
      "New African Film Festival (NAFF) 2025: First Ethiopian film screened twice",
    ],
    tmdbId: 1317534,
  });

  // Black Lions – Roman Wolves (2026)
  const blackLions = await upsertFilm({
    slug: "black-lions-roman-wolves",
    title: "Black Lions – Roman Wolves",
    year: 2026,
    runtime: "8h 51m",
    country: "ET",
    genres: ["Documentary", "History"],
    tagline: "Thirty years in the making. One people's defiance.",
    synopsis:
      "Haile Gerima's monumental 5-part documentary weaves archival footage from Italian, British, Russian, German, and French colonial archives with contemporary eyewitness interviews to chronicle Ethiopia's resistance during the Second Italo-Ethiopian War (1935–1941). A spiritual sequel to Adwa: An African Victory, the film took 30 years to complete and premiered at the Berlinale Forum in February 2026.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "Berlinale Forum 2026: World Premiere",
      "Berlinale Camera 2026: Haile Gerima (Career Achievement)",
    ],
    imdbId: "tt39369854",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EGYPT
  // ═══════════════════════════════════════════════════════════════════════════

  // The Stories (2025)
  const theStories = await upsertFilm({
    slug: "the-stories",
    title: "The Stories",
    year: 2025,
    runtime: null,
    country: "EG",
    genres: ["Drama"],
    tagline: "A family. A century. Five stories.",
    synopsis:
      "Inspired by director Abu Bakr Shawky's own family history, the film follows Ahmed, an aspiring pianist in 1967 Cairo, whose pen-pal correspondence with a young Austrian woman named Liz spans decades and continents. Mixing archival footage of political speeches, football matches, and radio transmissions with acted scenes, the film paints a sweeping cross-cultural portrait of Egyptian life from the late 1960s to the 1980s.",
    posterUrl: null,
    criticScore: 88,
    audienceScore: 87,
    verifiedScore: 88,
    heatScore: 79,
    criticCount: 24,
    audienceCount: 3100,
    verifiedCount: 820,
    boxLive: false,
    awards: [
      "Mons International Love Film Festival 2026: Grand Prix (Best Film)",
      "Carthage Film Festival: Golden Tanit for Best Film",
      "Tallinn Black Nights Film Festival: Grand Prix for Best Film",
      "Tallinn Black Nights Film Festival: Best Director",
    ],
    imdbId: "tt37679242",
  });

  // Egy Best (2026)
  const egyBest = await upsertFilm({
    slug: "egy-best",
    title: "Egy Best",
    year: 2026,
    runtime: null,
    country: "EG",
    genres: ["Comedy", "Thriller"],
    tagline: "Two friends. One piracy empire. No regrets.",
    synopsis:
      "Inspired by true events, the film chronicles two childhood friends from Cairo's El-Marg district who discover a passion for cinema and found EgyBest — which becomes the Arab world's largest hub for pirated films. A meta-comedy about digital rebellion, passion, and the thin line between fan and criminal.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: true,
    awards: [],
    imdbId: "tt39817594",
  });

  // Gawaza Wla Ganaza (2026)
  const gawaza = await upsertFilm({
    slug: "gawaza-wla-ganaza",
    title: "Gawaza Wla Ganaza",
    year: 2026,
    runtime: "1h 35m",
    country: "EG",
    genres: ["Comedy", "Drama"],
    tagline: "One wedding. One funeral. Total chaos.",
    synopsis:
      "A couple's dream wedding is derailed when a death throws their seven-day rehearsal into disarray. Two very different families are forced together, and their clashing personalities ignite a chain of comedic and dramatic mishaps. The directorial debut of Amira Adeeb, and a reunion of the beloved Nelly Karim–Sherif Salama pairing.",
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
    imdbId: "tt38179558",
  });

  // Al-Sada Al-Afadel (2025)
  const alsada = await upsertFilm({
    slug: "al-sada-al-afadel",
    title: "Al-Sada Al-Afadel",
    year: 2025,
    runtime: "2h 12m",
    country: "EG",
    genres: ["Comedy", "Drama"],
    tagline: "Honour your family. Survive the chaos.",
    synopsis:
      "After their father's death leaves the Abu Al-Fadl family drowning in debt, brothers Tarek and Hejazi scramble to fix things — but the arrival of the mysterious Samir Italia, who demands a large sum of money, turns their efforts into a cascading farce. Set over roughly 24 hours in an unnamed Egyptian village, the film blends sharp social observation with broad comedy.",
    posterUrl: null,
    criticScore: 75,
    audienceScore: 75,
    verifiedScore: 75,
    heatScore: 68,
    criticCount: 18,
    audienceCount: 8400,
    verifiedCount: 1200,
    boxLive: false,
    awards: ["El Gouna Film Festival 2025: Special Screening"],
    imdbId: "tt38731975",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH AFRICA
  // ═══════════════════════════════════════════════════════════════════════════

  // The Fix (2024)
  const theFix = await upsertFilm({
    slug: "the-fix",
    title: "The Fix",
    year: 2024,
    runtime: "1h 38m",
    country: "ZA",
    genres: ["Sci-Fi", "Thriller", "Horror"],
    tagline: "One dose. One mutation. One last chance.",
    synopsis:
      "In a dystopian future where Earth's toxic atmosphere forces people to wear breathing masks, popular model Ella takes a mysterious designer drug at a party and undergoes a shocking transformation. Pursued by forces with competing interests in the drug's effects, she discovers that her mutations may hold the key to saving the human race.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "SAFTA 2026: 11 Nominations including Best Feature Film and Best Director",
      "Chattanooga Film Festival: Dangerous Visions Award",
      "MIPAfrica: Opening Night Film",
    ],
    tmdbId: 931940,
  });

  // Old Righteous Blues (2024)
  const oldRighteous = await upsertFilm({
    slug: "old-righteous-blues",
    title: "Old Righteous Blues",
    year: 2024,
    runtime: "1h 39m",
    country: "ZA",
    genres: ["Drama"],
    tagline: "One choir. Two halves. One chance at glory.",
    synopsis:
      "Young Hantjie Jansen must confront the long-standing consequences of a bitter feud started by his father two decades earlier, which split his Western Cape community's Christmas choir in two. To realise his dream of becoming drum major, he must face the ghosts of the past and unite a fractured community. Directed in Afrikaans by Muneera Sallies.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "Silwerskerm Film Festival 2023: 11 Awards including Best Production Design and Best Music Score",
      "Romford Film Festival 2024: Best Actor (Ayden Croy)",
      "Panther City Film Festival 2024: Best Leading Performance (Ayden Croy)",
      "97th Academy Awards: South Africa's Official International Feature Film Submission",
    ],
    imdbId: "tt27541450",
  });

  // David (2025)
  const david = await upsertFilm({
    slug: "david-2025",
    title: "David",
    year: 2025,
    runtime: "1h 49m",
    country: "ZA",
    genres: ["Animation", "Musical", "Adventure"],
    tagline: "A shepherd. A giant. An unshakeable faith.",
    synopsis:
      "An animated musical epic following the biblical King David from his humble beginnings as a shepherd in Bethlehem through his legendary clash with the giant Goliath and his journey to the throne of Israel. Produced by Sunrise Animation Studios in Cape Town in partnership with Angel Studios.",
    posterUrl: null,
    criticScore: 72,
    audienceScore: 98,
    verifiedScore: 85,
    heatScore: 88,
    criticCount: 42,
    audienceCount: 91000,
    verifiedCount: 14200,
    boxWeekend: BigInt("22000000"),
    boxCumulative: BigInt("84700000"),
    boxLive: false,
    awards: [],
    tmdbId: 1167307,
  });

  // Spinners Season 2 (2026)
  const spinners = await upsertFilm({
    slug: "spinners-s2",
    title: "Spinners",
    year: 2026,
    runtime: "54m",
    country: "ZA",
    genres: ["Drama", "Crime", "Sport"],
    tagline: "The streets never let go.",
    synopsis:
      "Two years after Ethan and his friends escaped gang life to become spinning stars, a brutal ambush orchestrated by Ethan's old gang shatters their peace. Now caught between two rival crime families, Ethan must navigate the most dangerous territory of his life. Season 2 of the first African series selected in competition at Canneseries.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "Canneseries: First African series selected in competition",
      "Dakar Series: Best TV Series",
      "Dakar Series: Best Performance (Cantona James)",
      "Dakar Series: Best Editing",
      "Shanghai TV Festival Magnolia Awards: Best Foreign TV Series",
    ],
  });

  // Reyka Season 2 (2024)
  const reyka = await upsertFilm({
    slug: "reyka-s2",
    title: "Reyka",
    year: 2024,
    runtime: "51m",
    country: "ZA",
    genres: ["Drama", "Crime", "Thriller"],
    tagline: "The past never stays buried.",
    synopsis:
      "Criminal profiler Reyka Gama investigates a series of attacks on couples at the docks of Durban Harbour — Africa's largest port — while her complex relationship with her childhood abductor continues to haunt her. The most-nominated drama at the 2026 SAFTAs, starring Kim Engelbrecht and Iain Glen.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "SAFTA 2026: 9 Golden Horn Nominations including Best TV Drama",
      "International Emmy: Best Drama Nomination",
      "International Emmy: Best Performance by an Actress Nomination (Kim Engelbrecht)",
      "Monte-Carlo Television Festival: Opening Series",
    ],
    imdbId: "tt10163204",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NIGERIA
  // ═══════════════════════════════════════════════════════════════════════════

  // Mother's Love (2026)
  const mothersLove = await upsertFilm({
    slug: "mothers-love",
    title: "Mother's Love",
    year: 2026,
    runtime: "1h 42m",
    country: "NG",
    genres: ["Drama", "Thriller"],
    tagline: "Home is where the truth lives.",
    synopsis:
      "A young woman from a sheltered, affluent background undergoes a transformative journey of self-discovery during her NYSC year. Far from her family's wealth and protection, an unexpected bond with Obaro — a resident of the vibrant Makoko waterfront community — pulls her into conflict with her father's rigid expectations and hidden family secrets. The directorial debut of screen legend Omotola Jalade-Ekeinde.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: [
      "TIFF 2025: Official Selection",
      "Pan African Film Festival (PAFF): Screened",
      "Silicon Valley Africa Film Festival: Screened",
    ],
    imdbId: "tt37658528",
  });

  // Onobiren: A Woman's Story (2026)
  const onobiren = await upsertFilm({
    slug: "onobiren-a-womans-story",
    title: "Onobiren: A Woman's Story",
    year: 2026,
    runtime: null,
    country: "NG",
    genres: ["Drama"],
    tagline: "She was born to the shallows. She chose the deep.",
    synopsis:
      "Roli, a young woman from the Itsekiri riverine communities of Warri, Delta State, grows up under traditional fishing practices that restrict women to shallower waters. When she transitions to Lagos, she must navigate expectations, setbacks, and the demands of building a new life. A story of female solidarity, survival, and purpose, featuring Patience Ozokwor and Bisola Aiyeola.",
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
    imdbId: "tt39379386",
  });

  // Headless (2026)
  const headless = await upsertFilm({
    slug: "headless",
    title: "Headless",
    year: 2026,
    runtime: null,
    country: "NG",
    genres: ["Crime", "Thriller", "Drama"],
    tagline: "Everyone is a suspect. Nobody is innocent.",
    synopsis:
      "A morally ambiguous Nollywood film producer is arrested after a decapitated human head is discovered in his car during a routine police stop. His claims of innocence open an investigation that exposes the unsavory intersections between politics, crime, and the Nigerian film industry — and a dark underworld lurking beneath the surface.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: false,
    awards: ["AFRIFF 2024: Opening Film"],
    imdbId: "tt36944977",
  });

  // Aba Blues (2026)
  const abaBlues = await upsertFilm({
    slug: "aba-blues",
    title: "Aba Blues",
    year: 2026,
    runtime: null,
    country: "NG",
    genres: ["Drama", "Romance"],
    tagline: "Love doesn't end. It just changes shape.",
    synopsis:
      "Set in post-Civil War Aba, Abia State, in the 1960s, the story centres on a married woman whose carefully rebuilt life is upended when a former lover returns. The film explores the psychological weight of love, secrets, loss, faith, choices, and emotional resilience. Adapted from a stage play by director Jack'enneth Opukeme, drawing from Eastern Nigerian literary traditions including Chimamanda Ngozi Adichie's Half of a Yellow Sun.",
    posterUrl: "https://cdn.businessday.ng/wp-content/uploads/2026/02/Untitled-design-26-1.png",
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: true,
    awards: [],
  });

  // Eleko: Oba Esugbayi (2026)
  const eleko = await upsertFilm({
    slug: "eleko-oba-esugbayi",
    title: "Eleko: Oba Esugbayi",
    year: 2026,
    runtime: "1h 59m",
    country: "NG",
    genres: ["Historical", "Drama", "Biography"],
    tagline: "A king who refused to bow.",
    synopsis:
      "The first full-length historical biopic of colonial Lagos. Oba Esugbayi Eleko, the revered monarch who ascended the Lagos throne in 1901, becomes a symbol of dignity and defiance as British administrative control tightens around him. The film chronicles his reign, his resistance against colonial rule, and his subsequent exile in 1925. Starring Femi Branch as Eleko.",
    posterUrl: null,
    criticScore: null,
    audienceScore: null,
    verifiedScore: null,
    heatScore: null,
    criticCount: 0,
    audienceCount: 0,
    verifiedCount: 0,
    boxLive: true,
    awards: [],
  });

  // Evi (2026)
  const evi = await upsertFilm({
    slug: "evi",
    title: "Evi",
    year: 2026,
    runtime: null,
    country: "NG",
    genres: ["Musical", "Drama"],
    tagline: "She lost everything. Her voice was all she had left.",
    synopsis:
      "Gifted but headstrong Afrobeats star Evi-Oghene Donalds sees her world collapse when her record label abruptly cuts ties without compensation. Stripped of fame and fortune, she must confront exploitation, identity loss, and the emotional cost of success — all while rebuilding from scratch alongside a former talent manager fighting his own demons. Hailed as Nollywood's first true musical film.",
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
  });

  console.log("Films upserted.");

  // ═══════════════════════════════════════════════════════════════════════════
  // LANGUAGES
  // ═══════════════════════════════════════════════════════════════════════════

  // Ethiopia
  await addLang(affini.id, "am", 60);
  await addLang(affini.id, "sid", 40);
  await addLang(blackLions.id, "am", 70);
  await addLang(blackLions.id, "en", 30);

  // Egypt
  await addLang(theStories.id, "ar", 80);
  await addLang(theStories.id, "en", 20);
  await addLang(egyBest.id, "ar", 100);
  await addLang(gawaza.id, "ar", 100);
  await addLang(alsada.id, "ar", 100);

  // South Africa
  await addLang(theFix.id, "en", 100);
  await addLang(oldRighteous.id, "af", 90);
  await addLang(oldRighteous.id, "en", 10);
  await addLang(david.id, "en", 100);
  await addLang(spinners.id, "en", 70);
  await addLang(spinners.id, "af", 30);
  await addLang(reyka.id, "en", 90);
  await addLang(reyka.id, "zu", 10);

  // Nigeria
  await addLang(mothersLove.id, "en", 70);
  await addLang(mothersLove.id, "yo", 20);
  await addLang(mothersLove.id, "pcm", 10);
  await addLang(onobiren.id, "en", 60);
  await addLang(onobiren.id, "pcm", 30);
  await addLang(onobiren.id, "yo", 10);
  await addLang(headless.id, "en", 70);
  await addLang(headless.id, "pcm", 30);
  await addLang(abaBlues.id, "ig", 60);
  await addLang(abaBlues.id, "en", 40);
  await addLang(eleko.id, "yo", 60);
  await addLang(eleko.id, "en", 40);
  await addLang(evi.id, "en", 80);
  await addLang(evi.id, "pcm", 20);

  console.log("Languages assigned.");

  // ═══════════════════════════════════════════════════════════════════════════
  // AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  await addAvail(theFix.id, "ZA", "Showmax");
  await addAvail(theFix.id, "ZA", "Paramount+");
  await addAvail(spinners.id, "ZA", "Showmax");
  await addAvail(spinners.id, "NG", "Showmax");
  await addAvail(reyka.id, "ZA", "DStv");
  await addAvail(reyka.id, "GB", "Channel 4");
  await addAvail(reyka.id, "US", "BritBox");
  await addAvail(david.id, "US", "Angel Studios", "tvod");
  await addAvail(mothersLove.id, "NG", "Cinema", "theatrical");
  await addAvail(onobiren.id, "NG", "Cinema", "theatrical");
  await addAvail(onobiren.id, "GH", "Cinema", "theatrical");
  await addAvail(headless.id, "NG", "Cinema", "theatrical");
  await addAvail(abaBlues.id, "NG", "Cinema", "theatrical");
  await addAvail(eleko.id, "NG", "Cinema", "theatrical");
  await addAvail(evi.id, "NG", "Cinema", "theatrical");

  console.log("Availability records added.");
  console.log("\nDone. 17 films imported across ET / EG / ZA / NG.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
