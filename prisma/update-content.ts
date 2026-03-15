import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Updating M'Bari content...");

  // ── 1. Remove old/past event ──────────────────────────────────────────────
  await prisma.event.deleteMany({ where: { slug: "davido-timeless" } });
  console.log("Removed: Davido Timeless");

  // ── 2. New events (with cover images) ────────────────────────────────────
  const events = [
    {
      slug: "burna-boy-no-sign-lagos",
      title: "Burna Boy: No Sign of Weakness Tour — Lagos",
      type: "Concert",
      venue: "Eko Convention Centre",
      city: "Lagos",
      date: "19 April 2026",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80",
      live: false,
      barcode: true,
      tickets: "available",
      capacity: "15,000",
      audienceScore: null,
      verifiedScore: null,
    },
    {
      slug: "wizkid-homecoming-lagos",
      title: "Wizkid: Homecoming — Lagos",
      type: "Concert",
      venue: "Teslim Balogun Stadium",
      city: "Lagos",
      date: "31 May 2026",
      imageUrl: "https://images.unsplash.com/photo-1429514513361-8fa32282fd5f?auto=format&fit=crop&w=600&q=80",
      live: false,
      barcode: true,
      tickets: "available",
      capacity: "40,000",
      audienceScore: null,
      verifiedScore: null,
    },
    {
      slug: "basket-mouth-experience",
      title: "The BasketMouth Experience",
      type: "Comedy",
      venue: "Eko Hotels & Suites",
      city: "Lagos",
      date: "4 April 2026",
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
      live: false,
      barcode: true,
      tickets: "available",
      capacity: "2,500",
      audienceScore: 88,
      verifiedScore: null,
    },
    {
      slug: "soyinka-at-90",
      title: "Wole Soyinka at 90 — A Tribute",
      type: "Theatre",
      venue: "National Arts Theatre",
      city: "Lagos",
      date: "13 July 2026",
      imageUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=600&q=80",
      live: false,
      barcode: true,
      tickets: "limited",
      capacity: "5,000",
      audienceScore: null,
      verifiedScore: null,
    },
    {
      slug: "afropunk-lagos-2026",
      title: "Afropunk Lagos 2026",
      type: "Festival",
      venue: "Lekki Festival Grounds",
      city: "Lagos",
      date: "August 2026",
      imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80",
      live: false,
      barcode: false,
      tickets: "available",
      capacity: "20,000",
      audienceScore: null,
      verifiedScore: null,
    },
    {
      slug: "nairobi-film-festival-2026",
      title: "Nairobi Film Festival 2026",
      type: "Festival",
      venue: "Alliance Française Nairobi",
      city: "Nairobi",
      date: "September 2026",
      imageUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80",
      live: false,
      barcode: false,
      tickets: "available",
      capacity: null,
      audienceScore: null,
      verifiedScore: null,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: { imageUrl: event.imageUrl, title: event.title },
      create: event,
    });
    console.log(`Upserted event: ${event.title}`);
  }

  // Also add imageUrls to existing events that are missing them
  const existingEventImages: { slug: string; imageUrl: string }[] = [
    {
      slug: "muson-fest-2026",
      imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?auto=format&fit=crop&w=600&q=80",
    },
    {
      slug: "ake-book-fest",
      imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=80",
    },
    {
      slug: "fela-shrine",
      imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    },
    {
      slug: "joburg-comedy",
      imageUrl: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80",
    },
    {
      slug: "randle-opera",
      imageUrl: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=600&q=80",
    },
  ];

  for (const { slug, imageUrl } of existingEventImages) {
    await prisma.event.updateMany({ where: { slug }, data: { imageUrl } });
    console.log(`Updated image for: ${slug}`);
  }

  // ── 3. New films ─────────────────────────────────────────────────────────
  const jade = await prisma.crewMember.upsert({
    where: { slug: "jade-osiberu" },
    update: {},
    create: {
      slug: "jade-osiberu",
      name: "Jade Osiberu",
      type: "director",
      roles: ["Director", "Producer", "Writer"],
      bio: "Jade Osiberu is a Nigerian filmmaker and founder of Greoh Studios, best known for Isoken, Sugar Rush, and A Tribe Called Judah — one of the highest-grossing Nigerian films of all time.",
      awards: ["AMVCA Best Film 2024"],
      available: false,
    },
  });

  const editi = await prisma.crewMember.upsert({
    where: { slug: "editi-effiong" },
    update: {},
    create: {
      slug: "editi-effiong",
      name: "Editi Effiong",
      type: "director",
      roles: ["Director", "Producer"],
      bio: "Editi Effiong is a Nigerian filmmaker and entrepreneur. His debut feature The Black Book became one of Netflix's most-watched African films globally.",
      awards: [],
      available: false,
    },
  });

  const toka = await prisma.crewMember.upsert({
    where: { slug: "toka-mcbaror" },
    update: {},
    create: {
      slug: "toka-mcbaror",
      name: "Toka McBaror",
      type: "director",
      roles: ["Director"],
      bio: "Toka McBaror is a Nigerian director known for the epic historical action film Jagun Jagun: Warrior of Warriors.",
      awards: [],
      available: false,
    },
  });

  const cj = await prisma.crewMember.upsert({
    where: { slug: "cj-obasi" },
    update: {},
    create: {
      slug: "cj-obasi",
      name: "C.J. 'Fiery' Obasi",
      type: "director",
      roles: ["Director", "Writer"],
      bio: "C.J. 'Fiery' Obasi is a Nigerian director celebrated for Mami Wata, a visually stunning black-and-white horror-drama that premiered at Sundance and won the Special Jury Award.",
      awards: ["Sundance Special Jury Award 2023"],
      available: false,
    },
  });

  // A Tribe Called Judah
  const atcj = await prisma.film.upsert({
    where: { slug: "a-tribe-called-judah" },
    update: {},
    create: {
      slug: "a-tribe-called-judah",
      title: "A Tribe Called Judah",
      year: 2023,
      runtime: "2h 31m",
      country: "Nigeria",
      genres: ["Crime", "Comedy", "Drama"],
      tagline: "Four women. One heist. No plan.",
      posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=500&q=80",
      synopsis:
        "Four women from a Lagos slum pull off a daring heist against a corrupt landlord in this crowd-pleasing crime caper from Jade Osiberu. A record-breaking box office triumph that became the highest-grossing Nollywood film of 2023.",
      criticScore: 79,
      audienceScore: 95,
      verifiedScore: 91,
      heatScore: 88,
      criticCount: 41,
      audienceCount: 42000,
      verifiedCount: 11200,
      boxWeekend: null,
      boxCumulative: BigInt("3400000000"),
      boxWeek: null,
      boxLive: false,
      awards: ["AMVCA Best Film 2024", "Africa Magic Best Actress"],
    },
  });

  // The Black Book
  const tbb = await prisma.film.upsert({
    where: { slug: "the-black-book" },
    update: {},
    create: {
      slug: "the-black-book",
      title: "The Black Book",
      year: 2023,
      runtime: "2h 16m",
      country: "Nigeria",
      genres: ["Action", "Thriller", "Crime"],
      tagline: "A father. A mystery. A reckoning.",
      posterUrl: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=80",
      synopsis:
        "A grieving deacon in Lagos turns vigilante after his son is framed for murder by a powerful politician. Editi Effiong's debut feature became a global Netflix hit, redefining what Nollywood action cinema could be.",
      criticScore: 77,
      audienceScore: 91,
      verifiedScore: 86,
      heatScore: 93,
      criticCount: 33,
      audienceCount: 58000,
      verifiedCount: 14300,
      boxWeekend: null,
      boxCumulative: BigInt("850000000"),
      boxWeek: null,
      boxLive: false,
      awards: [],
    },
  });

  // Jagun Jagun
  const jagun = await prisma.film.upsert({
    where: { slug: "jagun-jagun" },
    update: {},
    create: {
      slug: "jagun-jagun",
      title: "Jagun Jagun: Warrior of Warriors",
      year: 2023,
      runtime: "2h 07m",
      country: "Nigeria",
      genres: ["Action", "Historical", "Epic"],
      tagline: "Power is earned in blood.",
      posterUrl: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=500&q=80",
      synopsis:
        "Set in pre-colonial Yorùbáland, a formidable warrior seeks to overthrow a tyrannical general in this stunning epic. One of Netflix Africa's most-watched films of 2023, praised for its choreography and production design.",
      criticScore: 72,
      audienceScore: 89,
      verifiedScore: 84,
      heatScore: 87,
      criticCount: 28,
      audienceCount: 71000,
      verifiedCount: 18500,
      boxWeekend: null,
      boxCumulative: BigInt("520000000"),
      boxWeek: null,
      boxLive: false,
      awards: [],
    },
  });

  // Mami Wata
  const mamiwata = await prisma.film.upsert({
    where: { slug: "mami-wata" },
    update: {},
    create: {
      slug: "mami-wata",
      title: "Mami Wata",
      year: 2023,
      runtime: "1h 47m",
      country: "Nigeria",
      genres: ["Horror", "Drama", "Fantasy"],
      tagline: "The water spirit demands her due.",
      posterUrl: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=500&q=80",
      synopsis:
        "Shot in luminous black and white, this West African horror-drama follows a healer's daughter who must protect her coastal village from chaos after their connection to the mythic water goddess is threatened. A Sundance triumph.",
      criticScore: 90,
      audienceScore: 76,
      verifiedScore: 82,
      heatScore: 71,
      criticCount: 56,
      audienceCount: 8400,
      verifiedCount: 2100,
      boxWeekend: null,
      boxCumulative: BigInt("130000000"),
      boxWeek: null,
      boxLive: false,
      awards: ["Sundance Special Jury Award 2023", "FESPACO Golden Stallion 2023"],
    },
  });

  // Lisabi: The Uprising
  const lisabi = await prisma.film.upsert({
    where: { slug: "lisabi-the-uprising" },
    update: {},
    create: {
      slug: "lisabi-the-uprising",
      title: "Lisabi: The Uprising",
      year: 2024,
      runtime: "1h 58m",
      country: "Nigeria",
      genres: ["Historical", "Action", "Epic"],
      tagline: "A people's rebellion, immortalised.",
      posterUrl: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=500&q=80",
      synopsis:
        "The legendary story of Lisabi of Igboho, the Yorùbá warrior-farmer who led his people in a historic uprising against the Oyo Empire's tax collectors in the 18th century. A visually ambitious epic of resistance and honour.",
      criticScore: 74,
      audienceScore: 86,
      verifiedScore: 80,
      heatScore: 79,
      criticCount: 31,
      audienceCount: 18900,
      verifiedCount: 5200,
      boxWeekend: BigInt("42000000"),
      boxCumulative: BigInt("610000000"),
      boxWeek: 6,
      boxLive: false,
      awards: [],
    },
  });

  // ── 4. Languages for new films ────────────────────────────────────────────
  const langMap: Record<string, string> = {};
  const langs = await prisma.language.findMany();
  for (const l of langs) langMap[l.code] = l.id;

  const filmLangs = [
    // A Tribe Called Judah: Yorùbá 50%, English 30%, Pidgin 20%
    { filmId: atcj.id, code: "yo", pct: 50 },
    { filmId: atcj.id, code: "en", pct: 30 },
    { filmId: atcj.id, code: "pcm", pct: 20 },
    // The Black Book: English 70%, Yorùbá 20%, Pidgin 10%
    { filmId: tbb.id, code: "en", pct: 70 },
    { filmId: tbb.id, code: "yo", pct: 20 },
    { filmId: tbb.id, code: "pcm", pct: 10 },
    // Jagun Jagun: Yorùbá 90%, English 10%
    { filmId: jagun.id, code: "yo", pct: 90 },
    { filmId: jagun.id, code: "en", pct: 10 },
    // Mami Wata: English 60%, Yorùbá 40%
    { filmId: mamiwata.id, code: "en", pct: 60 },
    { filmId: mamiwata.id, code: "yo", pct: 40 },
    // Lisabi: Yorùbá 80%, English 20%
    { filmId: lisabi.id, code: "yo", pct: 80 },
    { filmId: lisabi.id, code: "en", pct: 20 },
  ];

  for (const { filmId, code, pct } of filmLangs) {
    const languageId = langMap[code];
    if (!languageId) continue;
    await prisma.filmLanguage.upsert({
      where: { filmId_languageId: { filmId, languageId } },
      update: {},
      create: { filmId, languageId, percentage: pct },
    }).catch(() => {});
  }

  // ── 5. Crew credits for new films ─────────────────────────────────────────
  const crewCredits = [
    { filmId: atcj.id, crewMemberId: jade.id, role: "Director" },
    { filmId: atcj.id, crewMemberId: jade.id, role: "Producer" },
    { filmId: tbb.id, crewMemberId: editi.id, role: "Director" },
    { filmId: tbb.id, crewMemberId: editi.id, role: "Producer" },
    { filmId: jagun.id, crewMemberId: toka.id, role: "Director" },
    { filmId: mamiwata.id, crewMemberId: cj.id, role: "Director" },
    { filmId: mamiwata.id, crewMemberId: cj.id, role: "Writer" },
  ];

  for (const credit of crewCredits) {
    await prisma.crewCredit.upsert({
      where: { filmId_crewMemberId_role: credit },
      update: {},
      create: credit,
    }).catch(() => {});
  }

  // ── 6. Availability for new films ─────────────────────────────────────────
  const availData = [
    // A Tribe Called Judah — Netflix
    { filmId: atcj.id, countryCode: "NG", platform: "Netflix", accessType: "svod" },
    { filmId: atcj.id, countryCode: "GH", platform: "Netflix", accessType: "svod" },
    { filmId: atcj.id, countryCode: "US", platform: "Netflix", accessType: "svod" },
    { filmId: atcj.id, countryCode: "GB", platform: "Netflix", accessType: "svod" },
    // The Black Book — Netflix
    { filmId: tbb.id, countryCode: "NG", platform: "Netflix", accessType: "svod" },
    { filmId: tbb.id, countryCode: "GH", platform: "Netflix", accessType: "svod" },
    { filmId: tbb.id, countryCode: "ZA", platform: "Netflix", accessType: "svod" },
    { filmId: tbb.id, countryCode: "US", platform: "Netflix", accessType: "svod" },
    { filmId: tbb.id, countryCode: "GB", platform: "Netflix", accessType: "svod" },
    // Jagun Jagun — Netflix
    { filmId: jagun.id, countryCode: "NG", platform: "Netflix", accessType: "svod" },
    { filmId: jagun.id, countryCode: "GH", platform: "Netflix", accessType: "svod" },
    { filmId: jagun.id, countryCode: "US", platform: "Netflix", accessType: "svod" },
    // Mami Wata — MUBI
    { filmId: mamiwata.id, countryCode: "NG", platform: "MUBI", accessType: "svod" },
    { filmId: mamiwata.id, countryCode: "US", platform: "MUBI", accessType: "svod" },
    { filmId: mamiwata.id, countryCode: "GB", platform: "MUBI", accessType: "svod" },
    // Lisabi — Prime Video
    { filmId: lisabi.id, countryCode: "NG", platform: "Prime Video", accessType: "svod" },
    { filmId: lisabi.id, countryCode: "GH", platform: "Prime Video", accessType: "svod" },
    { filmId: lisabi.id, countryCode: "US", platform: "Prime Video", accessType: "svod" },
  ];

  for (const avail of availData) {
    await prisma.availability.upsert({
      where: { filmId_countryCode_platform: { filmId: avail.filmId, countryCode: avail.countryCode, platform: avail.platform } },
      update: {},
      create: avail,
    }).catch(() => {});
  }

  console.log("Content update complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
