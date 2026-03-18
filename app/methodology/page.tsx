import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scoring Methodology — M'Bari",
  description:
    "How M'Bari calculates its four film scores: Critics, Audience, Verified, and Heat. A transparent methodology for African cinema data.",
};

const D = {
  bg: "#F5F0E4",
  bgCard: "#EDE4CE",
  border: "#D8CDB4",
  ink: "#1C1608",
  primary: "#3A2E18",
  secondary: "#5A4830",
  muted: "#8B7A5E",
  gold: "#8B7040",
  goldL: "#C4A862",
  green: "#2D7A3A",
  red: "#B83232",
  amber: "#C4882A",
};

const SCORES = [
  {
    label: "Critics Score",
    badge: "C",
    color: D.green,
    tagline: "Press + professional critics",
    description:
      "Aggregated from accredited film critics, entertainment journalists, and professional reviewers covering African cinema. Sources include Nigerian print and digital press, pan-African film publications, and international critics covering African releases. A review must include a scorable assessment — starred ratings, numeric grades, or clear positive/mixed/negative qualifications — to be counted.",
    weight: "Each counted source carries equal weight. Minimum 3 qualifying reviews before a score publishes.",
    range: "0 – 100. 75+ = Fresh. 50–74 = Mixed. Below 50 = Rotten.",
    citable: true,
  },
  {
    label: "Audience Score",
    badge: "A",
    color: D.amber,
    tagline: "General public ratings",
    description:
      "Open to any registered M'Bari user who marks that they have watched the film. One rating per user per film. Ratings are cast on a 1–10 scale internally and normalised to 0–100. A minimum of 10 verified watches is required before the score appears publicly.",
    weight:
      "All audience ratings carry equal weight regardless of the rater's history or activity level.",
    range: "0 – 100. Displayed as a percentage of the maximum possible.",
    citable: false,
  },
  {
    label: "Verified Score",
    badge: "V",
    color: "#5A78A0",
    tagline: "Legal watch only — cinema ticket or subscription proof",
    description:
      "Same mechanism as the Audience Score, but restricted to users who have proven they watched the film via a legal channel. Accepted proofs include: cinema ticket barcode scan (via the M'Bari Barcode system), or a connected subscription account (Netflix, Showmax, Prime Video, etc.) showing the title in the user's watch history.",
    weight:
      "Verified ratings carry equal weight. The Verified Score is considered more reliable than the open Audience Score as it eliminates bot and brigade ratings from users who have not watched the film.",
    range: "0 – 100. Requires minimum 5 verified watches to publish.",
    citable: true,
  },
  {
    label: "Heat Score",
    badge: "H",
    color: D.red,
    tagline: "Social momentum — X (Twitter) · TikTok · Instagram",
    description:
      "A 7-day rolling index measuring social volume and velocity around a title. Signals tracked include: mentions on X/Twitter, TikTok video tags and audio uses, Instagram hashtag volume, and search trend data where available. The score is recalculated daily and decays after release windows close.",
    weight:
      "Weighted by recency. Signals from the past 48 hours carry 3× the weight of signals from 3–7 days ago. The Heat Score is not a quality indicator — a controversial or divisive film can score very high.",
    range:
      "0 – 100. Above 80 = Trending nationally. 60–79 = Active conversation. Below 40 = Cooling.",
    citable: false,
  },
];

export default function MethodologyPage() {
  return (
    <div style={{ background: D.bg, minHeight: "100vh", color: D.primary, fontFamily: "var(--font-sans, sans-serif)" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "80px 24px 80px" }}>

        {/* Breadcrumb */}
        <Link href="/" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", color: D.muted, textDecoration: "none", textTransform: "uppercase" }}>
          ← M&apos;Bari
        </Link>

        {/* Header */}
        <div style={{ marginTop: "2.5rem", marginBottom: "3rem", paddingBottom: "2rem", borderBottom: `2px solid ${D.ink}` }}>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, color: D.ink, margin: "0 0 0.6rem", lineHeight: 1.1 }}>
            Scoring Methodology
          </h1>
          <p style={{ fontSize: "0.95rem", color: D.secondary, lineHeight: 1.65, margin: 0, maxWidth: 600 }}>
            M&apos;Bari publishes four independent scores for each film. They measure different things and should be read together, not averaged. This page explains exactly how each score is calculated so that press, academics, and filmmakers can cite our data with confidence.
          </p>
        </div>

        {/* Score cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {SCORES.map((s) => (
            <div key={s.label} style={{ background: D.bgCard, border: `0.5px solid ${D.border}`, padding: "2rem 2.4rem" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.2rem", marginBottom: "1.2rem" }}>
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: s.color, color: "#fff",
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 22, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {s.badge}
                </div>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.2rem", fontWeight: 700, color: D.ink, margin: "0 0 0.2rem" }}>
                    {s.label}
                  </h2>
                  <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", color: s.color, fontWeight: 700, textTransform: "uppercase" }}>
                    {s.tagline}
                  </div>
                </div>
                {s.citable && (
                  <div style={{ marginLeft: "auto", fontSize: "0.65rem", letterSpacing: "0.1em", color: D.green, border: `1px solid ${D.green}60`, padding: "3px 8px", fontWeight: 700, whiteSpace: "nowrap" }}>
                    CITABLE
                  </div>
                )}
              </div>

              {/* Body */}
              <p style={{ fontSize: "0.88rem", color: D.secondary, lineHeight: 1.7, margin: "0 0 1rem" }}>
                {s.description}
              </p>

              {/* Meta rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", borderTop: `0.5px solid ${D.border}`, paddingTop: "1rem" }}>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <span style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: D.muted, fontWeight: 700, textTransform: "uppercase", minWidth: 64, flexShrink: 0 }}>Weighting</span>
                  <span style={{ fontSize: "0.82rem", color: D.secondary, lineHeight: 1.5 }}>{s.weight}</span>
                </div>
                <div style={{ display: "flex", gap: "0.8rem" }}>
                  <span style={{ fontSize: "0.68rem", letterSpacing: "0.1em", color: D.muted, fontWeight: 700, textTransform: "uppercase", minWidth: 64, flexShrink: 0 }}>Scale</span>
                  <span style={{ fontSize: "0.82rem", color: D.secondary, lineHeight: 1.5 }}>{s.range}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* M'Bari Barcode section */}
        <div style={{ marginTop: "3rem", padding: "1.8rem 2.4rem", border: `1px solid ${D.goldL}40`, background: `${D.goldL}08` }}>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.1rem", fontWeight: 700, color: D.ink, margin: "0 0 0.8rem" }}>
            The M&apos;Bari Barcode
          </h2>
          <p style={{ fontSize: "0.88rem", color: D.secondary, lineHeight: 1.7, margin: 0 }}>
            The M&apos;Bari Barcode is our ticket verification system. When a cinema-goer scans their physical or digital ticket barcode through M&apos;Bari, we cryptographically confirm that a unique seat was purchased for a specific screening. The scan unlocks a Verified rating for that film and contributes to our box office data. Barcodes are single-use and tied to a M&apos;Bari account. This system is what separates our Verified Score from open ratings that anyone — including people who have not watched the film — can submit.
          </p>
        </div>

        {/* Box office note */}
        <div style={{ marginTop: "2rem", padding: "1.8rem 2.4rem", border: `0.5px solid ${D.border}` }}>
          <h2 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: "1.1rem", fontWeight: 700, color: D.ink, margin: "0 0 0.8rem" }}>
            Box Office Data
          </h2>
          <p style={{ fontSize: "0.88rem", color: D.secondary, lineHeight: 1.7, margin: 0 }}>
            Weekend and cumulative box office figures are sourced from official cinema group reports (FilmOne, Silverbird, Genesis Cinemas), trade press (ThisDay, BusinessDay, The Nation), and direct distributor releases where available. All figures are in Nigerian Naira (₦) unless stated otherwise. Figures marked with a tilde (~) are M&apos;Bari estimates derived from average ticket price × reported attendance. We update figures every Monday for the prior weekend.
          </p>
        </div>

        {/* Editorial independence */}
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: `0.5px solid ${D.border}` }}>
          <p style={{ fontSize: "0.8rem", color: D.muted, lineHeight: 1.7, margin: 0 }}>
            M&apos;Bari is an independent publication. No distributor, studio, or streaming platform pays for placement, score adjustments, or data inclusion. If you believe a score contains an error, contact us with verifiable evidence and we will review and correct it. Our editorial process is documented and open to scrutiny.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/films" style={{ fontSize: "0.8rem", color: D.gold, textDecoration: "none", fontWeight: 600 }}>Film Directory →</Link>
            <Link href="/submit" style={{ fontSize: "0.8rem", color: D.gold, textDecoration: "none", fontWeight: 600 }}>Submit a Film →</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
