import { prisma } from "@/lib/prisma";
import { fmt } from "@/lib/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const crew = await prisma.crewMember.findUnique({
    where: { slug: slug },
  });
  if (!crew) return { title: "Crew Not Found" };
  return {
    title: `${crew.name} — M'Bari`,
    description: crew.bio?.slice(0, 160) ?? `${crew.name} on M'Bari`,
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

export default async function CrewPage({ params }: Props) {
  const { slug } = await params;
  const crew = await prisma.crewMember.findUnique({
    where: { slug: slug },
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

  const isCraft = crew.type === "craft";

  return (
    <div
      style={{
        background: "#E8E2D4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, padding: "0 0 12px" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: inkFaint,
            textDecoration: "none",
          }}
        >
          ← Back to M&apos;Bari
        </Link>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: parch,
          border: `1px solid ${inkSoft}`,
          position: "relative",
          padding: "28px 32px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: `0.5px solid ${border}`,
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 28,
                fontWeight: 700,
                color: ink,
                margin: 0,
              }}
            >
              {crew.name}
            </h1>
            {isCraft ? (
              <span
                style={{
                  background: green,
                  color: "#fff",
                  fontSize: 8,
                  fontFamily: "var(--font-sans, sans-serif)",
                  letterSpacing: "0.12em",
                  padding: "3px 8px",
                  fontWeight: 700,
                }}
              >
                CRAFT PROFESSIONAL
              </span>
            ) : (
              crew.roles.map((role) => (
                <span
                  key={role}
                  style={{
                    border: `0.5px solid ${border}`,
                    fontSize: 9,
                    fontFamily: "var(--font-sans, sans-serif)",
                    color: gold,
                    padding: "2px 7px",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                  }}
                >
                  {role.toUpperCase()}
                </span>
              ))
            )}
          </div>

          {crew.bio && (
            <p
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 12,
                color: inkSoft,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {crew.bio}
            </p>
          )}

          {isCraft && crew.available && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 12,
                padding: "10px 14px",
                border: `0.5px solid ${green}`,
                background: `${green}10`,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: green,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                }}
              >
                AVAILABLE FOR PROJECTS
              </span>
              <button
                style={{
                  background: green,
                  color: "#fff",
                  border: "none",
                  padding: "5px 12px",
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                CONTACT
              </button>
            </div>
          )}
        </div>

        {/* Aggregate stats */}
        <div
          style={{
            display: "flex",
            gap: 0,
            border: `0.5px solid ${border}`,
            marginBottom: 20,
          }}
        >
          {[
            { label: "FILMS", value: totalFilms },
            { label: "AVG SCORE", value: avgScore ?? "—" },
            {
              label: "BOX OFFICE",
              value: combinedBox > BigInt(0) ? fmt(combinedBox) : "—",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "12px 8px",
                borderRight: i < 2 ? `0.5px solid ${border}` : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 24,
                  fontWeight: 700,
                  color: ink,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 8,
                  color: inkFaint,
                  letterSpacing: "0.12em",
                  marginTop: 2,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Filmography */}
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--font-sans, sans-serif)",
            color: gold,
            letterSpacing: "0.16em",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          FILMOGRAPHY
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              {["FILM", "ROLE", "SCORE", "BOX OFFICE"].map((col, i) => (
                <th
                  key={col}
                  style={{
                    fontSize: 8,
                    color: gold,
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    textAlign: i === 0 ? "left" : "center",
                    padding: "5px 6px",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {crew.credits.map((credit, i) => (
              <tr
                key={credit.id}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#EDE6D6",
                  borderBottom: `0.5px solid ${border}30`,
                }}
              >
                <td style={{ padding: "7px 6px" }}>
                  <Link
                    href={`/film/${credit.film.slug}`}
                    style={{
                      fontFamily: "var(--font-serif, Georgia, serif)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: ink,
                      textDecoration: "none",
                    }}
                  >
                    {credit.film.title}
                  </Link>
                  <span
                    style={{
                      display: "block",
                      fontSize: 9,
                      color: inkFaint,
                    }}
                  >
                    {credit.film.year}
                  </span>
                </td>
                <td
                  style={{
                    padding: "7px 6px",
                    textAlign: "center",
                    color: inkMuted,
                    fontSize: 11,
                  }}
                >
                  {credit.role}
                </td>
                <td style={{ padding: "7px 6px", textAlign: "center" }}>
                  {credit.film.criticScore != null ? (
                    <span
                      style={{
                        background: green,
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "var(--font-serif, Georgia, serif)",
                        padding: "2px 6px",
                      }}
                    >
                      {credit.film.criticScore}
                    </span>
                  ) : (
                    <span style={{ color: inkFaint }}>—</span>
                  )}
                </td>
                <td
                  style={{
                    padding: "7px 6px",
                    textAlign: "center",
                    color: inkMuted,
                    fontWeight: 600,
                  }}
                >
                  {credit.film.boxCumulative != null
                    ? fmt(credit.film.boxCumulative)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
