import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { differenceInDays } from "date-fns";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
const prisma = new PrismaClient({ adapter } as any);

// Countries that have active scrapers — films here are confirmed by scraper.
// Everything else requires manual admin confirmation every 21 days.
const SCRAPED_COUNTRIES = new Set(["EG", "ZA", "KE", "GH"]);

const MAX_UNCONFIRMED_DAYS = 21;

// GET /api/admin/sync/unconfirmed-films
// Returns all boxLive films in unscraped countries (e.g. NG), annotated with
// days since last confirmation and urgency level.
export async function GET() {
  try {
    const films = await prisma.film.findMany({
      where: { boxLive: true },
      select: {
        slug: true,
        title: true,
        country: true,
        year: true,
        lastScrapedAt: true,
      },
      orderBy: { lastScrapedAt: "asc" },
    });

    const now = new Date();

    const unconfirmed = films
      .filter((f: { country: string }) => !SCRAPED_COUNTRIES.has(f.country))
      .map((f: { slug: string; title: string; country: string; year: number | null; lastScrapedAt: Date | null }) => {
        const daysSince = f.lastScrapedAt
          ? differenceInDays(now, f.lastScrapedAt)
          : MAX_UNCONFIRMED_DAYS + 1;
        return {
          slug: f.slug,
          title: f.title,
          country: f.country,
          year: f.year,
          daysSinceConfirm: daysSince,
          lastConfirmedAt: f.lastScrapedAt?.toISOString() ?? null,
          daysRemaining: Math.max(0, MAX_UNCONFIRMED_DAYS - daysSince),
          urgent: daysSince >= MAX_UNCONFIRMED_DAYS - 3,
        };
      })
      .sort((a: { daysSinceConfirm: number }, b: { daysSinceConfirm: number }) => b.daysSinceConfirm - a.daysSinceConfirm);

    return NextResponse.json(unconfirmed);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
