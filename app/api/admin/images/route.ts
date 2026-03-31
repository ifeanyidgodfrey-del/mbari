import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const QUEUE_PATH = path.join(process.cwd(), "prisma/image-review-queue.json");

export async function GET() {
  if (!fs.existsSync(QUEUE_PATH)) return NextResponse.json([]);
  const raw = fs.readFileSync(QUEUE_PATH, "utf-8");
  return NextResponse.json(JSON.parse(raw));
}
