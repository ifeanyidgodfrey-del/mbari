import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export async function POST() {
  try {
    const cwd = process.cwd();
    const scraperPath = path.join(cwd, "prisma/cinema-scraper.ts");
    const stdout = execSync(`npx tsx ${scraperPath}`, {
      cwd,
      timeout: 120000,
      encoding: "utf-8",
    });
    return NextResponse.json({ ok: true, stdout });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scraper failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
