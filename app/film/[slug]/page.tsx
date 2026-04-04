import { prisma } from "@/lib/prisma";
import { fmtDual } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";
import FilmHeroImage from "@/components/film-hero-image";
import ReportModal from "@/components/report-modal";
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

// ── Design tokens (warm parchment editorial — matches site theme) ─────────────
const D = {
  bgDeep:  "#F5F0E4",
  bg:      "#F0E8D4",
  bgCard:  "#EDE4CE",
  bgElev:  "#E6DBC5",
  bgHover: "#DFD3BA",
  border:  "#D8CDB4",
  borderF: "#E2D8C4",
  hero:    "#1C1608",
  primary: "#3A2E18",
  secondary:"#5A4830",
  muted:   "#8B7A5E",
  dim:     "#A89070",
  accent:  "#8B7040",
  accentH: "#C4A862",
  green:   "#2D7A3A",
  greenS:  "rgba(45,122,58,0.10)",
  red:     "#B83232",
};

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  ET: "Ethiopia", CM: "Cameroon", TZ: "Tanzania", SN: "Senegal",
  CI: "Côte d'Ivoire", EG: "Egypt", MA: "Morocco", UG: "Uganda",
  US: "United States", GB: "United Kingdom", FR: "France", CA: "Canada",
};

// Flat SVG flag via flagcdn.com — consistent cross-platform rendering
function CountryFlag({ code, size = 20 }: { code: string; size?: number }) {
  const lc = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${Math.round(size * 1.4)}x${size}/${lc}.png`}
      srcSet={`https://flagcdn.com/${Math.round(size * 2.8)}x${Math.round(size * 2)}/${lc}.png 2x`}
      width={Math.round(size * 1.4)}
      height={size}
      alt={code}
      style={{ display: "inline-block", verticalAlign: "middle", borderRadius: 1 }}
    />
  );
}

// Normalise access type values from any format (svod, sub, Cinema, ticket…) to display label
const ACCESS_LABEL: Record<string, string> = {
  svod:          "Streaming",
  sub:           "Streaming",
  subscription:  "Streaming",
  streaming:     "Streaming",
  tvod:          "Rental",
  rent:          "Rental",
  rental:        "Rental",
  cinema:        "Cinema",
  ticket:        "Cinema",
  "pay-per-view":"Pay-per-view",
  free:          "Free",
  avod:          "Free",
  download:      "Download",
  vod:           "VOD",
};
function fmtAccess(raw: string) {
  return ACCESS_LABEL[raw.toLowerCase()] ?? raw;
}


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
      <section className="mbari-film-hero">

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

          {/* Upcoming banner */}
          {film.upcoming && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: `${D.accent}22`,
              border: `1px solid ${D.accent}60`,
              color: D.accent,
              fontSize: "0.58rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "0.35rem 0.8rem",
              marginBottom: "1.2rem",
              width: "fit-content",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: D.accent, display: "inline-block" }} />
              Announced · Coming Soon
            </div>
          )}

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

          {/* Director — prominent */}
          {director && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              marginBottom: "2.5rem",
            }}>
              <span style={{
                fontSize: "0.58rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: D.dim,
                fontFamily: "var(--font-sans, sans-serif)",
              }}>
                Director
              </span>
              <span style={{ width: 1, height: 14, background: D.border, display: "inline-block" }} />
              <Link href={`/crew/${director.crewMember.slug}`} style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "1.05rem",
                color: D.accentH,
                fontStyle: "normal",
                textDecoration: "none",
                letterSpacing: "-0.01em",
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
          <FilmHeroImage
            src={film.backdropUrl ?? film.posterUrl ?? null}
            title={film.title}
            bgColor={D.bg}
            bgDeep={D.bgDeep}
            textColor={D.hero}
          />

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
        background: D.bgElev,
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
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: D.muted }}>{label}</div>
            <div style={{ fontSize: "0.6rem", color: D.dim, fontStyle: "italic", marginTop: "0.1rem" }}>{sub}</div>
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
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: D.muted }}>Box Office</div>
            <div style={{ fontSize: "0.6rem", color: D.dim, fontStyle: "italic", marginTop: "0.1rem" }}>
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
              const photoUrl = isLinked ? c.actor.imageUrl : null;
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
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {photoUrl ? (
                      <Image src={photoUrl} alt={name} fill style={{ objectFit: "cover", borderRadius: "50%" }} sizes="38px" />
                    ) : inits}
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
                  padding: "0.85rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  opacity: 0.55,
                }}>
                  <CountryFlag code={code} />
                  <span style={{ fontSize: "0.78rem", color: D.secondary, fontWeight: 500 }}>{COUNTRY_NAME[code] ?? code}</span>
                  <span style={{ fontSize: "0.72rem", color: D.muted, fontStyle: "italic" }}>Not available</span>
                </div>
              );
              return entries.map((a) => (
                <div key={a.id} style={{
                  background: D.bgCard,
                  padding: "0.85rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    {/* Flag */}
                    <CountryFlag code={a.countryCode} />
                    {/* Platform */}
                    <span style={{ fontSize: "0.88rem", color: D.primary, fontWeight: 600 }}>{a.platform}</span>
                    {/* Access type badge */}
                    <span style={{
                      fontSize: "0.58rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: D.green,
                      border: `1px solid ${D.green}60`,
                      padding: "2px 7px",
                      borderRadius: 2,
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontWeight: 600,
                    }}>
                      {fmtAccess(a.accessType)}
                    </span>
                  </div>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: "0.62rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: D.accent,
                      textDecoration: "none",
                      padding: "0.35rem 0.9rem",
                      border: `1px solid ${D.accent}60`,
                      borderRadius: 2,
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontWeight: 600,
                    }}>
                      Watch →
                    </a>
                  ) : (
                    <span style={{ fontSize: "0.62rem", color: D.muted, letterSpacing: "0.06em", fontStyle: "italic" }}>
                      No link
                    </span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: D.muted }}>
            M&apos;Bari Film Archive — {new Date().getFullYear()}
          </div>
          <ReportModal entityType="film" entitySlug={film.slug} entityName={`${film.title} (${film.year})`} />
        </div>
        <div style={{ display: "flex", gap: "1.4rem", flexWrap: "wrap" }}>
          {[["Films", "/films"], ["Cast", "/cast"], ["Crew", "/crew"], ["Events", "/events"]].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: "0.78rem", color: D.secondary, textDecoration: "none", letterSpacing: "0.06em", padding: "4px 0" }}>
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
  border: `1px solid ${D.border}`,
  color: D.muted,
  background: "transparent",
  display: "inline-flex",
  alignItems: "center",
};
