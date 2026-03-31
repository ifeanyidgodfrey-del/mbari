/**
 * Patches missing backdrop URLs for the 11 canonical films,
 * and adds Citation (2020) which is not on TMDb.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const BACK = "https://image.tmdb.org/t/p/w1280";

// Backdrop paths from the TMDb agent run
const BACKDROPS: Record<string, string> = {
  "lionheart":                     `${BACK}/oQb0md9X1S48jwCkYhQzokKzH9z.jpg`,
  "living-in-bondage-breaking-free": `${BACK}/pO1ZqvGCStpZdlWUoaRwLzHjeSu.jpg`,
  "sugar-rush":                    `${BACK}/oyEBuaaGobDsu1enbpl5ZhFEyJJ.jpg`,
  "rattlesnake-the-ahanna-story":  `${BACK}/ool6psDvoUHqrSuLZeJ14UOSKRd.jpg`,
  "amina":                         `${BACK}/4EJSMQOM1bZPHvzqAQe87suBxdf.jpg`,
  "eyimofe":                       `${BACK}/ytuH5IHyZjGO3bGfWhavqfTXJml.jpg`,
  "mami-wata":                     `${BACK}/ycyssTVBW4x1DLapPcUfluCXsM1.jpg`,
  "a-tribe-called-judah":          `${BACK}/jX7Mb37fa7JhB9c3acL1evERNwW.jpg`,
  "the-black-book":                `${BACK}/9WxqnP9c29wXd03sALSpxpTx8fk.jpg`,
  "jagun-jagun":                   `${BACK}/4Yon9Qmg3U4onL0OywXAHSkFTUG.jpg`,
  "lisabi-the-uprising":           `${BACK}/xf461ETw77oZoKtMoK8NrPAacDb.jpg`,
};

async function main() {
  // Patch backdrops
  for (const [slug, backdropUrl] of Object.entries(BACKDROPS)) {
    await prisma.film.updateMany({
      where: { slug, backdropUrl: null },
      data: { backdropUrl },
    });
    console.log(`  ✓ backdrop: ${slug}`);
  }

  // Add Citation (2020) — not on TMDb
  const exists = await prisma.film.findUnique({ where: { slug: "citation" } });
  if (!exists) {
    await prisma.film.create({
      data: {
        slug: "citation",
        title: "Citation",
        year: 2020,
        country: "NG",
        tmdbId: null,
        imdbId: null,
        genres: ["Drama"],
        synopsis: "A determined postgraduate student at a West African university refuses to keep quiet after she is sexually assaulted by a respected professor. Navigating institutional indifference and social pressure, she fights to hold her attacker accountable. Directed by Kunle Afolabi.",
        tagline: "She chose to speak.",
        runtime: "1h 35m",
        posterUrl: null,
        trailerUrl: null,
        criticScore: 74,
        awards: [],
        boxLive: false,
        upcoming: false,
      },
    });
    console.log("  ✓ created: Citation (2020)");
  } else {
    console.log("  ⏭  Citation already exists");
  }

  // Also add backdrop for Behind the Scenes if missing
  await prisma.film.updateMany({
    where: { slug: "behind-the-scenes", backdropUrl: null },
    data: { backdropUrl: "https://image.tmdb.org/t/p/w1280/g8cBAlTiKtmZFkjUWyUdAVR8LRs.jpg" },
  });

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
