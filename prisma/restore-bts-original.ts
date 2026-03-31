import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  await prisma.film.update({
    where: { slug: "behind-the-scenes" },
    data: {
      posterUrl: "https://image.tmdb.org/t/p/w500/b7H6dvJFyJJPJEYSqVuw3VpKuTN.jpg",
      backdropUrl: null,
    },
  });
  console.log("Restored original poster for Behind the Scenes, backdrop cleared.");
}
main().finally(() => prisma.$disconnect());
