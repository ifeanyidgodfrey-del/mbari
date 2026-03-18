import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_PATH = path.join(process.cwd(), "prisma/review-queue.json");

export async function GET() {
  try {
    if (!fs.existsSync(QUEUE_PATH)) {
      return NextResponse.json([]);
    }
    const raw = fs.readFileSync(QUEUE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json({ error: "Failed to read queue" }, { status: 500 });
  }
}
