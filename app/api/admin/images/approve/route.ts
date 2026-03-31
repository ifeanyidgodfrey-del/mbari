import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const QUEUE_PATH = path.join(process.cwd(), "prisma/image-review-queue.json");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);

export async function POST(req: NextRequest) {
  const { index, candidateIndex, field } = await req.json();
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
  const entry = queue[index];
  if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });

  const candidate = entry.candidates[candidateIndex ?? 0];
  if (!candidate) return NextResponse.json({ error: "no candidate" }, { status: 400 });

  // Apply to DB
  if (entry.type === "film" && entry.slug) {
    const updates: Record<string, string> = {};
    const fields = (field ?? entry.field ?? "").split("+");
    if (fields.includes("posterUrl") && candidate.posterPath) {
      updates.posterUrl = `https://image.tmdb.org/t/p/w500${candidate.posterPath}`;
    }
    if (fields.includes("backdropUrl") && candidate.backdropPath) {
      updates.backdropUrl = `https://image.tmdb.org/t/p/w1280${candidate.backdropPath}`;
    }
    if (Object.keys(updates).length) {
      await (prisma as any).film.update({ where: { slug: entry.slug }, data: updates });
    }
  } else if (entry.type === "actor" && entry.name) {
    if (candidate.profilePath) {
      await (prisma as any).actor.updateMany({
        where: { name: entry.name },
        data: { imageUrl: `https://image.tmdb.org/t/p/w185${candidate.profilePath}` },
      });
    }
  }

  // Remove from queue
  queue.splice(index, 1);
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  await prisma.$disconnect();
  return NextResponse.json({ ok: true });
}
