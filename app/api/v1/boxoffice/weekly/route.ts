import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: NextRequest) {
  const films = await prisma.film.findMany({
    where: { boxCumulative: { not: null } },
    orderBy: { boxCumulative: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      year: true,
      boxWeekend: true,
      boxCumulative: true,
      boxWeek: true,
      boxLive: true,
    },
  });

  return NextResponse.json(
    {
      week: new Date().toISOString().slice(0, 10),
      films: films.map((f, i) => ({
        rank: i + 1,
        id: f.id,
        slug: f.slug,
        title: f.title,
        year: f.year,
        boxWeekend: f.boxWeekend?.toString() ?? null,
        boxCumulative: f.boxCumulative?.toString() ?? null,
        boxWeek: f.boxWeek,
        status: f.boxLive ? "live" : "reported",
      })),
      provenance: {
        source: "mbari.art",
        timestamp: new Date().toISOString(),
        confidence: "high",
      },
    },
    {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
