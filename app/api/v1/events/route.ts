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
  const events = await prisma.event.findMany({
    orderBy: [{ live: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    {
      events,
      total: events.length,
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
