"use client";

import { useState } from "react";

type ReportType =
  | "wrong_photo"
  | "wrong_name"
  | "wrong_credits"
  | "wrong_synopsis"
  | "wrong_data"
  | "disputed_detail"
  | "other";

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "wrong_photo",      label: "Wrong or inappropriate photo" },
  { value: "wrong_name",       label: "Wrong name or spelling" },
  { value: "wrong_credits",    label: "Wrong director / cast / crew" },
  { value: "wrong_synopsis",   label: "Wrong or misleading synopsis" },
  { value: "wrong_data",       label: "Wrong box office or release data" },
  { value: "disputed_detail",  label: "Disputed story or description" },
  { value: "other",            label: "Other issue" },
];

const gold     = "#8B7040";
const ink      = "#1C1608";
const border   = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const parch    = "#F5F0E4";
const red      = "#C0392B";
const green    = "#2D7A3A";

interface Props {
  /** e.g. "film" or "crew" or "cast" */
  entityType: string;
  /** The page slug or id */
  entitySlug: string;
  /** Human-readable name e.g. film title or crew name */
  entityName: string;
}

export default function ReportModal({ entityType, entitySlug, entityName }: Props) {
  const [open,    setOpen]    = useState(false);
  const [type,    setType]    = useState<ReportType | "">("");
  const [detail,  setDetail]  = useState("");
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [err,     setErr]     = useState<string | null>(null);

  function reset() {
    setType(""); setDetail(""); setEmail(""); setDone(false); setErr(null);
  }

  function close() { setOpen(false); setTimeout(reset, 300); }

  async function submit() {
    if (!type) { setErr("Please select the type of issue."); return; }
    if (!detail.trim()) { setErr("Please describe the problem briefly."); return; }
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/v1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "report",
          title: `[REPORT] ${entityType}:${entitySlug} — ${REPORT_TYPES.find(t => t.value === type)?.label}`,
          submitter: email || "anonymous",
          excerpt: detail,
          metadata: {
            reportType:   type,
            entityType,
            entitySlug,
            entityName,
            detail,
            reporterEmail: email || null,
          },
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setDone(true);
    } catch {
      setErr("Could not send report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Trigger button — small, unobtrusive */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Report a problem with this page"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "transparent",
          border: `0.5px solid ${border}`,
          padding: "4px 10px",
          fontFamily: "var(--font-sans,sans-serif)",
          fontSize: 10,
          color: inkFaint,
          cursor: "pointer",
          letterSpacing: "0.08em",
        }}
      >
        ⚑ Report a problem
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          {/* Modal */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: parch,
              border: `1px solid ${border}`,
              width: "100%",
              maxWidth: 440,
              padding: "28px 28px 24px",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              type="button"
              onClick={close}
              style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", fontSize: 20, color: inkFaint, cursor: "pointer", lineHeight: 1 }}
            >×</button>

            <div style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 8, color: gold, letterSpacing: "0.2em", fontWeight: 700, marginBottom: 6 }}>
              M&apos;BARI · COMMUNITY REPORT
            </div>
            <h2 style={{ fontFamily: "var(--font-serif,Georgia,serif)", fontSize: 18, fontWeight: 700, color: ink, margin: "0 0 4px" }}>
              Report a Problem
            </h2>
            <p style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: inkFaint, margin: "0 0 20px", lineHeight: 1.5 }}>
              About: <strong style={{ color: inkMuted }}>{entityName}</strong>
            </p>

            {done ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: green, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 8 }}>THANK YOU</div>
                <p style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 12, color: inkMuted, lineHeight: 1.6, marginBottom: 16 }}>
                  Your report has been recorded. Our team will review it.
                </p>
                <button type="button" onClick={close}
                  style={{ background: "transparent", border: `0.5px solid ${border}`, padding: "7px 18px", fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: gold, cursor: "pointer", letterSpacing: "0.08em" }}>
                  CLOSE
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-sans,sans-serif)", fontSize: 9, color: gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 6 }}>
                    WHAT IS THE ISSUE? *
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {REPORT_TYPES.map(t => (
                      <label key={t.value} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        fontFamily: "var(--font-sans,sans-serif)", fontSize: 12, color: inkMuted,
                        cursor: "pointer", padding: "6px 10px",
                        border: `0.5px solid ${type === t.value ? gold : border}`,
                        background: type === t.value ? `${gold}10` : "transparent",
                      }}>
                        <input type="radio" name="reportType" value={t.value}
                          checked={type === t.value}
                          onChange={() => setType(t.value)}
                          style={{ accentColor: gold }} />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-sans,sans-serif)", fontSize: 9, color: gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 5 }}>
                    DESCRIBE THE PROBLEM *
                  </label>
                  <textarea
                    value={detail}
                    onChange={e => setDetail(e.target.value)}
                    rows={3}
                    placeholder="What is wrong, and what should it say instead?"
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: `0.5px solid ${border}`,
                      background: "#fff", fontFamily: "var(--font-sans,sans-serif)",
                      fontSize: 12, color: ink, outline: "none",
                      boxSizing: "border-box", resize: "vertical",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-sans,sans-serif)", fontSize: 9, color: gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 5 }}>
                    YOUR EMAIL <span style={{ color: inkFaint, fontWeight: 400, letterSpacing: 0, fontSize: 10 }}>(optional — we may follow up)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: `0.5px solid ${border}`,
                      background: "#fff", fontFamily: "var(--font-sans,sans-serif)",
                      fontSize: 12, color: ink, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                {err && (
                  <div style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: red }}>{err}</div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
                  <button type="button" onClick={close}
                    style={{ background: "transparent", border: `0.5px solid ${border}`, padding: "8px 16px", fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkMuted, cursor: "pointer", letterSpacing: "0.08em" }}>
                    CANCEL
                  </button>
                  <button type="button" onClick={submit} disabled={loading}
                    style={{
                      background: loading ? inkFaint : gold,
                      border: "none", padding: "8px 20px",
                      fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: "#fff",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 700, letterSpacing: "0.1em",
                    }}>
                    {loading ? "SENDING…" : "SEND REPORT"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
