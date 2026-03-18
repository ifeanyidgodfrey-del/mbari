import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
  const skip = (page - 1) * limit;

  const [series, total] = await Promise.all([
    prisma.series.findMany({
      skip,
      take: limit,
      orderBy: { year: "desc" },
      include: {
        languages: { include: { language: true } },
        crew: { include: { crewMember: true } },
      },
    }),
    prisma.series.count(),
  ]);

  const body = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: total,
    itemListElement: series.map((s, i) => ({
      "@type": "TVSeries",
      position: skip + i + 1,
      item: {
        "@id": `https://mbari.art/series/${s.slug}`,
        name: s.title,
        dateCreated: s.year,
        description: s.synopsis,
        genre: s.genres,
        countryOfOrigin: s.country,
        numberOfSeasons: s.seasons,
        numberOfEpisodes: s.episodes,
        broadcastChannel: s.network,
      },
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    provenance: { source: "mbari.art", confidence: "high", timestamp: new Date().toISOString() },
  };

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
