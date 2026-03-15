import Link from "next/link";
import Image from "next/image";

type Event = {
  id: string;
  slug: string;
  title: string;
  type: string;
  venue: string;
  city: string;
  country: string;
  date: string;
  imageUrl: string | null;
  live: boolean;
  barcode: boolean;
  tickets: string | null;
  audienceScore: number | null;
};

const parch = "#F5F0E4";
const parchDark = "#EDE6D6";
const gold = "#8B7040";
const ink = "#1C1608";
const inkMuted = "#6B5D3F";
const inkFaint = "#9C8B6E";
const border = "#C4A862";
const green = "#2D7A3A";
const red = "#C0392B";

function typeInitial(type: string): string {
  if (!type) return "E";
  return type.charAt(0).toUpperCase();
}

export default function EventsGrid({ events }: { events: Event[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.slug}`}
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              border: `0.5px solid ${border}`,
              background: parch,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Image */}
            <div
              style={{
                height: 140,
                background: parchDark,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="300px"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 40,
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      color: border,
                      opacity: 0.4,
                    }}
                  >
                    {typeInitial(event.type)}
                  </span>
                </div>
              )}

              {/* Type badge */}
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: "#1C1608",
                  color: "#F5F0E4",
                  fontSize: 9,
                  fontFamily: "var(--font-sans, sans-serif)",
                  letterSpacing: "0.14em",
                  padding: "3px 8px",
                  fontWeight: 700,
                }}
              >
                {event.type.toUpperCase()}
              </span>

              {/* LIVE badge */}
              {event.live && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: red,
                    color: "#fff",
                    fontSize: 9,
                    fontFamily: "var(--font-sans, sans-serif)",
                    letterSpacing: "0.12em",
                    padding: "3px 8px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
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

            {/* Content */}
            <div style={{ padding: "12px 14px 14px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 15,
                  fontWeight: 700,
                  color: ink,
                  margin: "0 0 4px",
                  lineHeight: 1.2,
                }}
              >
                {event.title}
              </h3>

              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: inkFaint,
                  marginBottom: 6,
                }}
              >
                {event.venue} · {event.city}
                {event.country && (
                  <span style={{ color: gold, fontWeight: 700, marginLeft: 4 }}>· {event.country.toUpperCase()}</span>
                )}
              </div>

              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: inkMuted,
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                {event.date}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {event.tickets && (
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "var(--font-sans, sans-serif)",
                        color: green,
                        border: `0.5px solid ${green}`,
                        padding: "2px 6px",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {event.tickets.toUpperCase()}
                    </span>
                  )}
                  {event.barcode && (
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "var(--font-sans, sans-serif)",
                        color: gold,
                        border: `0.5px solid ${gold}`,
                        padding: "2px 6px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                      }}
                    >
                      M&apos;BARI BARCODE
                    </span>
                  )}
                </div>

                {event.audienceScore != null && (
                  <span
                    style={{
                      background: green,
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      padding: "2px 7px",
                    }}
                  >
                    {event.audienceScore}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
