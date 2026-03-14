import { prisma } from "@/lib/prisma";
import CulturalDivider from "@/components/cultural-divider";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const lang = await prisma.language.findUnique({
    where: { code: code },
  });
  if (!lang) return { title: "Language Not Found" };
  return {
    title: `${lang.name} Cinema — M'Bari`,
    description: `All films in ${lang.name} on M'Bari`,
  };
}

const parch = "#F5F0E4";
const ink = "#1C1608";
const gold = "#8B7040";
const green = "#2D7A3A";
const border = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const inkSoft = "#3A2E18";

export default async function LanguagePage({ params }: Props) {
  const { code } = await params;
  const language = await prisma.language.findUnique({
    where: { code: code },
    include: {
      films: {
        include: { film: true },
        orderBy: { film: { verifiedScore: "desc" } },
      },
    },
  });

  if (!language) notFound();

  const films = language.films.map((fl) => fl.film);

  return (
    <div
      style={{
        background: "#E8E2D4",
        minHeight: "100vh",
        padding: "20px 16px 40px",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 11,
          color: inkFaint,
          textDecoration: "none",
          display: "block",
          marginBottom: 20,
        }}
      >
        ← Back to M&apos;Bari
      </Link>

      {/* Language header */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: "clamp(28px, 5vw, 48px)",
            fontWeight: 700,
            color: ink,
            margin: "0 0 6px",
            lineHeight: 1.1,
          }}
        >
          {language.name}
        </h1>
        {language.native && (
          <div
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 18,
              color: gold,
              fontStyle: "italic",
            }}
          >
            {language.native}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <CulturalDivider langCode={code} width={320} />
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: inkFaint,
            marginTop: 8,
          }}
        >
          {films.length} film{films.length !== 1 ? "s" : ""} on M&apos;Bari
        </div>
      </div>

      {/* Films grid */}
      {films.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 13,
            color: inkFaint,
            padding: 40,
          }}
        >
          No films found yet. Be the first to{" "}
          <Link href="/submit" style={{ color: gold, textDecoration: "none" }}>
            submit one
          </Link>
          .
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {films.map((film) => (
            <Link
              key={film.id}
              href={`/film/${film.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  border: `0.5px solid ${border}`,
                  background: parch,
                  padding: "14px 16px",
                  height: "100%",
                }}
              >
                <h2
                  style={{
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 16,
                    fontWeight: 700,
                    color: ink,
                    margin: "0 0 4px",
                    lineHeight: 1.2,
                  }}
                >
                  {film.title}
                </h2>
                <div
                  style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    color: inkFaint,
                    marginBottom: 8,
                  }}
                >
                  {film.year} · {film.country}
                </div>

                {film.tagline && (
                  <p
                    style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 11,
                      fontStyle: "italic",
                      color: inkSoft,
                      lineHeight: 1.5,
                      margin: "0 0 10px",
                    }}
                  >
                    {film.tagline}
                  </p>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {film.verifiedScore != null && (
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
                      {film.verifiedScore}
                    </span>
                  )}
                  {film.boxLive && (
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
                      LIVE
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
