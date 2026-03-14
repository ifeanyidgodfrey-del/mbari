import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/email";

/**
 * GET /api/newsletter/unsubscribe?key=xxx
 * One-click unsubscribe (supports List-Unsubscribe header standard)
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return new NextResponse(unsubPage("Missing unsubscribe key.", false), {
      headers: { "Content-Type": "text/html" },
      status: 400,
    });
  }

  try {
    await unsubscribe(key);
    return new NextResponse(unsubPage("You've been unsubscribed.", true), {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new NextResponse(unsubPage("Invalid or expired unsubscribe link.", false), {
      headers: { "Content-Type": "text/html" },
      status: 404,
    });
  }
}

/** Also support POST for List-Unsubscribe-Post one-click standard */
export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  try {
    await unsubscribe(key);
    return NextResponse.json({ success: true, message: "Unsubscribed" });
  } catch {
    return NextResponse.json({ error: "Invalid key" }, { status: 404 });
  }
}

function unsubPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html><head><title>M'Bari — Unsubscribe</title></head>
<body style="background:#F5F0E4;font-family:Georgia,serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
  <div style="text-align:center;max-width:400px;padding:40px;">
    <div style="font-size:32px;font-weight:700;color:#1C1608;margin-bottom:8px;">M'Bari</div>
    <div style="font-size:14px;color:${success ? "#2D7A3A" : "#B83232"};margin-bottom:16px;">${message}</div>
    ${success ? '<div style="font-size:12px;color:#8B7A5E;">You won\'t receive any more emails from us.</div>' : ""}
    <div style="margin-top:24px;">
      <a href="https://mbari.art" style="color:#8B7040;font-size:12px;text-decoration:none;">← Back to M'Bari</a>
    </div>
  </div>
</body></html>`;
}
