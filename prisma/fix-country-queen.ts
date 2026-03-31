import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const film = await prisma.film.findUnique({
    where: { slug: "country-queen" },
    include: {
      crew: { include: { crewMember: true } },
      cast: true,
    },
  });
  console.log("tmdbId:", film?.tmdbId);
  console.log("backdropUrl:", film?.backdropUrl);
  console.log("posterUrl:", film?.posterUrl);
  console.log("Cast rows:", film?.cast.length);
  console.log("Crew rows:", film?.crew.map(c => `${c.crewMember.name} (${c.role})`).join(", "));

  if (!film) return;

  await prisma.actorCredit.deleteMany({ where: { filmId: film.id } });
  await prisma.crewCredit.deleteMany({ where: { filmId: film.id } });
  await prisma.film.update({
    where: { id: film.id },
    data: { tmdbId: null, backdropUrl: null, posterUrl: null },
  });
  console.log("\nCleared wrong cast, crew, tmdbId, backdrop, poster.");
}

main().finally(() => prisma.$disconnect());
