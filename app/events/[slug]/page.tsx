import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug: slug } });
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} — M'Bari Events`,
    description: `${event.type} at ${event.venue}, ${event.city} on ${event.date}`,
  };
}

const parch = "#F5F0E4";
const ink = "#1C1608";
const gold = "#8B7040";
const green = "#2D7A3A";
const red = "#C0392B";
const border = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const inkSoft = "#3A2E18";

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug: slug } });
  if (!event) notFound();

  return (
    <div
      style={{
        background: "#E8E2D4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 600, padding: "0 16px 12px" }}>
        <Link
          href="/events"
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: inkFaint,
            textDecoration: "none",
          }}
        >
          ← All Events
        </Link>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: parch,
          border: `1px solid ${inkSoft}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Inner border */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: `0.5px solid ${border}`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Hero image */}
        {event.imageUrl ? (
          <div
            style={{ position: "relative", height: 240, overflow: "hidden" }}
          >
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="600px"
            />
            {/* Type badge */}
            <span
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                background: ink,
                color: parch,
                fontSize: 9,
                fontFamily: "var(--font-sans, sans-serif)",
                letterSpacing: "0.14em",
                padding: "4px 10px",
                fontWeight: 700,
                zIndex: 2,
              }}
            >
              {event.type.toUpperCase()}
            </span>
            {event.live && (
              <span
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: red,
                  color: "#fff",
                  fontSize: 9,
                  fontFamily: "var(--font-sans, sans-serif)",
                  letterSpacing: "0.12em",
                  padding: "4px 10px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "inline-block",
                    animation: "pulse 1.4s infinite",
                  }}
                />
                LIVE NOW
              </span>
            )}
          </div>
        ) : (
          <div
            style={{
              height: 120,
              background: "#EDE6D6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 48,
                color: border,
                opacity: 0.4,
              }}
            >
              {event.type.charAt(0).toUpperCase()}
            </span>
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                background: ink,
                color: parch,
                fontSize: 9,
                fontFamily: "var(--font-sans, sans-serif)",
                letterSpacing: "0.14em",
                padding: "3px 8px",
                fontWeight: 700,
              }}
            >
              {event.type.toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "24px 28px 28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 26,
              fontWeight: 700,
              color: ink,
              margin: "0 0 10px",
              lineHeight: 1.2,
            }}
          >
            {event.title}
          </h1>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 12,
                color: inkMuted,
              }}
            >
              <strong>{event.venue}</strong> · {event.city}
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 12,
                color: inkMuted,
                fontWeight: 600,
              }}
            >
              {event.date}
            </div>
            {event.capacity && (
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                  color: inkFaint,
                }}
              >
                Capacity: {event.capacity}
              </div>
            )}
          </div>

          {/* Tickets */}
          {event.tickets && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                border: `0.5px solid ${green}`,
                background: `${green}10`,
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: green,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              TICKETS: {event.tickets.toUpperCase()}
            </div>
          )}

          {/* Barcode notice */}
          {event.barcode && (
            <div
              style={{
                marginBottom: 14,
                padding: "10px 14px",
                border: `0.5px solid ${gold}`,
                background: `${gold}10`,
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: gold,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              M&apos;BARI BARCODE ENABLED — verified audience scores at this
              event
            </div>
          )}

          {/* Scores */}
          {(event.audienceScore != null || event.verifiedScore != null) && (
            <div
              style={{
                display: "flex",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {event.audienceScore != null && (
                <div
                  style={{
                    flex: 1,
                    border: `0.5px solid ${border}`,
                    padding: "10px 0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontWeight: 700,
                      color: green,
                    }}
                  >
                    {event.audienceScore}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: inkFaint,
                      letterSpacing: "0.1em",
                      fontFamily: "var(--font-sans, sans-serif)",
                    }}
                  >
                    AUDIENCE
                  </div>
                </div>
              )}
              {event.verifiedScore != null && (
                <div
                  style={{
                    flex: 1,
                    border: `1px solid ${green}`,
                    padding: "10px 0",
                    textAlign: "center",
                    background: `${green}10`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontWeight: 700,
                      color: green,
                    }}
                  >
                    {event.verifiedScore}
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color: inkFaint,
                      letterSpacing: "0.1em",
                      fontFamily: "var(--font-sans, sans-serif)",
                    }}
                  >
                    VERIFIED
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
