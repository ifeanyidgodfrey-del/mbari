import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEACT_PATH = path.join(process.cwd(), "prisma/deactivation-candidates.json");

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    if (!fs.existsSync(DEACT_PATH)) {
      return NextResponse.json({ ok: true });
    }

    const raw = fs.readFileSync(DEACT_PATH, "utf-8");
    const candidates: Array<Record<string, unknown>> = JSON.parse(raw);
    const filtered = candidates.filter((item) => item.slug !== slug);
    fs.writeFileSync(DEACT_PATH, JSON.stringify(filtered, null, 2), "utf-8");

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to keep film active" }, { status: 500 });
  }
}
