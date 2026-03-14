import Link from "next/link";
import { fmt } from "@/lib/format";

type Film = {
  id: string;
  slug: string;
  title: string;
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
        <tr
          style={{
            borderBottom: `1px solid ${border}`,
          }}
        >
          {["#", "TITLE", "WKND", "TOTAL", "WK", "STATUS"].map((col, i) => (
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
        {films.map((film, i) => {
          const rowBg = i % 2 === 0 ? "#fff" : parchDark;
          return (
            <tr
              key={film.id}
              style={{
                background: rowBg,
                borderBottom: `0.5px solid ${border}30`,
              }}
            >
              <td
                style={{
                  padding: "8px",
                  textAlign: "center",
                  color: inkFaint,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
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
              <td
                style={{
                  padding: "8px",
                  textAlign: "center",
                  color: inkMuted,
                  fontWeight: 600,
                }}
              >
                {film.boxWeekend != null ? fmt(film.boxWeekend) : "—"}
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "center",
                  color: ink,
                  fontWeight: 700,
                }}
              >
                {film.boxCumulative != null ? fmt(film.boxCumulative) : "—"}
              </td>
              <td
                style={{
                  padding: "8px",
                  textAlign: "center",
                  color: inkMuted,
                }}
              >
                {film.boxWeek ?? "—"}
              </td>
              <td style={{ padding: "8px", textAlign: "center" }}>
                {film.boxLive ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      color: green,
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: green,
                        display: "inline-block",
                        animation: "pulse 1.4s infinite",
                      }}
                    />
                    LIVE
                  </span>
                ) : (
                  <span
                    style={{
                      color: inkFaint,
                      fontSize: 10,
                      fontStyle: "italic",
                    }}
                  >
                    Rep.
                  </span>
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
