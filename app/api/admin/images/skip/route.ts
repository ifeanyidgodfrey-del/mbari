import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const QUEUE_PATH = path.join(process.cwd(), "prisma/image-review-queue.json");

export async function POST(req: NextRequest) {
  const { index } = await req.json();
  const queue = JSON.parse(fs.readFileSync(QUEUE_PATH, "utf-8"));
  if (queue[index] === undefined) return NextResponse.json({ error: "not found" }, { status: 404 });
  queue.splice(index, 1);
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  return NextResponse.json({ ok: true });
}
