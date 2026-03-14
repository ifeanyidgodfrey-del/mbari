export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import EventsGrid from "@/components/events-grid";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events — M'Bari",
  description:
    "Live events, concerts, theatre, and festivals on M'Bari. Verified with cinema barcodes.",
};

const ink = "#1C1608";
const gold = "#8B7040";
const inkFaint = "#9C8B6E";

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ live: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div
      style={{
        background: "#E8E2D4",
        minHeight: "100vh",
        padding: "20px 16px 40px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 11,
          color: inkFaint,
          textDecoration: "none",
          display: "block",
          marginBottom: 16,
        }}
      >
        ← Back to M&apos;Bari
      </Link>

      <div
        style={{
          borderTop: "2px solid #1C1608",
          borderBottom: "0.5px solid #C4A862",
          padding: "6px 0",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: gold,
            letterSpacing: "0.14em",
            fontWeight: 700,
          }}
        >
          ALL EVENTS
        </span>
        <span
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            color: inkFaint,
          }}
        >
          {events.length} events
        </span>
      </div>

      {events.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 13,
            color: inkFaint,
            padding: 60,
          }}
        >
          No events listed yet.{" "}
          <Link href="/submit" style={{ color: gold, textDecoration: "none" }}>
            Submit one →
          </Link>
        </div>
      ) : (
        <EventsGrid events={events} />
      )}
    </div>
  );
}
