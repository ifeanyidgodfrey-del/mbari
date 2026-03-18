import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const QUEUE_PATH = path.join(process.cwd(), "prisma/review-queue.json");
const IGNORE_PATH = path.join(process.cwd(), "prisma/ignore-titles.json");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

function toSlug(title: string): string {
  return title.toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { title, country, action } = await req.json();
    if (!title || !country) {
      return NextResponse.json({ error: "title and country required" }, { status: 400 });
    }

    if (!fs.existsSync(QUEUE_PATH)) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    const queue: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
    const item = queue.find((i) => i.title === title && i.country === country);
    if (!item) return NextResponse.json({ error: "Item not found in queue" }, { status: 404 });

    const now = new Date();

    if (action === "reject") {
      // Add to ignore list and remove from queue
      const ignore: string[] = JSON.parse(fs.readFileSync(IGNORE_PATH, "utf-8"));
      const normalised = title.toLowerCase().trim();
      if (!ignore.includes(normalised)) {
        ignore.push(normalised);
        fs.writeFileSync(IGNORE_PATH, JSON.stringify(ignore, null, 2));
      }
      const updated = queue.filter((i) => !(i.title === title && i.country === country));
      fs.writeFileSync(QUEUE_PATH, JSON.stringify(updated, null, 2));
      return NextResponse.json({ ok: true, action: "rejected" });
    }

    // APPROVE: create/activate film in DB with lastScrapedAt = now
    const slug = toSlug(title as string);
    const existing = await (prisma as any).film.findFirst({
      where: { OR: [{ slug }, { title: { equals: title as string, mode: "insensitive" } }] },
    });

    if (existing) {
      await (prisma as any).film.update({
        where: { id: existing.id },
        data: { boxLive: true, lastScrapedAt: now },
      });
    } else {
      await (prisma as any).film.create({
        data: {
          title: title as string,
          slug,
          country: country as string,
          year: new Date().getFullYear(),
          synopsis: "",
          boxLive: true,
          lastScrapedAt: now,
        },
      });
    }

    // Remove from queue
    const updated = queue.filter((i) => !(i.title === title && i.country === country));
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(updated, null, 2));

    await prisma.$disconnect();
    return NextResponse.json({ ok: true, action: "approved", slug });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
