export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Films — Admin — M'Bari" };

const parch    = "#F5F0E4";
const ink      = "#1C1608";
const gold     = "#8B7040";
const border   = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const green    = "#2D7A3A";

export default async function AdminFilmsPage() {
  const films = await prisma.film.findMany({
    orderBy: [{ year: "desc" }, { title: "asc" }],
    include: { _count: { select: { availability: true } } },
  });

  return (
    <div style={{ background: "#E8E2D4", minHeight: "100vh", padding: "20px 16px 40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkFaint, textDecoration: "none" }}>
          ← Admin
        </Link>
        <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 22, fontWeight: 700, color: ink, margin: 0 }}>
          Film Availability
        </h1>
        <div style={{ width: 80 }} />
      </div>

      {/* Films table */}
      <div style={{ background: parch, border: `0.5px solid ${border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              {["FILM", "YEAR", "COUNTRY", "AVAILABILITY ENTRIES", ""].map((col) => (
                <th key={col} style={{ fontSize: 8, color: gold, letterSpacing: "0.12em", fontWeight: 700, textAlign: "left", padding: "8px 12px" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {films.map((film, i) => (
              <tr key={film.id} style={{ background: i % 2 === 0 ? "#fff" : "#EDE6D6", borderBottom: `0.5px solid ${border}30` }}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 13, fontWeight: 700, color: ink }}>
                    {film.title}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: inkMuted, fontSize: 11 }}>{film.year}</td>
                <td style={{ padding: "10px 12px", color: inkFaint, fontSize: 11 }}>{film.country}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    fontSize: 11,
                    color: film._count.availability > 0 ? green : inkFaint,
                    fontWeight: film._count.availability > 0 ? 600 : 400,
                  }}>
                    {film._count.availability} {film._count.availability === 1 ? "entry" : "entries"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                  <Link href={`/admin/films/${film.slug}`} style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: gold,
                    border: `0.5px solid ${gold}`,
                    padding: "4px 10px",
                    textDecoration: "none",
                    fontFamily: "var(--font-sans)",
                  }}>
                    MANAGE →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
