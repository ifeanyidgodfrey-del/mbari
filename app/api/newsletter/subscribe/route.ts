import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const sub = await subscribe(email.toLowerCase().trim(), name);

    return NextResponse.json({
      success: true,
      message: "You're on the list. Weekly Recap drops every Monday.",
      subscriber: { id: sub.id, email: sub.email },
    });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to subscribe" },
      { status: 500 }
    );
  }
}
