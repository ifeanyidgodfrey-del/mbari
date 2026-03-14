import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || !body.title || !body.submitter) {
    return NextResponse.json(
      { error: "title and submitter are required" },
      { status: 400, headers: CORS }
    );
  }

  const submission = await prisma.submission.create({
    data: {
      type: body.type ?? "film",
      title: body.title,
      submitter: body.submitter,
      excerpt: body.excerpt ?? null,
      hasDesign: body.hasDesign ?? false,
      designNote: body.designNote ?? null,
      designHtml: body.designHtml ?? null,
      filmId: body.filmId ?? null,
      status: "pending",
    },
  });

  return NextResponse.json(
    {
      success: true,
      id: submission.id,
      status: submission.status,
    },
    { status: 201, headers: CORS }
  );
}
