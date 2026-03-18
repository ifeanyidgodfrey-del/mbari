"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const parch = "#F5F0E4";
const ink = "#1C1608";
const gold = "#8B7040";
const green = "#2D7A3A";
const red = "#C0392B";
const border = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";

type FilmCandidate = {
  tmdbId: number;
  posterPath: string | null;
  backdropPath: string | null;
  posterPreview: string | null;
  backdropPreview: string | null;
  title: string;
  year: string;
  matchTitle: string;
  confidence: string;
};

type ActorCandidate = {
  tmdbPersonId: number;
  profilePath: string | null;
  profilePreview: string | null;
  name: string;
  knownFor: string;
};

type QueueEntry = {
  type: "film" | "actor" | "crew";
  slug?: string;
  name: string;
  field: string;
  currentUrl: string | null;
  reason: string;
  candidates: FilmCandidate[] | ActorCandidate[];
  addedAt: string;
};

export default function ImageReviewPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});

  useEffect(() => {
    fetch("/api/admin/images")
      .then((r) => r.json())
      .then((data) => { setQueue(data); setLoading(false); });
  }, []);

  async function approve(index: number, candidateIndex: number) {
    setBusy(index);
    await fetch("/api/admin/images/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index, candidateIndex }),
    });
    const fresh = await fetch("/api/admin/images").then((r) => r.json());
    setQueue(fresh);
    setSelected((s) => { const n = { ...s }; delete n[index]; return n; });
    setBusy(null);
  }

  async function skip(index: number) {
    setBusy(index);
    await fetch("/api/admin/images/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    const fresh = await fetch("/api/admin/images").then((r) => r.json());
    setQueue(fresh);
    setBusy(null);
  }

  const films = queue.filter((e) => e.type === "film");
  const actors = queue.filter((e) => e.type === "actor");

  if (loading) {
    return (
      <div style={{ background: "#E8E2D4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-sans)", color: inkFaint, fontSize: 12 }}>Loading queue…</span>
      </div>
    );
  }

  return (
    <div style={{ background: "#E8E2D4", minHeight: "100vh", padding: "20px 16px 60px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Link href="/admin" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkFaint, textDecoration: "none" }}>
          ← Admin
        </Link>
        <h1 style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 22, fontWeight: 700, color: ink, margin: 0 }}>
          Image Review
        </h1>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkFaint }}>
          {queue.length} pending
        </div>
      </div>

      {/* Policy note */}
      <div style={{ background: parch, border: `0.5px solid ${border}`, padding: "10px 16px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkMuted, lineHeight: 1.6 }}>
          <strong style={{ color: ink }}>Zero-write policy.</strong> No image is applied to the database until you click <strong>Apply</strong>.
          Source priority: TMDb → Wikipedia Commons → official press kit.
          Flag any ambiguous match rather than guessing.
        </div>
      </div>

      {queue.length === 0 && (
        <div style={{ background: parch, border: `0.5px solid ${border}`, padding: 40, textAlign: "center", fontFamily: "var(--font-sans)", color: inkFaint, fontSize: 13 }}>
          Queue is empty. All images reviewed.
        </div>
      )}

      {/* Films section */}
      {films.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: gold, letterSpacing: "0.16em", fontWeight: 700, marginBottom: 12 }}>
            FILM IMAGES — {films.length} entries
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {films.map((entry, qi) => {
              const realIndex = queue.indexOf(entry);
              const filmCandidates = entry.candidates as FilmCandidate[];
              const sel = selected[realIndex] ?? 0;
              return (
                <div key={qi} style={{ background: parch, border: `0.5px solid ${border}` }}>
                  {/* Row header */}
                  <div style={{ padding: "10px 16px", borderBottom: `0.5px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 15, fontWeight: 700, color: ink }}>{entry.name}</span>
                      <span style={{ marginLeft: 10, fontFamily: "var(--font-sans)", fontSize: 9, color: inkFaint, letterSpacing: "0.1em" }}>{entry.field}</span>
                      <span style={{ marginLeft: 8, fontFamily: "var(--font-sans)", fontSize: 9, color: entry.reason.includes("unverified") ? red : inkFaint, border: `0.5px solid ${entry.reason.includes("unverified") ? red : border}`, padding: "1px 6px", letterSpacing: "0.08em" }}>
                        {entry.reason}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => approve(realIndex, sel)}
                        disabled={busy === realIndex || filmCandidates.length === 0}
                        style={{ background: green, color: "#fff", border: "none", padding: "5px 14px", fontSize: 9, fontFamily: "var(--font-sans)", cursor: "pointer", fontWeight: 700, letterSpacing: "0.08em", opacity: filmCandidates.length === 0 ? 0.4 : 1 }}
                      >
                        {busy === realIndex ? "…" : "APPLY"}
                      </button>
                      <button
                        onClick={() => skip(realIndex)}
                        disabled={busy === realIndex}
                        style={{ background: "transparent", color: inkFaint, border: `0.5px solid ${border}`, padding: "5px 14px", fontSize: 9, fontFamily: "var(--font-sans)", cursor: "pointer", fontWeight: 700, letterSpacing: "0.08em" }}
                      >
                        SKIP
                      </button>
                    </div>
                  </div>

                  {/* Candidates grid */}
                  <div style={{ padding: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {filmCandidates.length === 0 ? (
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: inkFaint, padding: "8px 0" }}>
                        No TMDb match found — skip or source from press kit manually.
                      </div>
                    ) : (
                      filmCandidates.map((c, ci) => (
                        <div
                          key={ci}
                          onClick={() => setSelected((s) => ({ ...s, [realIndex]: ci }))}
                          style={{
                            cursor: "pointer",
                            border: `2px solid ${sel === ci ? gold : "transparent"}`,
                            background: sel === ci ? `${gold}12` : "transparent",
                            padding: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            width: 200,
                          }}
                        >
                          <div style={{ display: "flex", gap: 8 }}>
                            {c.posterPreview && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.posterPreview} alt="poster" style={{ width: 60, height: 90, objectFit: "cover" }} />
                            )}
                            {c.backdropPreview && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.backdropPreview} alt="backdrop" style={{ width: 107, height: 60, objectFit: "cover", alignSelf: "flex-end" }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: ink }}>{c.title}</div>
                            <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: inkFaint }}>{c.year}</div>
                            <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: c.confidence === "exact" ? green : "#C87941", letterSpacing: "0.08em", marginTop: 2 }}>
                              {c.confidence.toUpperCase()} MATCH
                            </div>
                          </div>
                          {sel === ci && (
                            <div style={{ fontFamily: "var(--font-sans)", fontSize: 8, color: gold, letterSpacing: "0.1em", fontWeight: 700 }}>✓ SELECTED</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Actors section */}
      {actors.length > 0 && (
        <section>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 9, color: gold, letterSpacing: "0.16em", fontWeight: 700, marginBottom: 12 }}>
            ACTOR IMAGES — {actors.length} entries
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {actors.map((entry, qi) => {
              const realIndex = queue.indexOf(entry);
              const actorCandidates = entry.candidates as ActorCandidate[];
              const sel = selected[realIndex] ?? 0;
              return (
                <div key={qi} style={{ background: parch, border: `0.5px solid ${border}` }}>
                  <div style={{ padding: "10px 14px", borderBottom: `0.5px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 14, fontWeight: 700, color: ink }}>{entry.name}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => approve(realIndex, sel)}
                        disabled={busy === realIndex || actorCandidates.length === 0 || !actorCandidates[sel]?.profilePath}
                        style={{ background: green, color: "#fff", border: "none", padding: "4px 10px", fontSize: 9, fontFamily: "var(--font-sans)", cursor: "pointer", fontWeight: 700, opacity: (!actorCandidates[sel]?.profilePath) ? 0.4 : 1 }}
                      >
                        {busy === realIndex ? "…" : "APPLY"}
                      </button>
                      <button
                        onClick={() => skip(realIndex)}
                        disabled={busy === realIndex}
                        style={{ background: "transparent", color: inkFaint, border: `0.5px solid ${border}`, padding: "4px 10px", fontSize: 9, fontFamily: "var(--font-sans)", cursor: "pointer" }}
                      >
                        SKIP
                      </button>
                    </div>
                  </div>
                  <div style={{ padding: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* Current image */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                      {entry.currentUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.currentUrl} alt="current" style={{ width: 60, height: 60, objectFit: "cover", border: `1px solid ${border}` }} />
                      ) : (
                        <div style={{ width: 60, height: 60, background: "#EDE6D6", border: `1px dashed ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18 }}>?</span>
                        </div>
                      )}
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 8, color: inkFaint, letterSpacing: "0.08em" }}>CURRENT</span>
                    </div>
                    {/* Candidates */}
                    {actorCandidates.map((c, ci) => (
                      <div
                        key={ci}
                        onClick={() => c.profilePath && setSelected((s) => ({ ...s, [realIndex]: ci }))}
                        style={{
                          cursor: c.profilePath ? "pointer" : "default",
                          border: `2px solid ${sel === ci && c.profilePath ? gold : "transparent"}`,
                          padding: 4,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          alignItems: "center",
                          opacity: c.profilePath ? 1 : 0.4,
                        }}
                      >
                        {c.profilePreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.profilePreview} alt={c.name} style={{ width: 60, height: 60, objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 60, height: 60, background: "#EDE6D6", border: `1px dashed ${border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 10, color: inkFaint }}>NO IMG</span>
                          </div>
                        )}
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 8, color: inkFaint, textAlign: "center", maxWidth: 64 }}>{c.knownFor || "TMDb"}</span>
                      </div>
                    ))}
                    {actorCandidates.length === 0 && (
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: inkFaint, alignSelf: "center" }}>No TMDb profile — keep Wikipedia.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
