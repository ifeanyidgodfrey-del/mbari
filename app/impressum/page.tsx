import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum — M'Bari",
  description: "M'Bari editorial standards, data methodology, scoring systems, and ranking explanations.",
};

export default function ImpressumPage() {
  const ink      = "#1C1608";
  const inkSoft  = "#3A2E18";
  const inkMuted = "#6B5D3F";
  const inkFaint = "#9C8B6E";
  const gold     = "#8B7040";
  const goldL    = "#C4A862";
  const border   = "#D8CDB4";
  const parch    = "#F5F0E4";
  const parchD   = "#EDE6D6";
  const green    = "#2D7A3A";

  const section = (title: string) => ({
    fontFamily: "var(--font-serif, Georgia, serif)",
    fontSize: "1.25rem",
    fontWeight: 700,
    color: ink,
    marginBottom: "1rem",
    paddingBottom: "0.5rem",
    borderBottom: `1px solid ${border}`,
  } as React.CSSProperties);

  const label = {
    fontFamily: "var(--font-sans, sans-serif)",
    fontSize: "0.62rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: gold,
    fontWeight: 700,
    marginBottom: "0.5rem",
  };

  const body = {
    fontFamily: "var(--font-serif, Georgia, serif)",
    fontSize: "0.95rem",
    lineHeight: 1.85,
    color: inkMuted,
  } as React.CSSProperties;

  return (
    <div style={{ background: parch, minHeight: "100vh", color: ink, fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "4rem 2rem 6rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3.5rem" }}>
          <Link href="/" style={{ fontSize: "0.62rem", color: inkFaint, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>
            ← M&apos;Bari
          </Link>
          <div style={{ fontSize: "0.52rem", letterSpacing: "0.35em", textTransform: "uppercase", color: inkFaint, marginTop: "2rem", marginBottom: "0.8rem" }}>
            Editorial Standards & Data Methodology
          </div>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "2.8rem", fontWeight: 400, color: ink, lineHeight: 1.1, margin: 0 }}>
            Impressum
          </h1>
          <p style={{ ...body, marginTop: "1.2rem", color: inkMuted }}>
            M&apos;Bari is an independent African cinema data platform. This page documents how we collect, rank, and present data — so readers can understand the choices behind every number they see.
          </p>
        </div>

        {/* Box Office Rankings */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={section("Box Office")}>Box Office Rankings</h2>

          <div style={{ background: parchD, border: `1px solid ${border}`, padding: "1.4rem 1.8rem", marginBottom: "1.5rem", borderLeft: `4px solid ${gold}` }}>
            <div style={label}>Ranking Method — ¢ / Capita</div>
            <p style={{ ...body, margin: 0 }}>
              Films are ranked by <strong style={{ color: ink }}>cents earned per person in their home country</strong> — not by raw gross. A film earning ₦500M in Nigeria (population 220M) is compared on equal footing with a film earning R50M in South Africa (population 60M). This approach levels the playing field across countries with vastly different populations and average ticket prices, giving a truer picture of a film&apos;s cultural resonance at home.
            </p>
            <p style={{ ...body, marginTop: "0.8rem", marginBottom: 0, fontSize: "0.85rem", color: inkFaint }}>
              Formula: <em>(cumulative gross in USD equivalent) × 100 ÷ (home country population)</em> = cents per capita
            </p>
          </div>

          <p style={body}>
            Raw weekend and cumulative grosses are shown alongside the per-capita figure. Weekend gross refers to Friday–Sunday takings. Cumulative is the total gross to the reporting date.
          </p>
          <p style={{ ...body, marginTop: "0.8rem" }}>
            Box office data for Nigerian films is sourced from FilmOne Entertainment weekly reports, Genesis Cinema, and Silverbird Cinemas public releases, cross-referenced against NFVCB (National Film and Video Censors Board) data where available. Data for South African, Kenyan, and Ghanaian films comes from local cinema chains and industry press.
          </p>
        </div>

        {/* Scores */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={section("Scores")}>Scoring System</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: border, marginBottom: "1.5rem" }}>
            {[
              { label: "Critics Score", desc: "Weighted average of professional press reviews from Nigerian and pan-African film critics, trade publications, and international outlets covering African cinema." },
              { label: "Audience Score", desc: "General public ratings submitted through M'Bari verified user accounts, weighted to reduce ballot-stuffing. Minimum 25 ratings before a score is published." },
              { label: "Verified Score", desc: "Ratings from users who have demonstrated legal viewership — either a cinema ticket scan, a confirmed streaming subscription, or a purchase receipt. Highest trust rating." },
              { label: "Heat Score", desc: "Social resonance index calculated from X (Twitter), TikTok, and Instagram engagement signals over a rolling 7-day window. Measures cultural conversation, not quality." },
            ].map(({ label: l, desc }) => (
              <div key={l} style={{ background: parch, padding: "1.2rem 1.4rem" }}>
                <div style={{ ...label, marginBottom: "0.5rem" }}>{l}</div>
                <p style={{ ...body, fontSize: "0.85rem", margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>

          <p style={body}>
            All scores are on a 0–100 scale. A score of 75+ is considered strong, 50–74 mixed, below 50 poor. Scores with fewer than the minimum number of ratings display a dash (—) rather than an unreliable figure.
          </p>
        </div>

        {/* Data Sources */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={section("Data Sources")}>Data Sources & Provenance</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, background: border }}>
            {[
              { source: "Film metadata",      origin: "The Movie Database (TMDb) API, supplemented by manual editorial review" },
              { source: "Nigerian box office", origin: "FilmOne weekly press releases, cinema chain statements, NFVCB" },
              { source: "East African BO",     origin: "Kenya Film Commission, local cinema press" },
              { source: "West African BO",     origin: "Ghana Tourism Authority film data, local press" },
              { source: "South African BO",    origin: "Ster-Kinekor, Kinepolis SA public charts" },
              { source: "Score data",          origin: "User-submitted via M'Bari platform" },
              { source: "Cast & crew",         origin: "TMDb, IMDb, manual editorial" },
              { source: "Population figures",  origin: "World Bank 2023 estimates (used for per-capita calculation)" },
            ].map(({ source, origin }) => (
              <div key={source} style={{ background: parch, padding: "0.7rem 1.2rem", display: "flex", gap: "2rem", alignItems: "baseline" }}>
                <span style={{ width: 180, flexShrink: 0, fontSize: "0.75rem", fontWeight: 700, color: inkSoft, fontFamily: "var(--font-sans)" }}>{source}</span>
                <span style={{ fontSize: "0.82rem", color: inkMuted, fontFamily: "var(--font-serif, Georgia, serif)" }}>{origin}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekend Box Office Note */}
        <div style={{ marginBottom: "3rem" }}>
          <h2 style={section("Weekend Figures")}>Weekend Box Office Figures</h2>
          <p style={body}>
            Weekend grosses (Fri–Sun) for Nollywood films are not yet published through a single authoritative source the way Hollywood figures are released through ComScore. M&apos;Bari collects weekend figures from cinema chain press releases, industry WhatsApp bulletins, and verified trade contacts. Where a weekend figure is unavailable, the cell shows a dash. We are working toward a systematic ingestion pipeline for weekly Nollywood box office data as the industry&apos;s reporting infrastructure matures.
          </p>
        </div>

        {/* About */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={section("About M'Bari")}>About M&apos;Bari</h2>
          <p style={body}>
            M&apos;Bari is named after the M&apos;Bari Cultural Centre in Owerri, Nigeria — a landmark of African literary and artistic culture. The platform is independent and editorially self-funded. We have no commercial relationships with distributors or studios that influence scores or rankings.
          </p>
          <p style={{ ...body, marginTop: "0.8rem" }}>
            For data corrections, press enquiries, or licensing, contact{" "}
            <a href="mailto:data@mbari.art" style={{ color: gold }}>data@mbari.art</a>.
          </p>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.62rem", color: inkFaint, letterSpacing: "0.1em" }}>
            M&apos;Bari Film Archive — Last updated {new Date().getFullYear()}
          </span>
          <div style={{ display: "flex", gap: "1.4rem" }}>
            {[["Films", "/films"], ["Cast", "/cast"], ["Crew", "/crew"]].map(([label, href]) => (
              <Link key={href} href={href} style={{ fontSize: "0.62rem", color: inkFaint, textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
