import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding M'Bari database...");

  // --- Languages ---
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: "yo" },
      update: {},
      create: { code: "yo", name: "Yorùbá", native: "Èdè Yorùbá" },
    }),
    prisma.language.upsert({
      where: { code: "ig" },
      update: {},
      create: { code: "ig", name: "Igbo", native: "Asụsụ Igbo" },
    }),
    prisma.language.upsert({
      where: { code: "ha" },
      update: {},
      create: { code: "ha", name: "Hausa", native: "Harshen Hausa" },
    }),
    prisma.language.upsert({
      where: { code: "en" },
      update: {},
      create: { code: "en", name: "English", native: "English" },
    }),
    prisma.language.upsert({
      where: { code: "pcm" },
      update: {},
      create: { code: "pcm", name: "Naijá Pidgin", native: "Naijá" },
    }),
    prisma.language.upsert({
      where: { code: "fr" },
      update: {},
      create: { code: "fr", name: "French", native: "Français" },
    }),
    prisma.language.upsert({
      where: { code: "zu" },
      update: {},
      create: { code: "zu", name: "Zulu", native: "isiZulu" },
    }),
    prisma.language.upsert({
      where: { code: "sw" },
      update: {},
      create: { code: "sw", name: "Swahili", native: "Kiswahili" },
    }),
  ]);

  const langMap: Record<string, string> = {};
  for (const l of languages) {
    langMap[l.code] = l.id;
  }

  // --- Crew Members ---
  const funke = await prisma.crewMember.upsert({
    where: { slug: "funke-akindele" },
    update: {},
    create: {
      slug: "funke-akindele",
      name: "Funke Akindele",
      type: "director",
      roles: ["Director", "Producer", "Actress"],
      bio: "Funke Akindele-Bello is a Nigerian actress, director, and producer widely regarded as one of the most successful filmmakers in Nollywood. She is best known for the Jenifa franchise and her record-breaking box office performances.",
      awards: ["AMVCA Best Film", "Africa Magic Viewers Choice Award"],
      available: false,
    },
  });

  const kemi = await prisma.crewMember.upsert({
    where: { slug: "kemi-adetiba" },
    update: {},
    create: {
      slug: "kemi-adetiba",
      name: "Kemi Adetiba",
      type: "director",
      roles: ["Director", "Music Video Director"],
      bio: "Kemi Adetiba is a Nigerian filmmaker and music video director celebrated for King of Boys, one of the most acclaimed Nigerian films of the decade. Her sharp political storytelling and visual style have set a new standard for Nigerian cinema.",
      awards: ["AMVCA Best Director"],
      available: false,
    },
  });

  const laju = await prisma.crewMember.upsert({
    where: { slug: "laju-iren" },
    update: {},
    create: {
      slug: "laju-iren",
      name: "Laju Iren",
      type: "director",
      roles: ["Director", "Producer"],
      bio: "Laju Iren is a rising Nigerian filmmaker whose debut feature Onobiren has attracted attention for its intimate storytelling and authentic representation of contemporary Nigerian life.",
      awards: [],
      available: false,
    },
  });

  const yemi = await prisma.crewMember.upsert({
    where: { slug: "yemi-morafa" },
    update: {},
    create: {
      slug: "yemi-morafa",
      name: "Yemi Morafa",
      type: "director",
      roles: ["Director"],
      bio: "Yemi Morafa is a Nigerian filmmaker known for Gingerrr, a vibrant urban drama that connects diaspora and home audiences.",
      awards: [],
      available: false,
    },
  });

  const yinka = await prisma.crewMember.upsert({
    where: { slug: "yinka-edward" },
    update: {},
    create: {
      slug: "yinka-edward",
      name: "Yinka Edward",
      type: "craft",
      roles: ["Cinematographer", "Director of Photography"],
      bio: "Yinka Edward is one of Nigeria's most sought-after cinematographers, known for his rich, textured visual language that honours both the urban and rural landscapes of the continent.",
      awards: [],
      available: true,
    },
  });

  const tunde = await prisma.crewMember.upsert({
    where: { slug: "tunde-babalola" },
    update: {},
    create: {
      slug: "tunde-babalola",
      name: "Tunde Babalola",
      type: "craft",
      roles: ["Screenwriter", "Story Editor"],
      bio: "Tunde Babalola is a prolific Nigerian screenwriter and story consultant whose scripts have underpinned several top-grossing Nollywood productions.",
      awards: ["AMVCA Best Screenplay"],
      available: true,
    },
  });

  // --- Films ---

  // 1. Behind the Scenes (2025)
  const bts = await prisma.film.upsert({
    where: { slug: "behind-the-scenes" },
    update: {},
    create: {
      slug: "behind-the-scenes",
      title: "Behind the Scenes",
      year: 2025,
      runtime: "2h 08m",
      country: "Nigeria",
      genres: ["Drama", "Comedy"],
      tagline: "The camera never lies. Or does it?",
      synopsis:
        "A behind-the-scenes look at the chaotic making of Nigeria's biggest Nollywood blockbuster, where ambition, ego, and talent collide on and off screen. Funke Akindele delivers a self-aware, genre-bending love letter to Nigerian cinema.",
      criticScore: 82,
      audienceScore: 88,
      verifiedScore: 85,
      heatScore: 91,
      criticCount: 47,
      audienceCount: 12430,
      verifiedCount: 3210,
      boxWeekend: BigInt("185000000"),
      boxCumulative: BigInt("2720000000"),
      boxWeek: 14,
      boxLive: true,
      awards: ["AMVCA Best Film 2025"],
    },
  });

  // 2. Everybody Loves Jenifa (2024)
  const jenifa = await prisma.film.upsert({
    where: { slug: "everybody-loves-jenifa" },
    update: {},
    create: {
      slug: "everybody-loves-jenifa",
      title: "Everybody Loves Jenifa",
      year: 2024,
      runtime: "1h 54m",
      country: "Nigeria",
      genres: ["Comedy", "Drama"],
      tagline: "Jenifa is back — and she's going global.",
      synopsis:
        "The beloved Jenifa returns in this crowd-pleasing sequel that sees her navigating fame, family, and the complicated terrain of Nigerian celebrity culture. A record-breaking commercial triumph.",
      criticScore: 74,
      audienceScore: 92,
      verifiedScore: 88,
      heatScore: 84,
      criticCount: 38,
      audienceCount: 28900,
      verifiedCount: 7540,
      boxWeekend: BigInt("95000000"),
      boxCumulative: BigInt("1880000000"),
      boxWeek: 8,
      boxLive: false,
      awards: [],
    },
  });

  // 3. Onobiren (2026)
  const onobiren = await prisma.film.upsert({
    where: { slug: "onobiren" },
    update: {},
    create: {
      slug: "onobiren",
      title: "Onobiren",
      year: 2026,
      runtime: "1h 42m",
      country: "Nigeria",
      genres: ["Drama"],
      tagline: "Who we are when no one is watching.",
      synopsis:
        "A quiet, devastating portrait of a young woman navigating marriage, identity, and belonging in contemporary Lagos. Laju Iren's debut feature is a revelatory piece of Nigerian filmmaking.",
      criticScore: 88,
      audienceScore: 79,
      verifiedScore: 81,
      heatScore: 67,
      criticCount: 22,
      audienceCount: 3200,
      verifiedCount: 890,
      boxWeekend: BigInt("8000000"),
      boxCumulative: BigInt("34000000"),
      boxWeek: 3,
      boxLive: true,
      awards: [],
    },
  });

  // 4. Gingerrr (2025)
  const gingerrr = await prisma.film.upsert({
    where: { slug: "gingerrr" },
    update: {},
    create: {
      slug: "gingerrr",
      title: "Gingerrr",
      year: 2025,
      runtime: "1h 47m",
      country: "Nigeria",
      genres: ["Romance", "Drama"],
      tagline: "Love, heat, and three r's.",
      synopsis:
        "Two estranged siblings reunite in Lagos to settle their late father's estate, uncovering secrets and old wounds in a story about love, legacy, and what it means to come home.",
      criticScore: 71,
      audienceScore: 81,
      verifiedScore: 75,
      heatScore: 78,
      criticCount: 29,
      audienceCount: 8900,
      verifiedCount: 2100,
      boxWeekend: BigInt("42000000"),
      boxCumulative: BigInt("378000000"),
      boxWeek: 6,
      boxLive: false,
      awards: [],
    },
  });

  // 5. King of Boys (2018)
  const kob = await prisma.film.upsert({
    where: { slug: "king-of-boys" },
    update: {},
    create: {
      slug: "king-of-boys",
      title: "King of Boys",
      year: 2018,
      runtime: "2h 25m",
      country: "Nigeria",
      genres: ["Crime", "Drama", "Thriller"],
      tagline: "Power is not given. It is seized.",
      synopsis:
        "A powerful businesswoman with deep ties to Lagos' criminal underworld seeks political power in this sweeping crime epic. Kemi Adetiba's masterwork announced a new era for Nigerian storytelling.",
      criticScore: 91,
      audienceScore: 94,
      verifiedScore: 90,
      heatScore: 72,
      criticCount: 64,
      audienceCount: 34200,
      verifiedCount: 9800,
      boxWeekend: BigInt("18000000"),
      boxCumulative: BigInt("245000000"),
      boxWeek: 0,
      boxLive: false,
      awards: ["AMVCA Best Film 2019", "Africa Magic Best Director"],
    },
  });

  // --- Film Languages ---
  // Behind the Scenes: Yorùbá 55%, English 35%, Pidgin 10%
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: bts.id, languageId: langMap["yo"] } },
    update: {},
    create: { filmId: bts.id, languageId: langMap["yo"], percentage: 55 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: bts.id, languageId: langMap["en"] } },
    update: {},
    create: { filmId: bts.id, languageId: langMap["en"], percentage: 35 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: bts.id, languageId: langMap["pcm"] } },
    update: {},
    create: { filmId: bts.id, languageId: langMap["pcm"], percentage: 10 },
  });

  // Everybody Loves Jenifa: Yorùbá 60%, English 30%, Pidgin 10%
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: jenifa.id, languageId: langMap["yo"] } },
    update: {},
    create: { filmId: jenifa.id, languageId: langMap["yo"], percentage: 60 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: jenifa.id, languageId: langMap["en"] } },
    update: {},
    create: { filmId: jenifa.id, languageId: langMap["en"], percentage: 30 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: jenifa.id, languageId: langMap["pcm"] } },
    update: {},
    create: { filmId: jenifa.id, languageId: langMap["pcm"], percentage: 10 },
  });

  // Onobiren: English 65%, Yorùbá 25%, Pidgin 10%
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: onobiren.id, languageId: langMap["en"] } },
    update: {},
    create: { filmId: onobiren.id, languageId: langMap["en"], percentage: 65 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: onobiren.id, languageId: langMap["yo"] } },
    update: {},
    create: { filmId: onobiren.id, languageId: langMap["yo"], percentage: 25 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: onobiren.id, languageId: langMap["pcm"] } },
    update: {},
    create: { filmId: onobiren.id, languageId: langMap["pcm"], percentage: 10 },
  });

  // Gingerrr: English 70%, Yorùbá 20%, Pidgin 10%
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: gingerrr.id, languageId: langMap["en"] } },
    update: {},
    create: { filmId: gingerrr.id, languageId: langMap["en"], percentage: 70 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: gingerrr.id, languageId: langMap["yo"] } },
    update: {},
    create: { filmId: gingerrr.id, languageId: langMap["yo"], percentage: 20 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: gingerrr.id, languageId: langMap["pcm"] } },
    update: {},
    create: { filmId: gingerrr.id, languageId: langMap["pcm"], percentage: 10 },
  });

  // King of Boys: Yorùbá 70%, English 20%, Pidgin 10%
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: kob.id, languageId: langMap["yo"] } },
    update: {},
    create: { filmId: kob.id, languageId: langMap["yo"], percentage: 70 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: kob.id, languageId: langMap["en"] } },
    update: {},
    create: { filmId: kob.id, languageId: langMap["en"], percentage: 20 },
  });
  await prisma.filmLanguage.upsert({
    where: { filmId_languageId: { filmId: kob.id, languageId: langMap["pcm"] } },
    update: {},
    create: { filmId: kob.id, languageId: langMap["pcm"], percentage: 10 },
  });

  // --- Crew Credits ---
  // Funke -> Behind the Scenes
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: bts.id, crewMemberId: funke.id, role: "Director" } },
    update: {},
    create: { filmId: bts.id, crewMemberId: funke.id, role: "Director" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: bts.id, crewMemberId: funke.id, role: "Producer" } },
    update: {},
    create: { filmId: bts.id, crewMemberId: funke.id, role: "Producer" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: bts.id, crewMemberId: tunde.id, role: "Writer" } },
    update: {},
    create: { filmId: bts.id, crewMemberId: tunde.id, role: "Writer" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: bts.id, crewMemberId: yinka.id, role: "Cinematographer" } },
    update: {},
    create: { filmId: bts.id, crewMemberId: yinka.id, role: "Cinematographer" },
  });

  // Funke -> Everybody Loves Jenifa
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: jenifa.id, crewMemberId: funke.id, role: "Director" } },
    update: {},
    create: { filmId: jenifa.id, crewMemberId: funke.id, role: "Director" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: jenifa.id, crewMemberId: funke.id, role: "Producer" } },
    update: {},
    create: { filmId: jenifa.id, crewMemberId: funke.id, role: "Producer" },
  });

  // Laju -> Onobiren
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: onobiren.id, crewMemberId: laju.id, role: "Director" } },
    update: {},
    create: { filmId: onobiren.id, crewMemberId: laju.id, role: "Director" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: onobiren.id, crewMemberId: yinka.id, role: "Cinematographer" } },
    update: {},
    create: { filmId: onobiren.id, crewMemberId: yinka.id, role: "Cinematographer" },
  });

  // Yemi -> Gingerrr
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: gingerrr.id, crewMemberId: yemi.id, role: "Director" } },
    update: {},
    create: { filmId: gingerrr.id, crewMemberId: yemi.id, role: "Director" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: gingerrr.id, crewMemberId: tunde.id, role: "Writer" } },
    update: {},
    create: { filmId: gingerrr.id, crewMemberId: tunde.id, role: "Writer" },
  });

  // Kemi -> King of Boys
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: kob.id, crewMemberId: kemi.id, role: "Director" } },
    update: {},
    create: { filmId: kob.id, crewMemberId: kemi.id, role: "Director" },
  });
  await prisma.crewCredit.upsert({
    where: { filmId_crewMemberId_role: { filmId: kob.id, crewMemberId: kemi.id, role: "Writer" } },
    update: {},
    create: { filmId: kob.id, crewMemberId: kemi.id, role: "Writer" },
  });

  // --- Cast Members ---
  const castData = [
    { filmId: bts.id, name: "Funke Akindele", character: "Herself / Director" },
    { filmId: bts.id, name: "Tobi Bakre", character: "Lead Actor" },
    { filmId: bts.id, name: "Bimbo Ademoye", character: "Co-Star" },
    { filmId: jenifa.id, name: "Funke Akindele", character: "Jenifa" },
    { filmId: jenifa.id, name: "Eniola Badmus", character: "Bisi" },
    { filmId: jenifa.id, name: "Femi Adebayo", character: "Seun" },
    { filmId: onobiren.id, name: "Mercy Johnson", character: "Onobiren" },
    { filmId: onobiren.id, name: "Seun Ajayi", character: "Dele" },
    { filmId: gingerrr.id, name: "Bimbo Ademoye", character: "Ginger" },
    { filmId: gingerrr.id, name: "Timini Egbuson", character: "Femi" },
    { filmId: kob.id, name: "Sola Sobowale", character: "Alhaja Eniola Salami" },
    { filmId: kob.id, name: "Reminisce", character: "Makanaki" },
    { filmId: kob.id, name: "Toni Tones", character: "Kemi" },
    { filmId: kob.id, name: "Adesua Etomi", character: "Jumoke" },
  ];

  for (const cast of castData) {
    await prisma.castMember.create({ data: cast }).catch(() => {});
  }

  // --- Availability ---
  const availData = [
    // Behind the Scenes
    { filmId: bts.id, countryCode: "NG", platform: "Genesis Cinemas", accessType: "cinema" },
    { filmId: bts.id, countryCode: "NG", platform: "Silverbird", accessType: "cinema" },
    { filmId: bts.id, countryCode: "GH", platform: "Silverbird GH", accessType: "cinema" },
    { filmId: bts.id, countryCode: "ZA", platform: "Nu Metro", accessType: "cinema" },
    { filmId: bts.id, countryCode: "US", platform: "Prime Video", accessType: "svod" },
    { filmId: bts.id, countryCode: "GB", platform: "Prime Video", accessType: "svod" },
    // Everybody Loves Jenifa
    { filmId: jenifa.id, countryCode: "NG", platform: "Netflix", accessType: "svod" },
    { filmId: jenifa.id, countryCode: "GH", platform: "Netflix", accessType: "svod" },
    { filmId: jenifa.id, countryCode: "ZA", platform: "Netflix", accessType: "svod" },
    { filmId: jenifa.id, countryCode: "KE", platform: "Netflix", accessType: "svod" },
    { filmId: jenifa.id, countryCode: "US", platform: "Netflix", accessType: "svod" },
    { filmId: jenifa.id, countryCode: "GB", platform: "Netflix", accessType: "svod" },
    // Onobiren
    { filmId: onobiren.id, countryCode: "NG", platform: "Filmhouse Cinemas", accessType: "cinema" },
    { filmId: onobiren.id, countryCode: "GH", platform: "Silverbird GH", accessType: "cinema" },
    // King of Boys
    { filmId: kob.id, countryCode: "NG", platform: "Netflix", accessType: "svod" },
    { filmId: kob.id, countryCode: "GH", platform: "Netflix", accessType: "svod" },
    { filmId: kob.id, countryCode: "ZA", platform: "Netflix", accessType: "svod" },
    { filmId: kob.id, countryCode: "KE", platform: "Netflix", accessType: "svod" },
    { filmId: kob.id, countryCode: "US", platform: "Netflix", accessType: "svod" },
    { filmId: kob.id, countryCode: "GB", platform: "Netflix", accessType: "svod" },
    // Gingerrr
    { filmId: gingerrr.id, countryCode: "NG", platform: "Prime Video", accessType: "svod" },
    { filmId: gingerrr.id, countryCode: "GH", platform: "Prime Video", accessType: "svod" },
    { filmId: gingerrr.id, countryCode: "US", platform: "Prime Video", accessType: "svod" },
    { filmId: gingerrr.id, countryCode: "GB", platform: "Prime Video", accessType: "svod" },
  ];

  for (const avail of availData) {
    await prisma.availability
      .upsert({
        where: {
          filmId_countryCode_platform: {
            filmId: avail.filmId,
            countryCode: avail.countryCode,
            platform: avail.platform,
          },
        },
        update: {},
        create: avail,
      })
      .catch(() => {});
  }

  // --- Events ---
  const events = [
    {
      slug: "davido-timeless",
      title: "Davido: Timeless World Tour — Lagos",
      type: "Concert",
      venue: "Teslim Balogun Stadium",
      city: "Lagos",
      date: "15 March 2026",
      live: true,
      barcode: true,
      tickets: "sold out",
      capacity: "40,000",
      audienceScore: 94,
      verifiedScore: 92,
    },
    {
      slug: "muson-fest-2026",
      title: "MUSON Festival 2026",
      type: "Music",
      venue: "Muson Centre",
      city: "Lagos",
      date: "2–5 April 2026",
      live: false,
      barcode: true,
      tickets: "available",
      capacity: "2,400",
      audienceScore: null,
      verifiedScore: null,
    },
    {
      slug: "ake-book-fest",
      title: "Aké Arts & Book Festival",
      type: "Festival",
      venue: "Various Venues",
      city: "Abeokuta",
      date: "October 2026",
      live: false,
      barcode: false,
      tickets: "available",
      capacity: null,
      audienceScore: 86,
      verifiedScore: null,
    },
    {
      slug: "fela-shrine",
      title: "Felabration 2026 at the Shrine",
      type: "Concert",
      venue: "New Afrika Shrine",
      city: "Lagos",
      date: "October 2026",
      live: false,
      barcode: false,
      tickets: "available",
      capacity: "5,000",
      audienceScore: 90,
      verifiedScore: null,
    },
    {
      slug: "joburg-comedy",
      title: "Joburg Comedy Fiesta",
      type: "Comedy",
      venue: "Sandton Convention Centre",
      city: "Johannesburg",
      date: "22 March 2026",
      live: false,
      barcode: true,
      tickets: "available",
      capacity: "3,500",
      audienceScore: 83,
      verifiedScore: 81,
    },
    {
      slug: "randle-opera",
      title: "Opera Night at Randle Hall",
      type: "Theatre",
      venue: "Randle Hall",
      city: "Lagos",
      date: "28 March 2026",
      live: false,
      barcode: true,
      tickets: "limited",
      capacity: "800",
      audienceScore: null,
      verifiedScore: null,
    },
  ];

  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: event,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
