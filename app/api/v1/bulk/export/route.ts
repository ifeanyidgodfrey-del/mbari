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
    include: {
      languages: { include: { language: true } },
      cast: true,
      crew: { include: { crewMember: true } },
      availability: true,
    },
    orderBy: { boxCumulative: "desc" },
  });

  const body = {
    "@context": "https://schema.org",
    "@type": "DataFeed",
    dataFeedElement: films.map((film) => ({
      "@type": "Movie",
      "@id": `https://mbari.art/film/${film.slug}`,
      name: film.title,
      dateCreated: film.year,
      description: film.synopsis,
      genre: film.genres,
      countryOfOrigin: film.country,
      duration: film.runtime,
      image: film.posterUrl,
      mbariData: {
        slug: film.slug,
        criticScore: film.criticScore,
        audienceScore: film.audienceScore,
        verifiedScore: film.verifiedScore,
        heatScore: film.heatScore,
        boxWeekend: film.boxWeekend?.toString() ?? null,
        boxCumulative: film.boxCumulative?.toString() ?? null,
        boxWeek: film.boxWeek,
        boxLive: film.boxLive,
        languages: film.languages.map((fl) => ({
          code: fl.language.code,
          name: fl.language.name,
          percentage: fl.percentage,
        })),
        availability: film.availability,
        cast: film.cast.map((c) => ({ name: c.name, character: c.character })),
        crew: film.crew.map((c) => ({
          name: c.crewMember.name,
          slug: c.crewMember.slug,
          role: c.role,
        })),
      },
    })),
    provenance: {
      source: "mbari.art",
      timestamp: new Date().toISOString(),
      confidence: "high",
    },
  };

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
