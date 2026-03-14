import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401, headers: CORS }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.filmId || !body.method) {
    return NextResponse.json(
      { error: "filmId and method are required" },
      { status: 400, headers: CORS }
    );
  }

  const { filmId, method, proof, score } = body as {
    filmId: string;
    method: string;
    proof?: string;
    score?: number;
  };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: CORS }
    );
  }

  const film = await prisma.film.findUnique({ where: { id: filmId } });
  if (!film) {
    return NextResponse.json(
      { error: "Film not found" },
      { status: 404, headers: CORS }
    );
  }

  const review = await prisma.review.upsert({
    where: { filmId_userId: { filmId, userId: user.id } },
    update: {
      verified: true,
      verificationMethod: method,
      verificationProof: proof ?? null,
      ...(score != null ? { score } : {}),
    },
    create: {
      filmId,
      userId: user.id,
      score: score ?? 7,
      verified: true,
      verificationMethod: method,
      verificationProof: proof ?? null,
    },
  });

  return NextResponse.json(
    {
      success: true,
      reviewId: review.id,
      verified: review.verified,
      provenance: {
        source: "mbari.art",
        timestamp: new Date().toISOString(),
        confidence: "high",
      },
    },
    { headers: CORS }
  );
}
