import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);
async function main() {
  const films = await prisma.film.findMany({ where: { boxLive: true }, select: { title: true, country: true, boxCumulative: true }, orderBy: [{ country: "asc" }, { boxCumulative: "desc" }] });
  console.log("boxLive=true:", films.length);
  for (const f of films) console.log(" ", f.country, f.title, f.boxCumulative?.toString());
  const total = await prisma.film.count();
  console.log("Total films:", total);
}
main().finally(() => prisma.$disconnect());
