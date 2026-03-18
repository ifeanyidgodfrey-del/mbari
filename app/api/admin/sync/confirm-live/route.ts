import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
const prisma = new PrismaClient({ adapter } as any);

// POST /api/admin/sync/confirm-live
// Body: { slug: string }
// Sets lastScrapedAt = now for an unscraped-country film, resetting the 21-day clock.
export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    await prisma.film.update({
      where: { slug },
      data: { lastScrapedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to confirm" },
      { status: 500 }
    );
  }
}
