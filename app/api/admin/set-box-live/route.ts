/**
 * POST /api/admin/set-box-live
 *
 * Body: { slug: string, boxLive: boolean }
 *
 * Quickly toggles the boxLive flag on a film without re-importing everything.
 * Used by the "Mark Live" button in the Now Playing Check panel.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { slug, boxLive } = await req.json();

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const film = await prisma.film.update({
      where: { slug },
      data: { boxLive: Boolean(boxLive) },
      select: { id: true, slug: true, title: true, boxLive: true },
    });

    return NextResponse.json({ success: true, film });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Record to update not found")) {
      return NextResponse.json({ error: "Film not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
