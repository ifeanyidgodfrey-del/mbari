import Link from "next/link";
import { fmtDual, fmtPerCap, perCapitaCents } from "@/lib/format";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  FR: "France", GB: "UK", US: "USA", NZ: "New Zealand", IE: "Ireland",
};
const COUNTRY_COLOR: Record<string, string> = {
  NG: "#2D7A3A", ZA: "#1A5C8A", KE: "#8B1A1A", GH: "#B8860B",
};

type Film = {
  id: string;
  slug: string;
  title: string;
  country: string;
  boxWeekend: bigint | null;
  boxCumulative: bigint | null;
  boxWeek: number | null;
  boxLive: boolean;
};

export default function BoxOfficeTable({ films }: { films: Film[] }) {
  const parch = "#F5F0E4";
  const parchDark = "#EDE6D6";
  const gold = "#8B7040";
  const ink = "#1C1608";
  const inkMuted = "#6B5D3F";
  const inkFaint = "#9C8B6E";
  const border = "#C4A862";
  const green = "#2D7A3A";

  // Sort by per-capita USD (level playing field)
  const sorted = [...films].sort((a, b) => {
    const aVal = a.boxCumulative != null ? perCapitaCents(a.boxCumulative, a.country) : 0;
    const bVal = b.boxCumulative != null ? perCapitaCents(b.boxCumulative, b.country) : 0;
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
          {["#", "TITLE", "COUNTRY", "WKND", "TOTAL", "WK", "¢/CAPITA", "STATUS"].map((col, i) => (
            <th
              key={col}
              style={{
                fontSize: 9,
                color: col === "¢/CAPITA" ? gold : gold,
                letterSpacing: "0.12em",
                fontWeight: 700,
                textAlign: i === 0 || i >= 2 ? "center" : "left",
                padding: "6px 8px",
                fontFamily: "var(--font-sans, sans-serif)",
              }}
            >
              {col === "¢/CAPITA"
                ? <span title="Box office per capita — levels the playing field across countries with different population sizes">¢/CAPITA ↓</span>
                : col}
            </th>
          ))}
        </tr>
        <tr>
          <td colSpan={8} style={{
            padding: "3px 8px 5px",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 8,
            color: inkFaint,
            letterSpacing: "0.06em",
            borderBottom: `0.5px solid ${border}30`,
          }}>
            Ranked by cents earned per person in home country — levels the playing field
          </td>
        </tr>
      </thead>
      <tbody>
        {sorted.map((film, i) => {
          const rowBg = i % 2 === 0 ? "#fff" : parchDark;
          const perCap = film.boxCumulative != null
            ? fmtPerCap(film.boxCumulative, film.country)
            : "—";
          const perCapVal = film.boxCumulative != null
            ? perCapitaCents(film.boxCumulative, film.country)
            : 0;

          // Heat colour for per-capita bar: green ≥ 10¢, amber ≥ 1¢, faint below
          const capColor = perCapVal >= 10 ? "#2D7A3A" : perCapVal >= 1 ? "#D4882A" : inkFaint;

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
              <td style={{ padding: "8px", textAlign: "center", color: inkMuted, fontWeight: 600 }}>
                {film.boxWeekend != null ? fmtDual(film.boxWeekend, film.country) : "—"}
              </td>
              <td style={{ padding: "8px", textAlign: "center", color: ink, fontWeight: 700 }}>
                {film.boxCumulative != null ? fmtDual(film.boxCumulative, film.country) : "—"}
              </td>
              <td style={{ padding: "8px", textAlign: "center", color: inkMuted }}>
                {film.boxWeek ?? "—"}
              </td>
              <td style={{ padding: "8px", textAlign: "center" }}>
                <span style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: capColor,
                  letterSpacing: "0.04em",
                }}>
                  {perCap}
                </span>
              </td>
              <td style={{ padding: "8px", textAlign: "center" }}>
                {film.boxLive ? (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: green,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.08em",
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: green, display: "inline-block",
                      animation: "pulse 1.4s infinite",
                    }} />
                    LIVE
                  </span>
                ) : (
                  <span style={{ color: inkFaint, fontSize: 10, fontStyle: "italic" }}>Rep.</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </table>
  );
}
