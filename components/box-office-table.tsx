import Link from "next/link";
import { fmtDual } from "@/lib/format";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", Nigeria: "Nigeria",
  ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  EG: "Egypt", ET: "Ethiopia",
  FR: "France", GB: "UK", US: "USA", NZ: "New Zealand", IE: "Ireland",
};
const COUNTRY_COLOR: Record<string, string> = {
  NG: "#1A6B30", Nigeria: "#1A6B30",
  ZA: "#0F4A7A", KE: "#7A1010", GH: "#A87800",
  EG: "#B07A00", ET: "#005200",
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
  const parch = "#FBF8F0";
  const parchDark = "#F2EDE0";
  const gold = "#C8920A";
  const ink = "#0A0800";
  const inkMuted = "#3A2E18";
  const border = "#E0D8C4";

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
        fontSize: 13,
      }}
    >
      <thead>
        <tr style={{ borderBottom: `2px solid ${gold}` }}>
          {["#", "TITLE", "COUNTRY", "TOTAL", "WK"].map((col, i) => (
            <th
              key={col}
              style={{
                fontSize: 11,
                color: gold,
                letterSpacing: "0.18em",
                fontWeight: 700,
                textAlign: i === 0 || i >= 2 ? "center" : "left",
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
                fontSize: i === 0 ? 28 : 20,
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontWeight: 700,
                color: i === 0 ? gold : parch,
                lineHeight: 1,
                WebkitTextStroke: i === 0 ? "0" : `1px ${border}`,
              }}>
                {i + 1}
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
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                <span style={{
                  display: "inline-block",
                  background: COUNTRY_COLOR[film.country] ?? "#5A4010",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "3px 8px",
                  fontFamily: "var(--font-sans, sans-serif)",
                }}>
                  {COUNTRY_NAME[film.country] ?? film.country}
                </span>
              </td>
              <td style={{
                padding: "10px",
                textAlign: "center",
                color: gold,
                fontWeight: 700,
                fontSize: 14,
                fontFamily: "var(--font-sans, sans-serif)",
              }}>
                {film.boxCumulative != null ? fmtDual(film.boxCumulative, film.country) : "—"}
              </td>
              <td style={{ padding: "10px", textAlign: "center", color: inkMuted, fontSize: 13 }}>
                {film.boxWeek ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
