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
  const film = await prisma.film.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      criticScore: true,
      criticCount: true,
      audienceScore: true,
      audienceCount: true,
      verifiedScore: true,
      verifiedCount: true,
      heatScore: true,
    },
  });

  if (!film) {
    return NextResponse.json(
      { error: "Film not found" },
      { status: 404, headers: CORS }
    );
  }

  return NextResponse.json(
    {
      filmId: film.id,
      title: film.title,
      scores: {
        critic: { score: film.criticScore, count: film.criticCount },
        audience: { score: film.audienceScore, count: film.audienceCount },
        verified: {
          score: film.verifiedScore,
          count: film.verifiedCount,
          note: "Legal watch verification only",
        },
        heat: {
          score: film.heatScore,
          sources: ["X", "TikTok", "Instagram", "social"],
        },
      },
      provenance: {
        source: "mbari.art",
        timestamp: new Date().toISOString(),
        confidence: "high",
      },
    },
    {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
