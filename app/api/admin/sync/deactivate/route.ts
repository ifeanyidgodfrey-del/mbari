import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari" });
const prisma = new PrismaClient({ adapter } as any);

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    await prisma.film.update({
      where: { slug },
      data: { boxLive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to deactivate film";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
