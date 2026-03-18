export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { upsertAvailability, deleteAvailability } from "../actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Availability — Admin — M'Bari" };

const parch    = "#F5F0E4";
const ink      = "#1C1608";
const gold     = "#8B7040";
const red      = "#C0392B";
const green    = "#2D7A3A";
const border   = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const bgRow    = "#EDE6D6";

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "KE", name: "Kenya" },
  { code: "ET", name: "Ethiopia" },
  { code: "EG", name: "Egypt" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
];

const ACCESS_TYPES = ["Cinema", "Streaming", "VOD", "Free", "Rental", "Download", "Pay-per-view"];

const inputStyle = {
  fontFamily: "var(--font-sans, sans-serif)",
  fontSize: 12,
  color: ink,
  background: "#fff",
  border: `0.5px solid ${border}`,
  padding: "6px 10px",
  width: "100%",
  outline: "none",
} as React.CSSProperties;

const selectStyle = { ...inputStyle };

type Props = { params: Promise<{ slug: string }> };

export default async function FilmAvailabilityPage({ params }: Props) {
  const { slug } = await params;

  const film = await prisma.film.findUnique({
    where: { slug },
    include: { availability: { orderBy: [{ countryCode: "asc" }, { platform: "asc" }] } },
  });

  if (!film) notFound();

  return (
    <div style={{ background: "#E8E2D4", minHeight: "100vh", padding: "20px 16px 40px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin/films" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkFaint, textDecoration: "none" }}>
          ← All Films
        </Link>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 20, fontWeight: 700, color: ink, margin: 0 }}>
            {film.title}
          </h1>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: inkFaint, letterSpacing: "0.1em", marginTop: 2 }}>
            {film.year} · AVAILABILITY & WHERE TO WATCH
          </div>
        </div>
        <Link href={`/film/${slug}`} target="_blank" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkFaint, textDecoration: "none" }}>
          View page →
        </Link>
      </div>

      {/* Current entries */}
      <div style={{ background: parch, border: `0.5px solid ${border}`, marginBottom: 24 }}>
        <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: gold, letterSpacing: "0.16em", fontWeight: 700 }}>
            CURRENT ENTRIES ({film.availability.length})
          </span>
        </div>

        {film.availability.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: inkFaint }}>
            No availability entries yet. Add one below.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `0.5px solid ${border}` }}>
                {["COUNTRY", "PLATFORM", "ACCESS TYPE", "URL", ""].map((col) => (
                  <th key={col} style={{ fontSize: 8, color: gold, letterSpacing: "0.12em", fontWeight: 700, textAlign: "left", padding: "8px 12px" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {film.availability.map((entry, i) => (
                <tr key={entry.id} style={{ background: i % 2 === 0 ? "#fff" : bgRow, borderBottom: `0.5px solid ${border}30` }}>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: inkMuted,
                      background: bgRow,
                      border: `0.5px solid ${border}`,
                      padding: "2px 6px",
                    }}>{entry.countryCode}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: ink, fontWeight: 600 }}>{entry.platform}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 10, color: green, border: `0.5px solid ${green}60`, padding: "2px 6px", letterSpacing: "0.06em" }}>
                      {entry.accessType}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: inkFaint, fontSize: 11, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.url ? (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ color: gold, textDecoration: "none" }}>
                        {entry.url}
                      </a>
                    ) : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      {/* Edit inline via details/summary */}
                      <details style={{ display: "inline" }}>
                        <summary style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: gold,
                          border: `0.5px solid ${gold}`, padding: "4px 10px",
                          cursor: "pointer", listStyle: "none", fontFamily: "var(--font-sans)",
                        }}>
                          EDIT
                        </summary>
                        <div style={{
                          position: "absolute", right: 16, background: parch, border: `1px solid ${border}`,
                          padding: "16px 20px", zIndex: 10, minWidth: 380, marginTop: 4,
                          boxShadow: "0 4px 16px rgba(28,22,8,0.12)",
                        }}>
                          <form action={upsertAvailability}>
                            <input type="hidden" name="id" value={entry.id} />
                            <input type="hidden" name="filmId" value={film.id} />
                            <input type="hidden" name="slug" value={slug} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                              <div>
                                <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>COUNTRY</label>
                                <select name="countryCode" defaultValue={entry.countryCode} style={selectStyle}>
                                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                                  <option value={entry.countryCode}>{entry.countryCode}</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>ACCESS TYPE</label>
                                <select name="accessType" defaultValue={entry.accessType} style={selectStyle}>
                                  {ACCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ marginBottom: 10 }}>
                              <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>PLATFORM</label>
                              <input name="platform" defaultValue={entry.platform} required style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: 14 }}>
                              <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>URL (optional)</label>
                              <input name="url" defaultValue={entry.url ?? ""} type="url" placeholder="https://..." style={inputStyle} />
                            </div>
                            <button type="submit" style={{
                              background: gold, color: "#fff", border: "none", padding: "7px 20px",
                              fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700,
                              letterSpacing: "0.1em", cursor: "pointer", width: "100%",
                            }}>
                              SAVE CHANGES
                            </button>
                          </form>
                        </div>
                      </details>

                      {/* Delete */}
                      <form action={deleteAvailability.bind(null, entry.id, slug)}>
                        <button type="submit" style={{
                          background: "transparent", color: red, border: `0.5px solid ${red}`,
                          padding: "4px 10px", fontSize: 9, fontFamily: "var(--font-sans)",
                          fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
                        }}>
                          DELETE
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add new entry */}
      <div style={{ background: parch, border: `0.5px solid ${border}`, padding: "20px 24px" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: gold, letterSpacing: "0.16em", fontWeight: 700, marginBottom: 16 }}>
          ADD NEW ENTRY
        </div>
        <form action={upsertAvailability}>
          <input type="hidden" name="filmId" value={film.id} />
          <input type="hidden" name="slug" value={slug} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>COUNTRY *</label>
              <select name="countryCode" required style={selectStyle}>
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>PLATFORM *</label>
              <input name="platform" required placeholder="e.g. Prime Video, Cinema" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>ACCESS TYPE *</label>
              <select name="accessType" required style={selectStyle}>
                <option value="">Select type…</option>
                {ACCESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 8, color: inkFaint, letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>WATCH URL (optional)</label>
            <input name="url" type="url" placeholder="https://..." style={inputStyle} />
          </div>
          <button type="submit" style={{
            background: gold, color: "#fff", border: "none", padding: "9px 28px",
            fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em", cursor: "pointer",
          }}>
            ADD ENTRY
          </button>
        </form>
      </div>
    </div>
  );
}
