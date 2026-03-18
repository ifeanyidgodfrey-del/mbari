import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEACT_PATH = path.join(process.cwd(), "prisma/deactivation-candidates.json");

export async function GET() {
  try {
    if (!fs.existsSync(DEACT_PATH)) {
      return NextResponse.json([]);
    }
    const raw = fs.readFileSync(DEACT_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json({ error: "Failed to read deactivation candidates" }, { status: 500 });
  }
}
