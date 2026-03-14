"use client";

import { useState } from "react";
import Link from "next/link";

const parch = "#F5F0E4";
const ink = "#1C1608";
const gold = "#8B7040";
const green = "#2D7A3A";
const border = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const inkSoft = "#3A2E18";

const LANGUAGES = [
  { code: "yo", name: "Yorùbá" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "en", name: "English" },
  { code: "pcm", name: "Naijá Pidgin" },
  { code: "zu", name: "Zulu" },
  { code: "sw", name: "Swahili" },
  { code: "fr", name: "French" },
];

const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "South Africa",
  "Kenya",
  "Senegal",
  "Côte d'Ivoire",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Cameroon",
  "Other",
];

const RELATIONSHIPS = [
  "I am the filmmaker",
  "I represent the filmmaker",
  "Independent researcher",
  "Fan",
];

type FormData = {
  title: string;
  year: string;
  country: string;
  language: string;
  director: string;
  cast: string;
  trailer: string;
  streamingLink: string;
  synopsis: string;
  relationship: string;
  name: string;
  email: string;
};

const initialData: FormData = {
  title: "",
  year: "",
  country: "",
  language: "",
  director: "",
  cast: "",
  trailer: "",
  streamingLink: "",
  synopsis: "",
  relationship: "",
  name: "",
  email: "",
};

function inputStyle(focused?: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "9px 12px",
    border: `0.5px solid ${focused ? gold : border}`,
    background: "#fff",
    fontFamily: "var(--font-sans, sans-serif)",
    fontSize: 12,
    color: ink,
    outline: "none",
    boxSizing: "border-box",
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block",
    fontFamily: "var(--font-sans, sans-serif)",
    fontSize: 9,
    color: gold,
    letterSpacing: "0.14em",
    fontWeight: 700,
    marginBottom: 5,
  };
}

export default function SubmitPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "film",
          title: data.title || "Untitled",
          submitter: data.name,
          excerpt: data.synopsis,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setSuccess(true);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          background: "#E8E2D4",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: parch,
            border: `1px solid ${border}`,
            padding: "40px 48px",
            textAlign: "center",
            maxWidth: 400,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              color: green,
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            SUBMITTED
          </div>
          <h2
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 22,
              fontWeight: 700,
              color: ink,
              margin: "0 0 12px",
            }}
          >
            Submitted successfully.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 13,
              color: inkMuted,
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}
          >
            We&apos;ll review within 5 working days.
          </p>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              color: gold,
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            ← Back to M&apos;Bari
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#E8E2D4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 16px 40px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 540, marginBottom: 12 }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: inkFaint,
            textDecoration: "none",
          }}
        >
          ← Back to M&apos;Bari
        </Link>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: parch,
          border: `1px solid ${inkSoft}`,
          position: "relative",
          padding: "28px 32px 32px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 4,
            border: `0.5px solid ${border}`,
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: gold,
              letterSpacing: "0.2em",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            M&apos;BARI · SUBMISSION
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 22,
              fontWeight: 700,
              color: ink,
              margin: 0,
            }}
          >
            Submit a Film
          </h1>
        </div>

        {/* Progress bar */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                background: s <= step ? gold : `${border}60`,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            color: inkFaint,
            letterSpacing: "0.12em",
            marginBottom: 20,
          }}
        >
          STEP {step} OF 3
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle()}>FILM TITLE *</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Enter film title"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>YEAR *</label>
              <input
                type="number"
                value={data.year}
                onChange={(e) => update("year", e.target.value)}
                placeholder="e.g. 2025"
                min={1900}
                max={2030}
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>COUNTRY *</label>
              <select
                value={data.country}
                onChange={(e) => update("country", e.target.value)}
                style={{ ...inputStyle(), appearance: "none" }}
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle()}>PRIMARY LANGUAGE *</label>
              <select
                value={data.language}
                onChange={(e) => update("language", e.target.value)}
                style={{ ...inputStyle(), appearance: "none" }}
              >
                <option value="">Select language</option>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle()}>DIRECTOR *</label>
              <input
                type="text"
                value={data.director}
                onChange={(e) => update("director", e.target.value)}
                placeholder="Full name of director"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>CAST NAMES</label>
              <textarea
                value={data.cast}
                onChange={(e) => update("cast", e.target.value)}
                placeholder="Enter cast names, one per line"
                rows={4}
                style={{ ...inputStyle(), resize: "vertical" }}
              />
            </div>
            <div>
              <label style={labelStyle()}>TRAILER URL</label>
              <input
                type="url"
                value={data.trailer}
                onChange={(e) => update("trailer", e.target.value)}
                placeholder="https://youtube.com/..."
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>STREAMING LINK</label>
              <input
                type="url"
                value={data.streamingLink}
                onChange={(e) => update("streamingLink", e.target.value)}
                placeholder="https://..."
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>SYNOPSIS *</label>
              <textarea
                value={data.synopsis}
                onChange={(e) => update("synopsis", e.target.value)}
                placeholder="Brief description of the film..."
                rows={5}
                style={{ ...inputStyle(), resize: "vertical" }}
              />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle()}>YOUR RELATIONSHIP TO THIS FILM *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RELATIONSHIPS.map((rel) => (
                  <label
                    key={rel}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 12,
                      color: inkMuted,
                      cursor: "pointer",
                      padding: "7px 10px",
                      border: `0.5px solid ${data.relationship === rel ? gold : border}`,
                      background: data.relationship === rel ? `${gold}10` : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="relationship"
                      value={rel}
                      checked={data.relationship === rel}
                      onChange={(e) => update("relationship", e.target.value)}
                      style={{ accentColor: gold }}
                    />
                    {rel}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle()}>YOUR NAME *</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Full name"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle()}>EMAIL ADDRESS *</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                style={inputStyle()}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 14,
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              color: "#C0392B",
            }}
          >
            {error}
          </div>
        )}

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 24,
            gap: 10,
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                border: `0.5px solid ${border}`,
                background: "transparent",
                padding: "10px 20px",
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: inkMuted,
                cursor: "pointer",
                letterSpacing: "0.08em",
              }}
            >
              ← BACK
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              style={{
                background: gold,
                border: "none",
                padding: "10px 24px",
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              NEXT →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: loading ? inkFaint : green,
                border: "none",
                padding: "10px 24px",
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              {loading ? "SUBMITTING..." : "SUBMIT FILM"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
