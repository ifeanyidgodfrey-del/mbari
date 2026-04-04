"use client";
import Link from "next/link";

// Normalise any stored value to the 2-letter ISO code
const TO_CODE: Record<string, string> = {
  Nigeria: "NG", "South Africa": "ZA", Kenya: "KE", Ghana: "GH",
  Egypt: "EG", Ethiopia: "ET", Morocco: "MA", France: "FR",
  "United Kingdom": "GB", "United States": "US",
};

type Film = {
  id: string;
  slug: string;
  title: string;
  country: string;
  boxWeek: number | null;
};

export default function BoxOfficeTable({ films }: { films: Film[] }) {
  const parch = "#FBF8F0";
  const parchDark = "#F2EDE0";
  const gold = "#C8920A";
  const ink = "#0A0800";
  const inkMuted = "#3A2E18";
  const border = "#E0D8C4";

  // Sort by week descending (longer run = more established), then alpha
  const sorted = [...films].sort((a, b) => {
    const aW = a.boxWeek ?? 0;
    const bW = b.boxWeek ?? 0;
    return bW - aW || a.title.localeCompare(b.title);
  });

  return (
    <div className="mbari-table-wrap">
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: 13,
      }}
    >
      <thead>
        <tr style={{ borderBottom: `2px solid ${gold}` }}>
          {["#", "TITLE", "WK"].map((col, i) => (
            <th
              key={col}
              style={{
                fontSize: 11,
                color: gold,
                letterSpacing: "0.18em",
                fontWeight: 700,
                textAlign: i === 0 || i === 2 ? "center" : "left",
                padding: "8px 10px",
                fontFamily: "var(--font-sans, sans-serif)",
                textTransform: "uppercase",
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((film, i) => {
          const rowBg = i % 2 === 0 ? "#fff" : parchDark;

          return (
            <tr
              key={film.id}
              style={{
                background: rowBg,
                borderBottom: `0.5px solid ${border}`,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,146,10,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
            >
              <td style={{
                padding: "10px",
                textAlign: "center",
                width: 44,
                fontFamily: "var(--font-sans, sans-serif)",
                fontWeight: 700,
                lineHeight: 1,
              }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: i === 0 ? 0 : "50%",
                  background: i === 0 ? gold : i === 1 ? "#8B8B8B" : i === 2 ? "#A0845C" : "transparent",
                  color: i < 3 ? "#fff" : ink,
                  fontSize: i === 0 ? 15 : 13,
                  fontWeight: 700,
                  border: i >= 3 ? `1.5px solid ${border}` : "none",
                }}>
                  {i + 1}
                </span>
              </td>
              <td style={{ padding: "10px" }}>
                <Link
                  href={`/film/${film.slug}`}
                  style={{
                    color: ink,
                    textDecoration: "none",
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {film.title}
                </Link>
                <span style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: inkMuted,
                  opacity: 0.55,
                  fontFamily: "var(--font-sans, sans-serif)",
                  verticalAlign: "middle",
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
