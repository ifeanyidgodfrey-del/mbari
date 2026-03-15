import { prisma } from "@/lib/prisma";
import { fmtDual } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const film = await prisma.film.findUnique({ where: { slug } });
  if (!film) return { title: "Film Not Found" };
  return {
    title: `${film.title} (${film.year}) — M'Bari`,
    description: film.tagline ?? film.synopsis.slice(0, 160),
  };
}

// ── Design tokens (warm editorial — midway between parchment and pitch black) ─
const D = {
  bgDeep:  "#1a1812",
  bg:      "#222018",
  bgCard:  "#2a2720",
  bgElev:  "#333028",
  bgHover: "#3a3730",
  border:  "#4a4538",
  borderF: "#3a3530",
  hero:    "#ede8dd",
  primary: "#c8c2b5",
  secondary:"#9a9488",
  muted:   "#6a6560",
  dim:     "#524e48",
  accent:  "#b8985e",
  accentH: "#d4b870",
  green:   "#5a7a5a",
  greenS:  "rgba(90,122,90,0.14)",
  red:     "#7a3a3a",
};

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  ET: "Ethiopia", CM: "Cameroon", TZ: "Tanzania", SN: "Senegal",
  CI: "Côte d'Ivoire", EG: "Egypt", MA: "Morocco", UG: "Uganda",
};


function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function scoreColor(s: number) {
  return s >= 75 ? D.green : s >= 50 ? "#8a6a30" : D.red;
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function FilmPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab = "cast" } = await searchParams;

  const film = await prisma.film.findUnique({
    where: { slug },
    include: {
      languages: { include: { language: true } },
      cast: true,
      actorCredits: { include: { actor: true }, orderBy: { order: "asc" } },
      crew: { include: { crewMember: true } },
      availability: true,
      reviews: { include: { user: true } },
    },
  });

  if (!film) notFound();

  const director = film.crew.find((c) => c.role === "Director");
  const aboveTheLine = film.crew.filter((c) =>
    ["Director", "Writer", "Screenplay", "Producer", "Executive Producer"].includes(c.role)
  );
  const craftCrew = film.crew.filter(
    (c) => !["Director", "Writer", "Screenplay", "Producer", "Executive Producer"].includes(c.role)
  );

  const primaryLang = film.languages[0];
  const castList = film.actorCredits.length > 0 ? film.actorCredits : film.cast;

  // Group crew into categories for tab view
  const crewGroups: Record<string, typeof film.crew> = {};
  for (const c of film.crew) {
    const cat =
      ["Director", "Writer", "Screenplay"].includes(c.role) ? "Direction & Writing" :
      ["Producer", "Executive Producer"].includes(c.role) ? "Producers" :
      "Technical";
    if (!crewGroups[cat]) crewGroups[cat] = [];
    crewGroups[cat].push(c);
  }
  const crewOrder = ["Direction & Writing", "Producers", "Technical"];

  // Availability grouped by country
  const byCountry: Record<string, typeof film.availability> = {};
  for (const a of film.availability) {
    if (!byCountry[a.countryCode]) byCountry[a.countryCode] = [];
    byCountry[a.countryCode].push(a);
  }
  const targetCountries = ["NG", "GH", "ZA", "KE", "US", "GB"];

  const tabLink = (t: string) => `/film/${slug}?tab=${t}`;

  return (
    <div style={{ background: D.bgDeep, minHeight: "100vh", color: D.primary, fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* ── Grain texture ─────────────────────────────────────────────────── */}
      <style>{`
        .film-grain::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 10000;
          opacity: 0.25;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.08'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }
      `}</style>
      <div className="film-grain">

      {/* ── Hero: 2-column split ───────────────────────────────────────────── */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "88vh",
      }}>

        {/* Left: metadata */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "5rem 4rem 5rem 3rem",
          position: "relative",
        }}>
          {/* Vertical divider */}
          <div style={{
            position: "absolute",
            right: 0,
            top: "12%",
            bottom: "12%",
            width: 1,
            background: `linear-gradient(to bottom, transparent, ${D.border}, transparent)`,
          }} />

          {/* Breadcrumb */}
          <Link href="/films" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: D.muted,
            fontSize: "0.62rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textDecoration: "none",
            marginBottom: "3rem",
          }}>
            ← Back to catalogue
          </Link>

          {/* Eyebrow */}
          <div style={{
            fontSize: "0.52rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: D.dim,
            marginBottom: "1.5rem",
            fontWeight: 400,
          }}>
            M&apos;Bari · Film Record
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: "clamp(2.8rem, 5.5vw, 4.8rem)",
            fontWeight: 400,
            lineHeight: 1.02,
            color: D.hero,
            letterSpacing: "-0.01em",
            marginBottom: "0.7rem",
          }}>
            {film.title}
          </h1>

          {/* Director */}
          {director && (
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "0.95rem",
              fontStyle: "italic",
              color: D.secondary,
              marginBottom: "2.5rem",
            }}>
              A film by{" "}
              <Link href={`/crew/${director.crewMember.slug}`} style={{
                color: D.accent,
                fontStyle: "normal",
                textDecoration: "none",
                borderBottom: `1px solid transparent`,
              }}>
                {director.crewMember.name}
              </Link>
            </div>
          )}

          {/* Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "2.2rem" }}>
            <span style={pill}>{film.year}</span>
            <span style={pill}>{COUNTRY_NAME[film.country] ?? film.country}</span>
            {film.genres.length > 0 && (
              <span style={pill}>{film.genres.join(" / ")}</span>
            )}
            {film.runtime && <span style={pill}>{film.runtime}</span>}
            {film.rated && <span style={pill}>{film.rated}</span>}
            {film.boxLive && (
              <span style={{ ...pill, borderColor: D.green, color: D.green, background: D.greenS }}>
                <span style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: D.green,
                  marginRight: 5,
                  animation: "pulse 1.4s infinite",
                }} />
                In Cinemas
              </span>
            )}
          </div>

          {/* Synopsis */}
          <p style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: "0.9rem",
            lineHeight: 1.85,
            color: D.secondary,
            maxWidth: 460,
            margin: 0,
          }}>
            {film.synopsis}
          </p>

          {/* Tagline */}
          {film.tagline && (
            <p style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "0.82rem",
              fontStyle: "italic",
              color: D.muted,
              marginTop: "1.5rem",
              maxWidth: 420,
            }}>
              &ldquo;{film.tagline}&rdquo;
            </p>
          )}

          {/* Language strip */}
          {primaryLang && (
            <div style={{ marginTop: "2.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                <span style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim }}>Language</span>
                <span style={{ fontSize: "0.72rem", color: D.muted }}>
                  {primaryLang.language.name}
                  {primaryLang.language.native ? ` — ${primaryLang.language.native}` : ""}
                  {" "}<strong style={{ color: D.secondary }}>{primaryLang.percentage}%</strong>
                </span>
              </div>
              <div style={{ height: 2, background: D.borderF, borderRadius: 1, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${primaryLang.percentage}%`, background: D.accent, borderRadius: 1 }} />
              </div>
            </div>
          )}
        </div>

        {/* Right: poster / backdrop */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          background: D.bg,
        }}>
          {film.backdropUrl || film.posterUrl ? (
            <>
              <Image
                src={film.backdropUrl ?? film.posterUrl!}
                alt={film.title}
                fill
                style={{
                  objectFit: "cover",
                  objectPosition: film.backdropUrl ? "center" : "top",
                }}
                sizes="50vw"
                priority
              />
              {/* Fades */}
              <div style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to right, ${D.bgDeep} 0%, transparent 20%),
                             linear-gradient(to top, ${D.bgDeep} 0%, transparent 25%)`,
              }} />
            </>
          ) : (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "8rem",
                fontStyle: "italic",
                color: D.border,
                lineHeight: 1,
              }}>
                {film.title.charAt(0)}
              </div>
              <div style={{ fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase", color: D.dim, marginTop: "0.5rem" }}>
                Film Still
              </div>
            </div>
          )}

          {/* Awards badge */}
          {film.awards.length > 0 && (
            <div style={{
              position: "absolute",
              top: "1.5rem",
              right: "1.5rem",
              background: `${D.bgDeep}CC`,
              backdropFilter: "blur(8px)",
              border: `1px solid ${D.accent}40`,
              padding: "0.5rem 0.9rem",
            }}>
              <div style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: D.accent, marginBottom: 3 }}>
                {film.awards.length} Award{film.awards.length !== 1 ? "s" : ""}
              </div>
              <div style={{ fontSize: "0.68rem", color: D.secondary, fontFamily: "var(--font-serif, Georgia, serif)" }}>
                {film.awards[0]}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Score bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex",
        borderTop: `1px solid ${D.borderF}`,
        borderBottom: `1px solid ${D.borderF}`,
        background: "#161614",
      }}>
        {[
          { label: "Critics", value: film.criticScore, sub: "press + professional" },
          { label: "All Audience", value: film.audienceScore, sub: "general public" },
          { label: "Verified", value: film.verifiedScore, sub: "legal watch only" },
          { label: "Heat", value: film.heatScore, sub: "social · X · TikTok" },
        ].map(({ label, value, sub }, i) => (
          <div key={label} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.4rem 1rem",
            borderRight: i < 3 ? `1px solid ${D.borderF}` : "none",
          }}>
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "1.35rem",
              color: value != null ? scoreColor(value) : D.dim,
              marginBottom: "0.15rem",
            }}>
              {value != null ? value : <span style={{ display: "inline-block", width: 18, height: 2, background: D.dim, borderRadius: 1, verticalAlign: "middle" }} />}
            </div>
            <div style={{ fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase", color: D.muted }}>{label}</div>
            <div style={{ fontSize: "0.48rem", color: D.dim, fontStyle: "italic", marginTop: "0.1rem" }}>{sub}</div>
          </div>
        ))}
        {/* Box office cell */}
        {film.boxCumulative != null && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.4rem 1rem",
          }}>
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: "1rem",
              color: D.accent,
              marginBottom: "0.15rem",
            }}>
              {fmtDual(film.boxCumulative, film.country)}
            </div>
            <div style={{ fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase", color: D.muted }}>Box Office</div>
            <div style={{ fontSize: "0.48rem", color: D.dim, fontStyle: "italic", marginTop: "0.1rem" }}>
              {film.boxLive ? "in cinemas" : "cumulative"}
              {film.boxWeek ? ` · wk ${film.boxWeek}` : ""}
            </div>
          </div>
        )}
      </div>

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "3rem 3rem 0" }}>
        <div style={{
          display: "flex",
          gap: "2.5rem",
          borderBottom: `1px solid ${D.borderF}`,
          marginBottom: "2.5rem",
        }}>
          {[
            ["cast", "The Players"],
            ["crew", "Stakeholders"],
            ["about", "About"],
            ...(film.trailerUrl ? [["trailer", "Trailer"]] : []),
          ].map(([t, label]) => (
            <Link
              key={t}
              href={tabLink(t)}
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: "0.7rem",
                fontWeight: tab === t ? 500 : 400,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: tab === t ? D.hero : D.muted,
                padding: "0 0 0.8rem",
                cursor: "pointer",
                textDecoration: "none",
                position: "relative",
                borderBottom: tab === t ? `1px solid ${D.accent}` : "1px solid transparent",
                marginBottom: -1,
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── THE PLAYERS ─────────────────────────────────────────────────── */}
        {tab === "cast" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            background: D.borderF,
            border: `1px solid ${D.borderF}`,
            borderRadius: 3,
            overflow: "hidden",
            marginBottom: "3rem",
          }}>
            {castList.length === 0 ? (
              <div style={{ gridColumn: "1/-1", padding: "2rem", textAlign: "center", color: D.muted, fontSize: "0.8rem", background: D.bgCard }}>
                No cast information available.
              </div>
            ) : castList.map((c) => {
              const isLinked = "actor" in c;
              const name = isLinked ? c.actor.name : c.name;
              const character = c.character;
              const href = isLinked ? `/cast/${c.actor.slug}` : null;
              const inits = initials(name);

              const inner = (
                <div style={{
                  background: D.bgCard,
                  padding: "1.15rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}>
                  <div style={{
                    width: 38, height: 38,
                    borderRadius: "50%",
                    background: D.bgElev,
                    border: `1px solid ${D.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: "0.75rem",
                    color: D.muted,
                    flexShrink: 0,
                    fontWeight: 400,
                  }}>
                    {inits}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: "0.92rem",
                      color: isLinked ? D.accentH : D.primary,
                      marginBottom: "0.08rem",
                    }}>
                      {name}
                    </div>
                    {character && (
                      <div style={{ fontSize: "0.68rem", color: D.muted, fontWeight: 300 }}>
                        as <em style={{ fontStyle: "italic", color: D.accent }}>{character}</em>
                      </div>
                    )}
                  </div>
                </div>
              );

              return href ? (
                <Link key={c.id} href={href} style={{ textDecoration: "none" }}>
                  {inner}
                </Link>
              ) : (
                <div key={c.id}>{inner}</div>
              );
            })}
          </div>
        )}

        {/* ── STAKEHOLDERS ────────────────────────────────────────────────── */}
        {tab === "crew" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 3rem",
            marginBottom: "3rem",
          }}>
            {film.crew.length === 0 ? (
              <div style={{ gridColumn: "1/-1", color: D.muted, fontSize: "0.8rem", textAlign: "center", padding: "2rem 0" }}>
                No crew information available.
              </div>
            ) : crewOrder.map((cat) => {
              const members = crewGroups[cat];
              if (!members?.length) return null;
              return (
                <div key={cat} style={{ paddingBottom: "2rem" }}>
                  <div style={{
                    fontSize: "0.52rem",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: D.dim,
                    marginBottom: "0.9rem",
                    paddingBottom: "0.45rem",
                    borderBottom: `1px solid ${D.borderF}`,
                  }}>
                    {cat}
                  </div>
                  {members.map((c) => (
                    <div key={c.id} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      padding: "0.5rem 0",
                    }}>
                      <span style={{ fontSize: "0.65rem", letterSpacing: "0.06em", textTransform: "uppercase", color: D.muted, fontWeight: 300 }}>
                        {c.role}
                      </span>
                      <Link href={`/crew/${c.crewMember.slug}`} style={{
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        fontSize: "0.85rem",
                        color: D.secondary,
                        textDecoration: "none",
                      }}>
                        {c.crewMember.name}
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ABOUT ───────────────────────────────────────────────────────── */}
        {tab === "about" && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "3rem" }}>
              {/* Synopsis */}
              <div>
                <div style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: "0.7rem" }}>
                  Synopsis
                </div>
                <p style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "0.88rem", lineHeight: 1.85, color: D.secondary }}>
                  {film.synopsis}
                </p>
                {film.tagline && (
                  <p style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "0.8rem", fontStyle: "italic", color: D.muted, marginTop: "1rem" }}>
                    &ldquo;{film.tagline}&rdquo;
                  </p>
                )}
              </div>
              {/* Details */}
              <div>
                <div style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: "0.7rem" }}>
                  Details
                </div>
                {(
                  [
                    ["Year", String(film.year)],
                    ["Country", COUNTRY_NAME[film.country] ?? film.country],
                    film.runtime ? ["Runtime", film.runtime] : null,
                    film.genres.length ? ["Genre", film.genres.join(" / ")] : null,
                    film.rated ? ["Rating", film.rated] : null,
                    primaryLang ? ["Language", `${primaryLang.language.name} (${primaryLang.percentage}%)`] : null,
                    ["Status", film.boxLive ? "In Cinemas" : "In Release"],
                  ] as ([string, string] | null)[]
                ).filter((x): x is [string, string] => x !== null).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: `1px solid ${D.borderF}` }}>
                    <span style={{ fontSize: "0.68rem", color: D.muted }}>{k}</span>
                    <span style={{ fontSize: "0.78rem", color: D.primary }}>{v}</span>
                  </div>
                ))}

                {/* Languages breakdown */}
                {film.languages.length > 1 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <div style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: "0.7rem" }}>
                      Languages
                    </div>
                    {film.languages.map((fl) => (
                      <div key={fl.id} style={{ marginBottom: "0.7rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                          <Link href={`/language/${fl.language.code}`} style={{ fontSize: "0.78rem", color: D.secondary, textDecoration: "none" }}>
                            {fl.language.name}
                          </Link>
                          <span style={{ fontSize: "0.68rem", color: D.accent }}>{fl.percentage}%</span>
                        </div>
                        <div style={{ height: 2, background: D.borderF, borderRadius: 1 }}>
                          <div style={{ height: "100%", width: `${fl.percentage}%`, background: D.accent, borderRadius: 1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Awards */}
                {film.awards.length > 0 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <div style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: "0.7rem" }}>
                      Awards
                    </div>
                    {film.awards.map((a, i) => (
                      <div key={i} style={{ fontSize: "0.8rem", color: D.secondary, padding: "0.4rem 0", borderBottom: `1px solid ${D.borderF}`, fontFamily: "var(--font-serif, Georgia, serif)" }}>
                        {a}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Box office */}
            {(film.boxWeekend != null || film.boxCumulative != null) && (
              <div>
                <div style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: "1rem" }}>
                  Box Office
                </div>
                <div style={{ display: "flex", gap: 1, background: D.borderF }}>
                  {film.boxWeekend != null && (
                    <div style={{ flex: 1, background: D.bgCard, padding: "1.2rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.2rem", color: D.hero }}>{fmtDual(film.boxWeekend, film.country)}</div>
                      <div style={{ fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase", color: D.muted, marginTop: 4 }}>Weekend</div>
                    </div>
                  )}
                  {film.boxCumulative != null && (
                    <div style={{ flex: 1, background: D.bgCard, padding: "1.2rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.2rem", color: D.hero }}>{fmtDual(film.boxCumulative, film.country)}</div>
                      <div style={{ fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase", color: D.muted, marginTop: 4 }}>Cumulative</div>
                    </div>
                  )}
                  {film.boxWeek != null && (
                    <div style={{ flex: 1, background: D.bgCard, padding: "1.2rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.2rem", color: D.hero }}>Wk {film.boxWeek}</div>
                      <div style={{ fontSize: "0.52rem", letterSpacing: "0.16em", textTransform: "uppercase", color: D.muted, marginTop: 4 }}>Week No.</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TRAILER ─────────────────────────────────────────────────────── */}
        {tab === "trailer" && film.trailerUrl && (
          <div style={{ marginBottom: "3rem" }}>
            <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
              <iframe
                src={film.trailerUrl.replace("watch?v=", "embed/").split("&")[0]}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${film.title} trailer`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Availability ──────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 940, margin: "0 auto 0", padding: "0 3rem 5rem" }}>
        <div style={{ fontSize: "0.52rem", letterSpacing: "0.22em", textTransform: "uppercase", color: D.dim, marginBottom: "1rem" }}>
          Where to Watch
        </div>
        {film.availability.length === 0 ? (
          <div style={{
            border: `1px solid ${D.borderF}`,
            borderRadius: 3,
            padding: "1.3rem 1.8rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: D.bgCard,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: D.red, boxShadow: `0 0 6px ${D.red}50` }} />
              <span style={{ fontSize: "0.78rem", color: D.secondary }}>
                <strong style={{ color: D.primary }}>Not available</strong> — geo alert
              </span>
            </div>
            <span style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: D.accent,
              padding: "0.35rem 0.9rem",
              border: `1px solid ${D.accent}`,
              borderRadius: 2,
            }}>
              Request Access
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: D.borderF }}>
            {targetCountries.map((code) => {
              const entries = byCountry[code];
              if (!entries?.length) return (
                <div key={code} style={{
                  background: D.bgCard,
                  padding: "0.9rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <span style={{ fontSize: "1rem" }}>{COUNTRY_NAME[code] ?? code}</span>
                    <span style={{ fontSize: "0.78rem", color: D.muted, fontStyle: "italic" }}>Not available</span>
                  </div>
                </div>
              );
              return entries.map((a) => (
                <div key={a.id} style={{
                  background: D.bgCard,
                  padding: "0.9rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: D.green, boxShadow: `0 0 6px ${D.green}40` }} />
                    <span style={{ fontSize: "1rem" }}>{FLAGS[a.countryCode] ?? a.countryCode}</span>
                    <span style={{ fontSize: "0.82rem", color: D.primary, fontWeight: 500 }}>{a.platform}</span>
                    <span style={{
                      fontSize: "0.58rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: D.green,
                      border: `1px solid ${D.green}60`,
                      padding: "1px 6px",
                      borderRadius: 2,
                    }}>
                      {a.accessType}
                    </span>
                  </div>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: D.accent,
                      textDecoration: "none",
                      padding: "0.35rem 0.9rem",
                      border: `1px solid ${D.accent}60`,
                      borderRadius: 2,
                    }}>
                      Watch
                    </a>
                  )}
                </div>
              ));
            })}
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${D.borderF}`,
        padding: "2.2rem 3rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 940,
        margin: "0 auto",
      }}>
        <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: D.dim }}>
          M&apos;Bari Film Archive — {new Date().getFullYear()}
        </div>
        <div style={{ display: "flex", gap: "1.4rem" }}>
          {[["Films", "/films"], ["Cast", "/cast"], ["Crew", "/crew"], ["Events", "/events"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: "0.58rem", color: D.muted, textDecoration: "none", letterSpacing: "0.06em" }}>
              {label}
            </Link>
          ))}
        </div>
      </footer>

      </div>
    </div>
  );
}

// ── Shared style objects ──────────────────────────────────────────────────────
const pill: React.CSSProperties = {
  fontSize: "0.6rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "0.28rem 0.7rem",
  borderRadius: 2,
  border: "1px solid #2a2a26",
  color: "#5a5650",
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
};
