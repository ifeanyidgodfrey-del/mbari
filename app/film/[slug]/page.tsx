import { prisma } from "@/lib/prisma";
import { fmtDual } from "@/lib/format";
import CulturalDivider from "@/components/cultural-divider";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const film = await prisma.film.findUnique({ where: { slug: slug } });
  if (!film) return { title: "Film Not Found" };
  return {
    title: `${film.title} (${film.year}) — M'Bari`,
    description: film.tagline ?? film.synopsis.slice(0, 160),
  };
}

const parch = "#F5F0E4";
const ink = "#1C1608";
const gold = "#8B7040";
const green = "#2D7A3A";
const orange = "#C87941";
const border = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const inkSoft = "#3A2E18";
const red = "#C0392B";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 8,
        fontFamily: "var(--font-sans, sans-serif)",
        color: gold,
        letterSpacing: "0.18em",
        textAlign: "center",
        margin: "12px 0 8px",
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  );
}

function ScoreBox({
  label,
  score,
  color,
  sub,
  badge,
  large,
}: {
  label: string;
  score: number | null;
  color: string;
  sub?: string;
  badge?: string;
  large?: boolean;
}) {
  return (
    <div
      style={{
        flex: large ? "1.4" : "1",
        border: `1px solid ${large ? color : border}`,
        padding: "10px 8px",
        textAlign: "center",
        background: large ? `${color}12` : "transparent",
        position: "relative",
      }}
    >
      {badge && (
        <div
          style={{
            fontSize: 7,
            fontFamily: "var(--font-sans, sans-serif)",
            color: color,
            letterSpacing: "0.1em",
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          {badge}
        </div>
      )}
      <div
        style={{
          fontSize: large ? 36 : 28,
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontWeight: 700,
          color: color,
          lineHeight: 1,
        }}
      >
        {score ?? "—"}
      </div>
      <div
        style={{
          fontSize: 8,
          fontFamily: "var(--font-sans, sans-serif)",
          color: inkFaint,
          marginTop: 4,
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 7,
            fontFamily: "var(--font-sans, sans-serif)",
            color: inkFaint,
            marginTop: 2,
            fontStyle: "italic",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export default async function FilmPage({ params }: Props) {
  const { slug } = await params;
  const film = await prisma.film.findUnique({
    where: { slug: slug },
    include: {
      languages: { include: { language: true } },
      cast: true,
      crew: { include: { crewMember: true } },
      availability: true,
      reviews: { include: { user: true } },
    },
  });

  if (!film) notFound();

  const director = film.crew.find((c) => c.role === "Director");
  const aboveTheLine = film.crew.filter((c) =>
    ["Director", "Writer", "Producer"].includes(c.role)
  );
  const craftCrew = film.crew.filter(
    (c) => !["Director", "Writer", "Producer"].includes(c.role)
  );

  const primaryLang = film.languages[0]?.language;
  const langCode = primaryLang?.code ?? "en";

  const width = 480;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 40px",
        background: "#E8E2D4",
        minHeight: "100vh",
      }}
    >
      {/* Back */}
      <div style={{ width: "100%", maxWidth: width, padding: "0 0 12px" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: inkFaint,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          ← Back to M&apos;Bari
        </Link>
      </div>

      {/* Scroll document */}
      <div
        style={{
          width: "100%",
          maxWidth: width,
          background: parch,
          border: `1px solid ${inkSoft}`,
          position: "relative",
          padding: "12px 0",
        }}
      >
        {/* Inner border */}
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: `0.5px solid ${border}`,
            pointerEvents: "none",
          }}
        />
        {/* Left margin */}
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 8,
            bottom: 8,
            borderLeft: "0.3px dashed #3A2E18",
            opacity: 0.12,
          }}
        />
        {/* Right margin */}
        <div
          style={{
            position: "absolute",
            right: 14,
            top: 8,
            bottom: 8,
            borderLeft: "0.3px dashed #3A2E18",
            opacity: 0.12,
          }}
        />

        {/* Content */}
        <div style={{ padding: "0 28px" }}>
          {/* 1. M'BARI mark */}
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: gold,
              letterSpacing: "0.22em",
              fontWeight: 700,
              padding: "8px 0 4px",
            }}
          >
            M&apos;BARI · FILM RECORD
          </div>

          <CulturalDivider langCode={langCode} width={width - 56} />

          {/* 2. Title block */}
          <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 30,
                fontWeight: 700,
                color: ink,
                margin: "0 0 6px",
                lineHeight: 1.1,
              }}
            >
              {film.title}
            </h1>
            {director && (
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                  color: inkMuted,
                  marginBottom: 6,
                }}
              >
                A film by{" "}
                <Link
                  href={`/crew/${director.crewMember.slug}`}
                  style={{ color: gold, textDecoration: "none" }}
                >
                  {director.crewMember.name}
                </Link>
              </div>
            )}
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 10,
                color: inkFaint,
                display: "flex",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span>{film.year}</span>
              <span>·</span>
              <span>{film.country}</span>
              {film.genres.length > 0 && (
                <>
                  <span>·</span>
                  <span>{film.genres.join(" / ")}</span>
                </>
              )}
              {film.runtime && (
                <>
                  <span>·</span>
                  <span>{film.runtime}</span>
                </>
              )}
            </div>
          </div>

          <CulturalDivider langCode={langCode} width={width - 56} />

          {/* 3. Tagline */}
          {film.tagline && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 14,
                  fontStyle: "italic",
                  color: inkSoft,
                  textAlign: "center",
                  lineHeight: 1.6,
                  margin: "12px 0",
                }}
              >
                &ldquo;{film.tagline}&rdquo;
              </p>
              <CulturalDivider langCode={langCode} width={width - 56} />
            </>
          )}

          {/* 4. SCORES */}
          <SectionLabel>SCORES</SectionLabel>
          <div style={{ display: "flex", gap: 6, margin: "8px 0 12px" }}>
            <ScoreBox label="CRITIC" score={film.criticScore} color={green} />
            <ScoreBox
              label="ALL AUDIENCE"
              score={film.audienceScore}
              color={green}
            />
            <ScoreBox
              label="VERIFIED"
              score={film.verifiedScore}
              color={green}
              badge="LEGAL ONLY"
              large
            />
            <ScoreBox
              label="HEAT"
              score={film.heatScore}
              color={orange}
              sub="via X · TikTok · social"
            />
          </div>

          <CulturalDivider langCode={langCode} width={width - 56} />

          {/* 5. THE WORK: synopsis */}
          <SectionLabel>THE WORK</SectionLabel>
          <p
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 12,
              color: inkSoft,
              lineHeight: 1.7,
              margin: "8px 0 12px",
            }}
          >
            {film.synopsis}
          </p>

          <CulturalDivider langCode={langCode} width={width - 56} />

          {/* 6. LANGUAGES */}
          {film.languages.length > 0 && (
            <>
              <SectionLabel>LANGUAGES</SectionLabel>
              <div style={{ margin: "8px 0 12px" }}>
                {film.languages.map((fl) => (
                  <div key={fl.id} style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 3,
                      }}
                    >
                      <Link
                        href={`/language/${fl.language.code}`}
                        style={{
                          fontFamily: "var(--font-sans, sans-serif)",
                          fontSize: 11,
                          color: inkMuted,
                          textDecoration: "none",
                          fontWeight: 600,
                        }}
                      >
                        {fl.language.name}
                        {fl.language.native ? ` — ${fl.language.native}` : ""}
                      </Link>
                      <span
                        style={{
                          fontFamily: "var(--font-sans, sans-serif)",
                          fontSize: 10,
                          color: gold,
                          fontWeight: 700,
                        }}
                      >
                        {fl.percentage}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 3,
                        background: `${border}40`,
                        borderRadius: 2,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${fl.percentage}%`,
                          background: gold,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <CulturalDivider langCode={langCode} width={width - 56} />
            </>
          )}

          {/* 7. THE PLAYERS: cast */}
          {film.cast.length > 0 && (
            <>
              <SectionLabel>THE PLAYERS</SectionLabel>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 8,
                  margin: "8px 0 12px",
                }}
              >
                {film.cast.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      border: `0.5px solid ${border}`,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-sans, sans-serif)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: ink,
                      }}
                    >
                      {c.name}
                    </div>
                    {c.character && (
                      <div
                        style={{
                          fontFamily: "var(--font-sans, sans-serif)",
                          fontSize: 10,
                          color: inkFaint,
                          fontStyle: "italic",
                        }}
                      >
                        as {c.character}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <CulturalDivider langCode={langCode} width={width - 56} />
            </>
          )}

          {/* 8. STAKEHOLDERS: crew */}
          {film.crew.length > 0 && (
            <>
              <SectionLabel>STAKEHOLDERS</SectionLabel>
              <div style={{ margin: "8px 0 12px" }}>
                {aboveTheLine.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    {aboveTheLine.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "5px 0",
                          borderBottom: `0.5px solid ${border}30`,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontSize: 9,
                            color: gold,
                            letterSpacing: "0.1em",
                            fontWeight: 700,
                          }}
                        >
                          {c.role.toUpperCase()}
                        </span>
                        <Link
                          href={`/crew/${c.crewMember.slug}`}
                          style={{
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontSize: 12,
                            color: ink,
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          {c.crewMember.name}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                {craftCrew.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "4px 12px",
                    }}
                  >
                    {craftCrew.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 10,
                          padding: "3px 0",
                        }}
                      >
                        <span
                          style={{
                            color: inkFaint,
                            fontFamily: "var(--font-sans, sans-serif)",
                          }}
                        >
                          {c.role}
                        </span>
                        <Link
                          href={`/crew/${c.crewMember.slug}`}
                          style={{
                            color: inkMuted,
                            textDecoration: "none",
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontWeight: 600,
                          }}
                        >
                          {c.crewMember.name}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <CulturalDivider langCode={langCode} width={width - 56} />
            </>
          )}

          {/* 9. BOX OFFICE */}
          {(film.boxWeekend != null || film.boxCumulative != null) && (
            <>
              <SectionLabel>BOX OFFICE</SectionLabel>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  margin: "8px 0 12px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {film.boxWeekend != null && (
                  <div
                    style={{
                      border: `0.5px solid ${border}`,
                      padding: "10px 16px",
                      textAlign: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontWeight: 700,
                        color: ink,
                      }}
                    >
                      {fmtDual(film.boxWeekend, film.country)}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: inkFaint,
                        letterSpacing: "0.1em",
                        fontFamily: "var(--font-sans, sans-serif)",
                      }}
                    >
                      WEEKEND
                    </div>
                  </div>
                )}
                {film.boxCumulative != null && (
                  <div
                    style={{
                      border: `0.5px solid ${border}`,
                      padding: "10px 16px",
                      textAlign: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontWeight: 700,
                        color: ink,
                      }}
                    >
                      {fmtDual(film.boxCumulative, film.country)}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: inkFaint,
                        letterSpacing: "0.1em",
                        fontFamily: "var(--font-sans, sans-serif)",
                      }}
                    >
                      CUMULATIVE
                    </div>
                  </div>
                )}
                {film.boxWeek != null && (
                  <div
                    style={{
                      border: `0.5px solid ${border}`,
                      padding: "10px 16px",
                      textAlign: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontWeight: 700,
                        color: ink,
                      }}
                    >
                      {film.boxWeek}
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: inkFaint,
                        letterSpacing: "0.1em",
                        fontFamily: "var(--font-sans, sans-serif)",
                      }}
                    >
                      WEEK NO.
                    </div>
                  </div>
                )}
                {film.boxLive && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "10px 14px",
                      border: `0.5px solid ${green}`,
                      background: `${green}12`,
                      color: green,
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: green,
                        display: "inline-block",
                        animation: "pulse 1.4s infinite",
                      }}
                    />
                    LIVE
                  </div>
                )}
              </div>
              <CulturalDivider langCode={langCode} width={width - 56} />
            </>
          )}

          {/* 10. AVAILABILITY */}
          <SectionLabel>AVAILABILITY</SectionLabel>
          <div style={{ margin: "8px 0 12px" }}>
            {film.availability.length === 0 ? (
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                  color: red,
                  fontStyle: "italic",
                  textAlign: "center",
                  padding: "8px 0",
                }}
              >
                Not available — gap alert
              </div>
            ) : (
              (() => {
                const byCountry: Record<
                  string,
                  typeof film.availability
                > = {};
                for (const a of film.availability) {
                  if (!byCountry[a.countryCode])
                    byCountry[a.countryCode] = [];
                  byCountry[a.countryCode].push(a);
                }

                const flags: Record<string, string> = {
                  NG: "🇳🇬",
                  GH: "🇬🇭",
                  ZA: "🇿🇦",
                  KE: "🇰🇪",
                  US: "🇺🇸",
                  GB: "🇬🇧",
                };
                const targetCountries = ["NG", "GH", "ZA", "KE", "US", "GB"];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {targetCountries.map((code) => {
                      const entries = byCountry[code];
                      if (!entries || entries.length === 0) {
                        return (
                          <div
                            key={code}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 0",
                              borderBottom: `0.5px solid ${border}30`,
                            }}
                          >
                            <span style={{ fontSize: 16 }}>
                              {flags[code] ?? code}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-sans, sans-serif)",
                                fontSize: 10,
                                color: red,
                                fontStyle: "italic",
                              }}
                            >
                              Not available — gap alert
                            </span>
                          </div>
                        );
                      }
                      return entries.map((a) => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 0",
                            borderBottom: `0.5px solid ${border}30`,
                          }}
                        >
                          <span style={{ fontSize: 16 }}>
                            {flags[a.countryCode] ?? a.countryCode}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-sans, sans-serif)",
                              fontSize: 11,
                              color: ink,
                              fontWeight: 600,
                            }}
                          >
                            {a.platform}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--font-sans, sans-serif)",
                              fontSize: 9,
                              color: green,
                              border: `0.5px solid ${green}`,
                              padding: "1px 5px",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                            }}
                          >
                            {a.accessType.toUpperCase()}
                          </span>
                        </div>
                      ));
                    })}
                  </div>
                );
              })()
            )}
          </div>

          <CulturalDivider langCode={langCode} width={width - 56} />

          {/* 10b. TRAILER */}
          {film.trailerUrl && (
            <>
              <SectionLabel>TRAILER</SectionLabel>
              <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", margin: "8px 0 12px", background: ink }}>
                <iframe
                  src={film.trailerUrl.replace("watch?v=", "embed/").split("&")[0]}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${film.title} trailer`}
                />
              </div>
              <CulturalDivider langCode={langCode} width={width - 56} />
            </>
          )}

          {/* 11. RATE THIS FILM */}
          <SectionLabel>RATE THIS FILM</SectionLabel>
          <div style={{ margin: "8px 0 20px" }}>
            <p
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: inkMuted,
                textAlign: "center",
                marginBottom: 14,
              }}
            >
              Score 1 – 10. Verify your watch to unlock the verified score.
            </p>

            <div style={{ margin: "0 0 16px" }}>
              <label
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: inkFaint,
                  display: "block",
                  textAlign: "center",
                  marginBottom: 6,
                }}
              >
                YOUR SCORE
              </label>
              <input
                type="range"
                min={1}
                max={10}
                defaultValue={7}
                style={{ width: "100%", accentColor: green }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 9,
                  color: inkFaint,
                  marginTop: 2,
                }}
              >
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 10,
                color: gold,
                letterSpacing: "0.12em",
                fontWeight: 700,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              VERIFY MY WATCH
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              {[
                "Cinema barcode",
                "Ticket upload",
                "Streaming receipt",
                "Distributor code",
              ].map((method) => (
                <button
                  key={method}
                  style={{
                    border: `0.5px solid ${border}`,
                    background: "transparent",
                    padding: "8px 10px",
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    color: inkMuted,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Footer mark */}
          <CulturalDivider langCode={langCode} width={width - 56} />
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: inkFaint,
              letterSpacing: "0.14em",
              padding: "8px 0 4px",
            }}
          >
            M&apos;BARI · mbari.art
          </div>
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
