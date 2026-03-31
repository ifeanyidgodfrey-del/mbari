import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  const film = await prisma.film.findUnique({ where: { slug: "behind-the-scenes" }, select: { id: true, posterUrl: true, backdropUrl: true, tmdbId: true } });
  console.log("Current:", JSON.stringify(film, null, 2));

  // Restore correct poster, clear backdrop (TMDb fetched an incorrect/inappropriate image)
  await prisma.film.update({
    where: { slug: "behind-the-scenes" },
    data: {
      posterUrl: "https://image.tmdb.org/t/p/w500/g8cBAlTiKtmZFkjUWyUdAVR8LRs.jpg",
      backdropUrl: null,
    },
  });
  console.log("Fixed: poster restored, backdrop cleared.");
}
main().finally(() => prisma.$disconnect());
