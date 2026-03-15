import { prisma } from "@/lib/prisma";
import { fmtDual } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crew = await prisma.crewMember.findUnique({ where: { slug } });
  if (!crew) return { title: "Crew Not Found" };
  return {
    title: `${crew.name} — M'Bari`,
    description: crew.bio?.slice(0, 160) ?? `${crew.name} on M'Bari`,
  };
}

const ink = "#1C1608";
const gold = "#8B7040";
const border = "#D8CDB4";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const green = "#2D7A3A";

const scoreColor = (s: number) =>
  s >= 75 ? green : s >= 50 ? "#D4882A" : "#B83232";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  FR: "France", GB: "UK", US: "USA",
};

export default async function CrewPage({ params }: Props) {
  const { slug } = await params;
  const crew = await prisma.crewMember.findUnique({
    where: { slug },
    include: {
      credits: {
        include: { film: true },
        orderBy: { film: { year: "desc" } },
      },
    },
  });

  if (!crew) notFound();

  const totalFilms = crew.credits.length;
  const scores = crew.credits
    .map((c) => c.film.criticScore)
    .filter((s): s is number => s != null);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  const combinedBox = crew.credits
    .map((c) => c.film.boxCumulative)
    .filter((b): b is bigint => b != null)
    .reduce((a, b) => a + b, BigInt(0));

  // Group credits chronologically by year (desc)
  const byYear: Record<number, typeof crew.credits> = {};
  for (const credit of crew.credits) {
    const yr = credit.film.year;
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(credit);
  }
  const years = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>

      {/* ── Top ribbon — 2x elongated ─────────────────────────────────────── */}
      <header style={{ background: ink, position: "relative", overflow: "hidden" }}>
        {/* Decorative gold line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: gold,
          }}
        />

        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "88px 32px 96px",
            display: "flex",
            gap: 40,
            alignItems: "flex-end",
          }}
        >
          {/* Photo */}
          <div
            style={{
              width: 140,
              height: 168,
              flexShrink: 0,
              border: `2px solid ${gold}40`,
              overflow: "hidden",
              position: "relative",
              background: "#2A2018",
            }}
          >
            {crew.imageUrl ? (
              <Image
                src={crew.imageUrl}
                alt={crew.name}
                fill
                style={{ objectFit: "cover", objectPosition: "top" }}
                sizes="140px"
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
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 52,
                    color: `${gold}60`,
                    fontWeight: 700,
                  }}
                >
                  {crew.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Link
              href="/crew"
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 9,
                color: gold,
                textDecoration: "none",
                letterSpacing: "0.16em",
                fontWeight: 700,
                display: "block",
                marginBottom: 16,
              }}
            >
              ← CREW DIRECTORY
            </Link>

            {/* Roles */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {crew.roles.map((role) => (
                <span
                  key={role}
                  style={{
                    border: `0.5px solid ${gold}60`,
                    fontSize: 8,
                    fontFamily: "var(--font-sans, sans-serif)",
                    color: gold,
                    padding: "2px 8px",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                  }}
                >
                  {role.toUpperCase()}
                </span>
              ))}
              {crew.type === "craft" && (
                <span
                  style={{
                    background: green,
                    color: "#fff",
                    fontSize: 8,
                    fontFamily: "var(--font-sans, sans-serif)",
                    letterSpacing: "0.12em",
                    padding: "2px 8px",
                    fontWeight: 700,
                  }}
                >
                  CRAFT PROFESSIONAL
                </span>
              )}
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "clamp(28px, 4vw, 46px)",
                fontWeight: 700,
                color: "#FFFDF7",
                margin: 0,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {crew.name}
            </h1>

            {/* Active years */}
            {years.length > 0 && (
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                  color: `${gold}99`,
                  marginTop: 8,
                  letterSpacing: "0.04em",
                }}
              >
                Active {years[years.length - 1]}–{years[0]}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px 80px" }}>

        {/* Bio */}
        {crew.bio && (
          <div style={{ marginBottom: 48 }}>
            <p
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 15,
                color: inkMuted,
                lineHeight: 1.8,
                margin: 0,
                maxWidth: 640,
              }}
            >
              {crew.bio}
            </p>
          </div>
        )}

        {/* Available banner */}
        {crew.available && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 40,
              padding: "16px 20px",
              border: `1px solid ${green}`,
              background: `${green}08`,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: green,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  marginBottom: 2,
                }}
              >
                OPEN TO WORK
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 12,
                  color: inkMuted,
                }}
              >
                Available for new film and television projects
              </div>
            </div>
            <button
              style={{
                background: green,
                color: "#fff",
                border: "none",
                padding: "8px 18px",
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 10,
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              CONTACT
            </button>
          </div>
        )}

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 0,
            border: `1px solid ${border}`,
            marginBottom: 56,
          }}
        >
          {[
            { label: "FILMS", value: totalFilms },
            { label: "AVG SCORE", value: avgScore ?? "—" },
            {
              label: "COMBINED BOX OFFICE",
              value: combinedBox > BigInt(0) ? fmtDual(combinedBox) : "—",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                padding: "20px 12px",
                borderRight: i < 2 ? `1px solid ${border}` : "none",
                background: "#fff",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: i === 2 ? 18 : 32,
                  fontWeight: 700,
                  color: ink,
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 8,
                  color: inkFaint,
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Awards */}
        {crew.awards.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 9,
                color: gold,
                letterSpacing: "0.18em",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              AWARDS & RECOGNITION
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {crew.awards.map((award, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 13,
                    color: inkMuted,
                    padding: "10px 14px",
                    borderLeft: `3px solid ${gold}`,
                    background: "#FDFAF4",
                  }}
                >
                  {award}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filmography — chronological timeline */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 28,
              paddingBottom: 12,
              borderBottom: `1.5px solid ${ink}`,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 22,
                fontWeight: 700,
                color: ink,
                margin: 0,
              }}
            >
              Filmography
            </h2>
            <span
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 10,
                color: inkFaint,
                letterSpacing: "0.1em",
              }}
            >
              {totalFilms} {totalFilms === 1 ? "credit" : "credits"} · chronological
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {years.map((year) => (
              <div key={year} style={{ display: "flex", gap: 0, marginBottom: 32 }}>
                {/* Year marker */}
                <div
                  style={{
                    width: 72,
                    flexShrink: 0,
                    paddingTop: 18,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 18,
                      fontWeight: 700,
                      color: gold,
                    }}
                  >
                    {year}
                  </div>
                </div>

                {/* Credits for that year */}
                <div style={{ flex: 1, borderLeft: `1px solid ${border}`, paddingLeft: 24 }}>
                  {byYear[year].map((credit, i) => (
                    <div
                      key={credit.id}
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "flex-start",
                        padding: "16px 0",
                        borderBottom:
                          i < byYear[year].length - 1
                            ? `0.5px solid ${border}`
                            : "none",
                      }}
                    >
                      {/* Film poster thumb */}
                      <div
                        style={{
                          width: 44,
                          height: 64,
                          flexShrink: 0,
                          background: "#F0EAD8",
                          position: "relative",
                          overflow: "hidden",
                          border: `0.5px solid ${border}`,
                        }}
                      >
                        {credit.film.posterUrl ? (
                          <Image
                            src={credit.film.posterUrl}
                            alt={credit.film.title}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="44px"
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
                                fontFamily: "var(--font-serif, Georgia, serif)",
                                fontSize: 18,
                                color: border,
                              }}
                            >
                              {credit.film.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/film/${credit.film.slug}`}
                          style={{
                            fontFamily: "var(--font-serif, Georgia, serif)",
                            fontSize: 17,
                            fontWeight: 700,
                            color: ink,
                            textDecoration: "none",
                            display: "block",
                            marginBottom: 4,
                            lineHeight: 1.2,
                          }}
                        >
                          {credit.film.title}
                        </Link>
                        <div
                          style={{
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontSize: 11,
                            color: inkFaint,
                            marginBottom: 6,
                          }}
                        >
                          {credit.role}
                          {credit.film.country && (
                            <span style={{ marginLeft: 8 }}>
                              · {COUNTRY_NAME[credit.film.country] ?? credit.film.country}
                            </span>
                          )}
                        </div>
                        {credit.film.genres.length > 0 && (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {credit.film.genres.slice(0, 2).map((g) => (
                              <span
                                key={g}
                                style={{
                                  fontFamily: "var(--font-sans, sans-serif)",
                                  fontSize: 8,
                                  color: inkMuted,
                                  border: `0.5px solid ${border}`,
                                  padding: "1px 6px",
                                  letterSpacing: "0.06em",
                                }}
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Score + box office */}
                      <div
                        style={{
                          flexShrink: 0,
                          textAlign: "right",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "flex-end",
                        }}
                      >
                        {credit.film.criticScore != null && (
                          <span
                            style={{
                              background: scoreColor(credit.film.criticScore),
                              color: "#fff",
                              fontSize: 14,
                              fontWeight: 700,
                              fontFamily: "var(--font-serif, Georgia, serif)",
                              padding: "3px 9px",
                              display: "inline-block",
                            }}
                          >
                            {credit.film.criticScore}
                          </span>
                        )}
                        {credit.film.boxCumulative != null && (
                          <div
                            style={{
                              fontFamily: "var(--font-sans, sans-serif)",
                              fontSize: 10,
                              color: gold,
                              fontWeight: 700,
                            }}
                          >
                            {fmtDual(credit.film.boxCumulative, credit.film.country)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
