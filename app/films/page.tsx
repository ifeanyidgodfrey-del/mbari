import { prisma } from "@/lib/prisma";
import { fmt, fmtDual } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import FilmFilters from "./FilmFilters";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Film Directory — African Cinema Archive",
  description:
    "Browse and search Nigerian, South African, Kenyan, Ghanaian, Ethiopian and Egyptian films by year, genre, language, and box office performance.",
};

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  ET: "Ethiopia", EG: "Egypt", MA: "Morocco",
  FR: "France", GB: "UK", US: "USA", NZ: "New Zealand", IE: "Ireland",
};

// ISO code → display name for filter pills
const COVERED: { code: string; label: string }[] = [
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "KE", label: "Kenya" },
  { code: "GH", label: "Ghana" },
  { code: "ET", label: "Ethiopia" },
  { code: "EG", label: "Egypt" },
];
// Coming soon — shown faded
const INCOMING = ["Morocco", "Cameroon", "Tanzania", "Senegal", "Côte d'Ivoire"];

const scoreColor = (s: number) =>
  s >= 75 ? "#2D7A3A" : s >= 50 ? "#D4882A" : "#C0392B";

type SearchParams = {
  q?: string;
  year?: string;
  genre?: string;
  country?: string;
  lang?: string;
  sort?: string;
  live?: string;
};

export default async function FilmsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, year, genre, country, sort, live } = await searchParams;

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { synopsis: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
    ];
  }

  if (year) where.year = Number(year);

  if (genre) where.genres = { has: genre };

  if (country) where.country = country;

  if (live === "1") where.boxLive = true;

  // Sort order
  type OrderBy = Record<string, string>;
  let orderBy: OrderBy[] = [{ criticScore: "desc" }];
  if (sort === "boxoffice") orderBy = [{ boxCumulative: "desc" }];
  else if (sort === "year") orderBy = [{ year: "desc" }, { criticScore: "desc" }];
  else if (sort === "popular") orderBy = [{ heatScore: "desc" }, { criticScore: "desc" }];

  const [films, allYears] = await Promise.all([
    prisma.film.findMany({
      where,
      orderBy,
      include: { languages: { include: { language: true } } },
      take: 100,
    }),
    prisma.film.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  const years = allYears.map((f) => f.year);

  // Group by year for box office view
  const showByYear = sort === "boxoffice" && !year && !q;
  const byYear: Record<number, typeof films> = {};
  if (showByYear) {
    for (const film of films) {
      if (!byYear[film.year]) byYear[film.year] = [];
      byYear[film.year].push(film);
    }
  }

  return (
    <div style={{ background: "var(--parch)", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid var(--ink)",
          padding: "14px 20px",
          background: "var(--parch-light)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 2,
              }}
            >
              <Link
                href="/"
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: "var(--ink-faint)",
                  textDecoration: "none",
                }}
              >
                ← M&apos;Bari
              </Link>
            </div>
            {/* Title + country strip on same horizontal level */}
            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "var(--ink)",
                  margin: 0,
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                Film Directory
              </h1>
              {/* Country coverage strip — inline with title, each is a clickable filter */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                borderLeft: "1px solid var(--border)",
                paddingLeft: 20,
                flexWrap: "wrap",
                rowGap: 4,
                columnGap: 2,
              }}>
                {/* "All" clear-filter pill */}
                <Link
                  href="/films"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    padding: "3px 8px",
                    borderRadius: 2,
                    marginRight: 4,
                    background: !country ? "var(--ink)" : "transparent",
                    border: !country ? "none" : "1px solid transparent",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    color: !country ? "var(--parch)" : "var(--ink-faint)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}>All</span>
                </Link>

                {COVERED.map(({ code, label }) => {
                  const isActive = country === code;
                  return (
                    <Link
                      key={code}
                      href={isActive ? "/films" : `/films?country=${code}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                        padding: "3px 9px",
                        borderRadius: 2,
                        background: isActive ? "var(--gold)" : "transparent",
                        border: isActive ? "none" : "1px solid transparent",
                        transition: "background 0.12s",
                      }}
                    >
                      <span style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: isActive ? "rgba(255,255,255,0.7)" : "var(--gold)",
                        flexShrink: 0,
                        display: "inline-block",
                      }} />
                      <span style={{
                        fontFamily: "var(--font-sans, sans-serif)",
                        fontSize: 10,
                        color: isActive ? "#fff" : "var(--ink-muted)",
                        fontWeight: isActive ? 700 : 600,
                      }}>{label}</span>
                    </Link>
                  );
                })}

                {/* Separator */}
                <span style={{ width: 1, height: 12, background: "var(--border)", margin: "0 6px", display: "inline-block", opacity: 0.5 }} />

                {INCOMING.map((c) => (
                  <div key={c} title="Coming soon" style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    whiteSpace: "nowrap",
                    padding: "3px 8px",
                    cursor: "default",
                    opacity: 0.45,
                  }}>
                    <span style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                      display: "inline-block",
                    }} />
                    <span style={{
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 10,
                      color: "var(--ink-faint)",
                    }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: "var(--ink-faint)",
                marginTop: 4,
              }}
            >
              African cinema — all years, all genres
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 9,
              color: "var(--gold)",
              letterSpacing: "0.14em",
              fontWeight: 700,
            }}
          >
            {films.length} TITLES
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        {/* Filters */}
        <Suspense>
          <FilmFilters years={years} total={films.length} />
        </Suspense>

        {films.length === 0 && (
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 13,
              color: "var(--ink-faint)",
              padding: "40px 0",
              textAlign: "center",
            }}
          >
            No films match your filters.
          </div>
        )}

        {/* Box office by year view */}
        {showByYear && Object.keys(byYear).length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {Object.entries(byYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([yr, yearFilms]) => {
                const totalBox = yearFilms.reduce(
                  (acc, f) => acc + (Number(f.boxCumulative ?? 0)),
                  0
                );
                return (
                  <div key={yr}>
                    {/* Year header */}
                    <div
                      style={{
                        borderTop: "2px solid var(--ink)",
                        borderBottom: "0.5px solid var(--border)",
                        padding: "6px 0",
                        marginBottom: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-serif, Georgia, serif)",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {yr}
                      </span>
                      {totalBox > 0 && (
                        <span
                          style={{
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontSize: 11,
                            color: "var(--ink-muted)",
                          }}
                        >
                          Total box office: <strong style={{ color: "var(--gold)" }}>{fmtDual(BigInt(totalBox))}</strong>
                        </span>
                      )}
                    </div>
                    <BoxOfficeYearTable films={yearFilms} />
                  </div>
                );
              })}
          </div>
        ) : (
          /* Default grid view */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 14,
            }}
          >
            {films.map((film) => {
              const score = film.criticScore ?? film.audienceScore ?? film.verifiedScore;
              return (
                <Link
                  key={film.id}
                  href={`/film/${film.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "var(--parch-light)",
                      border: "0.5px solid var(--border)",
                      overflow: "hidden",
                      height: "100%",
                    }}
                  >
                    {/* Poster */}
                    <div
                      style={{
                        height: 220,
                        background: "var(--parch-dark)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {film.posterUrl ? (
                        <Image
                          src={film.posterUrl}
                          alt={film.title}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="180px"
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
                              fontSize: 36,
                              color: "var(--border)",
                              opacity: 0.5,
                            }}
                          >
                            {film.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      {score != null && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 6,
                            right: 6,
                            background: scoreColor(score),
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "var(--font-serif, Georgia, serif)",
                            padding: "2px 7px",
                          }}
                        >
                          {score}
                        </div>
                      )}
                      {film.upcoming && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            background: "#7a6030",
                            color: "#ede8dd",
                            fontSize: 8,
                            fontWeight: 700,
                            fontFamily: "var(--font-sans, sans-serif)",
                            padding: "2px 6px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          UPCOMING
                        </div>
                      )}
                      {!film.upcoming && film.boxLive && (
                        <div
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            background: "#C0392B",
                            color: "#fff",
                            fontSize: 8,
                            fontWeight: 700,
                            fontFamily: "var(--font-sans, sans-serif)",
                            padding: "2px 6px",
                            letterSpacing: "0.1em",
                          }}
                        >
                          IN CINEMAS
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: "8px 10px 10px" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-serif, Georgia, serif)",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink)",
                          lineHeight: 1.2,
                          marginBottom: 3,
                        }}
                      >
                        {film.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-sans, sans-serif)",
                          fontSize: 9,
                          color: "var(--ink-faint)",
                          marginBottom: 4,
                        }}
                      >
                        {film.year} · {COUNTRY_NAME[film.country] ?? film.country}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 3,
                        }}
                      >
                        {film.genres.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            style={{
                              fontFamily: "var(--font-sans, sans-serif)",
                              fontSize: 8,
                              color: "var(--ink-muted)",
                              border: "0.5px solid var(--border)",
                              padding: "1px 5px",
                            }}
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                      {film.boxCumulative != null && (
                        <div
                          style={{
                            fontFamily: "var(--font-sans, sans-serif)",
                            fontSize: 9,
                            color: "var(--gold)",
                            fontWeight: 700,
                            marginTop: 5,
                          }}
                        >
                          {fmtDual(film.boxCumulative, film.country)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BoxOfficeYearTable({ films }: { films: Awaited<ReturnType<typeof prisma.film.findMany>> }) {
  const sorted = [...films].sort(
    (a, b) => Number(b.boxCumulative ?? 0) - Number(a.boxCumulative ?? 0)
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {sorted.map((film, i) => {
        const score = film.criticScore ?? film.audienceScore ?? film.verifiedScore;
        return (
          <Link key={film.id} href={`/film/${film.slug}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 12px",
                borderBottom: "0.5px solid var(--border-light)",
                background: i % 2 === 0 ? "var(--parch-light)" : "var(--parch)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 12,
                  color: "var(--border)",
                  fontWeight: 700,
                  minWidth: 24,
                  textAlign: "right",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  {film.title}
                  {film.boxLive && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 8,
                        background: "#C0392B",
                        color: "#fff",
                        padding: "1px 5px",
                        fontFamily: "var(--font-sans, sans-serif)",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        verticalAlign: "middle",
                      }}
                    >
                      IN CINEMAS
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    color: "var(--ink-faint)",
                    marginTop: 1,
                  }}
                >
                  {COUNTRY_NAME[film.country] ?? film.country} · {film.genres.slice(0, 2).join(", ")}
                </div>
              </div>
              {score != null && (
                <div
                  style={{
                    background: scoreColor(score),
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    padding: "2px 7px",
                    flexShrink: 0,
                  }}
                >
                  {score}
                </div>
              )}
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 12,
                  color: film.boxCumulative != null ? "var(--gold)" : "var(--ink-faint)",
                  fontWeight: 700,
                  minWidth: 110,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {film.boxCumulative != null ? fmtDual(film.boxCumulative, film.country) : "—"}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
