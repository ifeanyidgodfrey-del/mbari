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
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const language = await prisma.language.findUnique({
    where: { code },
    include: {
      films: {
        include: { film: true },
        orderBy: { film: { boxCumulative: "desc" } },
      },
    },
  });

  if (!language) {
    return NextResponse.json(
      { error: "Language not found" },
      { status: 404, headers: CORS }
    );
  }

  return NextResponse.json(
    {
      language: {
        code: language.code,
        name: language.name,
        native: language.native,
      },
      films: language.films.map((fl) => ({
        id: fl.film.id,
        slug: fl.film.slug,
        title: fl.film.title,
        year: fl.film.year,
        percentage: fl.percentage,
        criticScore: fl.film.criticScore,
        verifiedScore: fl.film.verifiedScore,
        boxCumulative: fl.film.boxCumulative?.toString() ?? null,
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
