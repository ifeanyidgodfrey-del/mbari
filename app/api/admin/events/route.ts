/**
 * GET  /api/admin/events           — list all events
 * POST /api/admin/events           — create a new event
 * PUT  /api/admin/events           — update an existing event (body includes id)
 * DELETE /api/admin/events?id=...  — delete an event
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: [{ live: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, type, venue, city, country, date, imageUrl, live, barcode, tickets, capacity, audienceScore, verifiedScore, slugOverride } = body;

    if (!title || !type || !venue || !city || !country || !date) {
      return NextResponse.json({ error: "title, type, venue, city, country, date are required" }, { status: 400 });
    }

    const ALLOWED_COUNTRIES = ["Nigeria", "South Africa", "Kenya", "Ghana"];
    if (!ALLOWED_COUNTRIES.includes(country)) {
      return NextResponse.json({ error: `country must be one of: ${ALLOWED_COUNTRIES.join(", ")}` }, { status: 400 });
    }

    const slug = slugOverride ?? slugify(title);

    const event = await prisma.event.create({
      data: {
        slug,
        title,
        type,
        venue,
        city,
        country,
        date,
        imageUrl: imageUrl || null,
        live: live ?? false,
        barcode: barcode ?? false,
        tickets: tickets || null,
        capacity: capacity || null,
        audienceScore: audienceScore ?? null,
        verifiedScore: verifiedScore ?? null,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "An event with this slug already exists. Provide a slugOverride." }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (fields.title !== undefined) data.title = fields.title;
    if (fields.type !== undefined) data.type = fields.type;
    if (fields.venue !== undefined) data.venue = fields.venue;
    if (fields.city !== undefined) data.city = fields.city;
    if (fields.country !== undefined) {
      const ALLOWED_COUNTRIES = ["Nigeria", "South Africa", "Kenya", "Ghana"];
      if (!ALLOWED_COUNTRIES.includes(fields.country as string)) {
        return NextResponse.json({ error: `country must be one of: ${ALLOWED_COUNTRIES.join(", ")}` }, { status: 400 });
      }
      data.country = fields.country;
    }
    if (fields.date !== undefined) data.date = fields.date;
    if (fields.imageUrl !== undefined) data.imageUrl = fields.imageUrl || null;
    if (fields.live !== undefined) data.live = fields.live;
    if (fields.barcode !== undefined) data.barcode = fields.barcode;
    if (fields.tickets !== undefined) data.tickets = fields.tickets || null;
    if (fields.capacity !== undefined) data.capacity = fields.capacity || null;
    if (fields.audienceScore !== undefined) data.audienceScore = fields.audienceScore ?? null;
    if (fields.verifiedScore !== undefined) data.verifiedScore = fields.verifiedScore ?? null;

    const event = await prisma.event.update({ where: { id }, data });
    return NextResponse.json({ success: true, event });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
