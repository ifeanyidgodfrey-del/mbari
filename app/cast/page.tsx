import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cast Directory — M'Bari",
  description:
    "Profiles for every actor in the M'Bari African cinema catalogue — Nollywood, South African, Kenyan, Ghanaian, Ethiopian and Egyptian screen talent.",
};

const ink = "#1C1608";
const inkMuted = "#6B5D3F";
const inkFaint = "#9C8B6E";
const gold = "#8B7040";
const border = "#D8CDB4";
const green = "#2D7A3A";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  ET: "Ethiopia", CM: "Cameroon", TZ: "Tanzania", SN: "Senegal",
  CI: "Côte d'Ivoire", EG: "Egypt",
};

const COUNTRY_COLOR: Record<string, string> = {
  NG: "#2D7A3A", ZA: "#1A5C8A", KE: "#8B1A1A", GH: "#B8860B",
};

export default async function CastDirectoryPage() {
  const actors = await prisma.actor.findMany({
    include: {
      credits: { include: { film: true } },
    },
    orderBy: { name: "asc" },
  });

  // Group by nationality
  const byCountry: Record<string, typeof actors> = {};
  const noCountry: typeof actors = [];
  for (const actor of actors) {
    if (actor.nationality) {
      if (!byCountry[actor.nationality]) byCountry[actor.nationality] = [];
      byCountry[actor.nationality].push(actor);
    } else {
      noCountry.push(actor);
    }
  }

  const countryOrder = ["NG", "ZA", "KE", "GH", "ET", "EG"];
  const sortedCountries = [
    ...countryOrder.filter((c) => byCountry[c]),
    ...Object.keys(byCountry).filter((c) => !countryOrder.includes(c)).sort(),
  ];

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      {/* Header ribbon */}
      <header style={{
        background: ink,
        padding: "48px 24px 40px",
        borderBottom: `2px solid ${gold}`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Link href="/" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: gold,
            textDecoration: "none",
            letterSpacing: "0.12em",
            display: "block",
            marginBottom: 20,
          }}>
            ← M&apos;BARI
          </Link>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 9,
                color: gold,
                letterSpacing: "0.22em",
                fontWeight: 700,
                marginBottom: 10,
              }}>
                CAST DIRECTORY
              </div>
              <h1 style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "clamp(36px, 5vw, 58px)",
                fontWeight: 700,
                color: "#FFFDF7",
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}>
                The Faces of<br />African Cinema
              </h1>
              <p style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 13,
                color: `${gold}CC`,
                marginTop: 12,
                marginBottom: 0,
                lineHeight: 1.6,
                maxWidth: 480,
              }}>
                Screen talent from across the continent — Nollywood stars, South African leads, East African breakouts, and every face in the M&apos;Bari catalogue.
              </p>
            </div>
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 64,
              fontWeight: 700,
              color: `${gold}30`,
              lineHeight: 1,
              flexShrink: 0,
            }}>
              {actors.length}
            </div>
          </div>
        </div>
      </header>

      {/* Nav link to crew */}
      <div style={{
        background: "#FDFAF4",
        borderBottom: `1px solid ${border}`,
        padding: "10px 24px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 20 }}>
          <Link href="/cast" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: ink,
            textDecoration: "none",
            fontWeight: 700,
            letterSpacing: "0.08em",
            borderBottom: `2px solid ${gold}`,
            paddingBottom: 2,
          }}>
            CAST
          </Link>
          <Link href="/crew" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: inkFaint,
            textDecoration: "none",
            letterSpacing: "0.08em",
          }}>
            CREW
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        {sortedCountries.map((country) => {
          const members = byCountry[country];
          const countryColor = COUNTRY_COLOR[country] ?? gold;
          return (
            <section key={country} style={{ marginBottom: 64 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 28,
                paddingBottom: 12,
                borderBottom: `1.5px solid ${ink}`,
              }}>
                <div style={{ width: 4, height: 28, background: countryColor, flexShrink: 0 }} />
                <h2 style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: ink,
                  margin: 0,
                }}>
                  {COUNTRY_NAME[country] ?? country}
                </h2>
                <span style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: inkFaint,
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}>
                  {members.length} {members.length === 1 ? "profile" : "profiles"}
                </span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))",
                gap: 24,
              }}>
                {members.map((actor) => {
                  const filmCount = actor.credits.length;
                  const latestYear = actor.credits.reduce(
                    (max, c) => Math.max(max, c.film.year), 0
                  );
                  const avgScore = (() => {
                    const scores = actor.credits
                      .map((c) => c.film.criticScore)
                      .filter((s): s is number => s != null);
                    return scores.length > 0
                      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                      : null;
                  })();

                  return (
                    <Link key={actor.id} href={`/cast/${actor.slug}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        background: "#fff",
                        border: `1px solid ${border}`,
                        overflow: "hidden",
                      }}>
                        {/* Photo */}
                        <div style={{ height: 200, background: "#F5F0E4", position: "relative", overflow: "hidden" }}>
                          {actor.imageUrl ? (
                            <Image
                              src={actor.imageUrl}
                              alt={actor.name}
                              fill
                              style={{ objectFit: "cover", objectPosition: "top" }}
                              sizes="200px"
                            />
                          ) : (
                            <div style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "linear-gradient(135deg, #F5F0E4, #E8DFCC)",
                            }}>
                              <span style={{
                                fontFamily: "var(--font-serif, Georgia, serif)",
                                fontSize: 56,
                                color: border,
                                fontWeight: 700,
                                opacity: 0.6,
                              }}>
                                {actor.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {/* Actor badge */}
                          <span style={{
                            position: "absolute",
                            bottom: 10,
                            left: 10,
                            background: countryColor,
                            color: "#fff",
                            fontSize: 8,
                            fontFamily: "var(--font-sans, sans-serif)",
                            letterSpacing: "0.12em",
                            padding: "3px 8px",
                            fontWeight: 700,
                          }}>
                            ACTOR
                          </span>
                        </div>

                        {/* Info */}
                        <div style={{ padding: "14px 16px 16px" }}>
                          <div style={{
                            fontFamily: "var(--font-serif, Georgia, serif)",
                            fontSize: 15,
                            fontWeight: 700,
                            color: ink,
                            lineHeight: 1.2,
                            marginBottom: 6,
                          }}>
                            {actor.name}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontSize: 10,
                            color: inkFaint,
                            display: "flex",
                            gap: 10,
                            flexWrap: "wrap",
                          }}>
                            <span>{filmCount} film{filmCount !== 1 ? "s" : ""}</span>
                            {latestYear > 0 && <span>Last: {latestYear}</span>}
                            {avgScore != null && (
                              <span style={{ color: green, fontWeight: 700 }}>{avgScore} avg</span>
                            )}
                          </div>
                          {actor.bio && (
                            <p style={{
                              fontFamily: "var(--font-sans, sans-serif)",
                              fontSize: 10,
                              color: inkMuted,
                              lineHeight: 1.5,
                              margin: "8px 0 0",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>
                              {actor.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Actors without nationality */}
        {noCountry.length > 0 && (
          <section style={{ marginBottom: 64 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 28,
              paddingBottom: 12,
              borderBottom: `1.5px solid ${ink}`,
            }}>
              <div style={{ width: 4, height: 28, background: border, flexShrink: 0 }} />
              <h2 style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 22,
                fontWeight: 700,
                color: ink,
                margin: 0,
              }}>
                Other
              </h2>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 24,
            }}>
              {noCountry.map((actor) => (
                <Link key={actor.id} href={`/cast/${actor.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff",
                    border: `1px solid ${border}`,
                    padding: "16px",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: ink,
                      marginBottom: 4,
                    }}>
                      {actor.name}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 10,
                      color: inkFaint,
                    }}>
                      {actor.credits.length} film{actor.credits.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {actors.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "80px 0",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 13,
            color: inkMuted,
          }}>
            No actor profiles yet. Import films to populate this directory.
          </div>
        )}
      </div>
    </div>
  );
}
