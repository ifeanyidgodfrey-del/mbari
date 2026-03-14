import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

const provenance = {
  source: "mbari.art",
  confidence: "high",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const film = await prisma.film.findUnique({
    where: { id },
    include: {
      languages: { include: { language: true } },
      cast: true,
      crew: { include: { crewMember: true } },
      availability: true,
      reviews: true,
    },
  });

  if (!film) {
    return NextResponse.json(
      { error: "Film not found" },
      { status: 404, headers: CORS }
    );
  }

  const body = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `https://mbari.art/film/${film.slug}`,
    name: film.title,
    dateCreated: film.year,
    description: film.synopsis,
    genre: film.genres,
    countryOfOrigin: film.country,
    duration: film.runtime,
    image: film.posterUrl,
    aggregateRating: film.criticScore
      ? {
          "@type": "AggregateRating",
          ratingValue: film.criticScore,
          ratingCount: film.criticCount,
        }
      : undefined,
    actor: film.cast.map((c) => ({ "@type": "Person", name: c.name })),
    director: film.crew
      .filter((c) => c.role === "Director")
      .map((c) => ({ "@type": "Person", name: c.crewMember.name })),
    trailer: film.trailerUrl ? { "@type": "VideoObject", url: film.trailerUrl } : undefined,
    sameAs: [
      film.imdbId ? `https://www.imdb.com/title/${film.imdbId}` : null,
      film.tmdbId ? `https://www.themoviedb.org/movie/${film.tmdbId}` : null,
    ].filter(Boolean),
    mbariData: {
      criticScore: film.criticScore,
      audienceScore: film.audienceScore,
      verifiedScore: film.verifiedScore,
      heatScore: film.heatScore,
      boxWeekend: film.boxWeekend?.toString(),
      boxCumulative: film.boxCumulative?.toString(),
      boxWeek: film.boxWeek,
      boxLive: film.boxLive,
      tmdbId: film.tmdbId,
      imdbId: film.imdbId,
      trailerUrl: film.trailerUrl,
      availability: film.availability,
    },
    provenance: { ...provenance, timestamp: new Date().toISOString() },
  };

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
