"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const TO_CODE: Record<string, string> = {
  Nigeria: "NG", "South Africa": "ZA", Kenya: "KE", Ghana: "GH",
  Egypt: "EG", Ethiopia: "ET", Morocco: "MA", Senegal: "SN",
  France: "FR", "United Kingdom": "GB", "United States": "US",
};

type Film = {
  id: string;
  slug: string;
  title: string;
  country: string;
  boxWeek: number | null;
  posterUrl: string | null;
};

const gold = "#C8920A";
const ink = "#0A0800";
const inkMuted = "#3A2E18";
const border = "#E0D8C4";
const parchDark = "#F2EDE0";

function sorted(films: Film[]) {
  return [...films].sort((a, b) => {
    const aW = a.boxWeek ?? 0;
    const bW = b.boxWeek ?? 0;
    return bW - aW || a.title.localeCompare(b.title);
  });
}

function PosterGrid({ films }: { films: Film[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: 10,
    }}>
      {sorted(films).map((film, i) => {
        const code = TO_CODE[film.country] ?? film.country;
        return (
          <Link
            key={film.id}
            href={`/film/${film.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{ position: "relative" }}>
              {/* Rank badge */}
              <div style={{
                position: "absolute",
                top: 6,
                left: 6,
                zIndex: 2,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: i === 0 ? 3 : "50%",
                background: i === 0 ? gold : i === 1 ? "#8B8B8B" : i === 2 ? "#A0845C" : "rgba(10,8,0,0.55)",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-sans, sans-serif)",
              }}>
                {i + 1}
              </div>

              {/* Country badge */}
              <div style={{
                position: "absolute",
                top: 6,
                right: 6,
                zIndex: 2,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#fff",
                background: "rgba(10,8,0,0.6)",
                padding: "2px 5px",
                fontFamily: "var(--font-sans, sans-serif)",
              }}>
                {code}
              </div>

              {/* Wk badge — only if set */}
              {film.boxWeek != null && (
                <div style={{
                  position: "absolute",
                  bottom: 38,
                  right: 6,
                  zIndex: 2,
                  fontSize: 9,
                  fontWeight: 700,
                  color: gold,
                  background: "rgba(10,8,0,0.7)",
                  padding: "2px 5px",
                  fontFamily: "var(--font-sans, sans-serif)",
                }}>
                  WK {film.boxWeek}
                </div>
              )}

              {/* Poster */}
              <div style={{
                position: "relative",
                width: "100%",
                paddingTop: "150%", // 2:3 poster ratio
                background: parchDark,
                overflow: "hidden",
              }}>
                {film.posterUrl ? (
                  <Image
                    src={film.posterUrl}
                    alt={film.title}
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                    sizes="120px"
                  />
                ) : (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 11, color: inkMuted, textAlign: "center", padding: 8,
                  }}>
                    {film.title}
                  </div>
                )}
              </div>

              {/* Title strip */}
              <div style={{
                padding: "6px 4px 4px",
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: 12,
                fontWeight: 700,
                color: ink,
                lineHeight: 1.25,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}>
                {film.title}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TableView({ films }: { films: Film[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: 13,
      }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${gold}` }}>
            {["#", "TITLE", "WK"].map((col, i) => (
              <th key={col} style={{
                fontSize: 11, color: gold, letterSpacing: "0.18em", fontWeight: 700,
                textAlign: i === 0 || i === 2 ? "center" : "left",
                padding: "8px 10px", textTransform: "uppercase",
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted(films).map((film, i) => {
            const rowBg = i % 2 === 0 ? "#fff" : parchDark;
            return (
              <tr
                key={film.id}
                style={{ background: rowBg, borderBottom: `0.5px solid ${border}`, transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,146,10,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
              >
                <td style={{ padding: "10px", textAlign: "center", width: 44, fontWeight: 700, lineHeight: 1 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28,
                    borderRadius: i === 0 ? 0 : "50%",
                    background: i === 0 ? gold : i === 1 ? "#8B8B8B" : i === 2 ? "#A0845C" : "transparent",
                    color: i < 3 ? "#fff" : ink,
                    fontSize: i === 0 ? 15 : 13, fontWeight: 700,
                    border: i >= 3 ? `1.5px solid ${border}` : "none",
                  }}>
                    {i + 1}
                  </span>
                </td>
                <td style={{ padding: "10px" }}>
                  <Link href={`/film/${film.slug}`} style={{
                    color: ink, textDecoration: "none",
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 15, fontWeight: 700,
                  }}>
                    {film.title}
                  </Link>
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", color: inkMuted, opacity: 0.55,
                    fontFamily: "var(--font-sans, sans-serif)", verticalAlign: "middle",
                  }}>
                    {TO_CODE[film.country] ?? film.country}
                  </span>
                </td>
                <td style={{ padding: "10px", textAlign: "center", color: inkMuted, fontSize: 13 }}>
                  {film.boxWeek != null ? `Wk ${film.boxWeek}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function BoxOfficeTable({ films }: { films: Film[] }) {
  const [view, setView] = useState<"grid" | "table">("grid");

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12, gap: 2 }}>
        {(["grid", "table"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              background: view === v ? ink : "transparent",
              color: view === v ? "#fff" : inkMuted,
              border: `1px solid ${view === v ? ink : border}`,
              borderRadius: 2,
              padding: "8px 14px",
              minHeight: 36,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "var(--font-sans, sans-serif)",
              transition: "all 0.15s",
            }}
          >
            {v === "grid" ? "⊞ Posters" : "≡ List"}
          </button>
        ))}
      </div>

      {view === "grid" ? <PosterGrid films={films} /> : <TableView films={films} />}
    </div>
  );
}
