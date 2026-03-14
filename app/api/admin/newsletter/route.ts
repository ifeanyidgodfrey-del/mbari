/**
 * POST /api/admin/newsletter/send — Trigger the weekly recap email
 * GET  /api/admin/newsletter      — Get subscriber stats
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyRecap } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [active, unsubscribed, total] = await Promise.all([
      prisma.subscriber.count({ where: { status: "active" } }),
      prisma.subscriber.count({ where: { status: "unsubscribed" } }),
      prisma.subscriber.count(),
    ]);

    const recentSubscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        source: true,
        preferences: true,
        lastSentAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      stats: { active, unsubscribed, total },
      recentSubscribers,
    });
  } catch (err) {
    console.error("[/api/admin/newsletter]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = (body as { action?: string }).action ?? "send";

    if (action === "send") {
      const result = await sendWeeklyRecap();
      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[/api/admin/newsletter] send error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
