import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

const provenance = {
  source: "mbari.art",
  confidence: "high",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));
  const skip = (page - 1) * limit;

  const [films, total] = await Promise.all([
    prisma.film.findMany({
      skip,
      take: limit,
      orderBy: { boxCumulative: "desc" },
      include: {
        languages: { include: { language: true } },
        crew: { include: { crewMember: true } },
      },
    }),
    prisma.film.count(),
  ]);

  const body = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: total,
    itemListElement: films.map((film, i) => ({
      "@type": "Movie",
      position: skip + i + 1,
      item: {
        "@id": `https://mbari.art/film/${film.slug}`,
        name: film.title,
        dateCreated: film.year,
        description: film.synopsis,
        genre: film.genres,
        countryOfOrigin: film.country,
      },
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    provenance: { ...provenance, timestamp: new Date().toISOString() },
  };

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
