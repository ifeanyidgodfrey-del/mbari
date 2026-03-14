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
    select: { id: true, title: true, heatScore: true },
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
      heatScore: film.heatScore,
      breakdown: {
        x: null,
        tiktok: null,
        instagram: null,
        note: "Detailed social breakdown available on Enterprise tier",
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
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
