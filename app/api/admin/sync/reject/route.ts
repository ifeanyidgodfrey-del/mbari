import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QUEUE_PATH = path.join(process.cwd(), "prisma/review-queue.json");
const IGNORE_PATH = path.join(process.cwd(), "prisma/ignore-titles.json");

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Remove from queue
    if (fs.existsSync(QUEUE_PATH)) {
      const raw = fs.readFileSync(QUEUE_PATH, "utf-8");
      const queue: Array<Record<string, unknown>> = JSON.parse(raw);
      const filtered = queue.filter((item) => item.title !== title);
      fs.writeFileSync(QUEUE_PATH, JSON.stringify(filtered, null, 2), "utf-8");
    }

    // Add to ignore list
    let ignoreList: string[] = [];
    if (fs.existsSync(IGNORE_PATH)) {
      const raw = fs.readFileSync(IGNORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      ignoreList = Array.isArray(parsed) ? parsed : [];
    }

    if (!ignoreList.includes(title)) {
      ignoreList.push(title);
      fs.writeFileSync(IGNORE_PATH, JSON.stringify(ignoreList, null, 2), "utf-8");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to reject item" }, { status: 500 });
  }
}
