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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const crew = await prisma.crewMember.findUnique({
    where: { id },
    include: {
      credits: {
        include: { film: true },
        orderBy: { film: { year: "desc" } },
      },
    },
  });

  if (!crew) {
    return NextResponse.json(
      { error: "Crew member not found" },
      { status: 404, headers: CORS }
    );
  }

  const body = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `https://mbari.art/crew/${crew.slug}`,
    name: crew.name,
    description: crew.bio,
    jobTitle: crew.roles,
    mbariData: {
      type: crew.type,
      available: crew.available,
      awards: crew.awards,
      credits: crew.credits.map((c) => ({
        filmId: c.filmId,
        filmTitle: c.film.title,
        filmSlug: c.film.slug,
        role: c.role,
        year: c.film.year,
        criticScore: c.film.criticScore,
        boxCumulative: c.film.boxCumulative?.toString(),
      })),
    },
    provenance: {
      source: "mbari.art",
      timestamp: new Date().toISOString(),
      confidence: "high",
    },
  };

  return NextResponse.json(body, {
    headers: {
      ...CORS,
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
