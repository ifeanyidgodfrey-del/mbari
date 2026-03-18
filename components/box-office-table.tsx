import Link from "next/link";
import { fmtDual } from "@/lib/format";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", Nigeria: "Nigeria",
  ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  EG: "Egypt", ET: "Ethiopia",
  FR: "France", GB: "UK", US: "USA", NZ: "New Zealand", IE: "Ireland",
};
const COUNTRY_COLOR: Record<string, string> = {
  NG: "#2D7A3A", Nigeria: "#2D7A3A",
  ZA: "#1A5C8A", KE: "#8B1A1A", GH: "#B8860B",
  EG: "#C4901A", ET: "#006400",
};

type Film = {
  id: string;
  slug: string;
  title: string;
  country: string;
  boxCumulative: bigint | null;
  boxWeek: number | null;
};

export default function BoxOfficeTable({ films }: { films: Film[] }) {
  const parch = "#F5F0E4";
  const parchDark = "#EDE6D6";
  const gold = "#8B7040";
  const ink = "#1C1608";
  const inkMuted = "#6B5D3F";
  const inkFaint = "#9C8B6E";
  const border = "#C4A862";

  // Sort by cumulative box office descending; films with no data go to bottom
  const sorted = [...films].sort((a, b) => {
    const aVal = a.boxCumulative != null ? Number(a.boxCumulative) : -1;
    const bVal = b.boxCumulative != null ? Number(b.boxCumulative) : -1;
    return bVal - aVal;
  });

  return (
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
          {["#", "TITLE", "COUNTRY", "TOTAL", "WK"].map((col, i) => (
            <th
              key={col}
              style={{
                fontSize: 9,
                color: gold,
                letterSpacing: "0.12em",
                fontWeight: 700,
                textAlign: i === 0 || i >= 2 ? "center" : "left",
                padding: "6px 8px",
                fontFamily: "var(--font-sans, sans-serif)",
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
                borderBottom: `0.5px solid ${border}30`,
              }}
            >
              <td style={{ padding: "8px", textAlign: "center", color: inkFaint, fontSize: 11, fontWeight: 600 }}>
                {i + 1}
              </td>
              <td style={{ padding: "8px" }}>
                <Link
                  href={`/film/${film.slug}`}
                  style={{
                    color: ink,
                    textDecoration: "none",
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {film.title}
                </Link>
              </td>
              <td style={{ padding: "8px", textAlign: "center" }}>
                <span style={{
                  display: "inline-block",
                  background: COUNTRY_COLOR[film.country] ?? gold,
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  padding: "2px 6px",
                  fontFamily: "var(--font-sans, sans-serif)",
                }}>
                  {COUNTRY_NAME[film.country] ?? film.country}
                </span>
              </td>
              <td style={{ padding: "8px", textAlign: "center", color: ink, fontWeight: 700 }}>
                {film.boxCumulative != null ? fmtDual(film.boxCumulative, film.country) : "—"}
              </td>
              <td style={{ padding: "8px", textAlign: "center", color: inkMuted }}>
                {film.boxWeek ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
