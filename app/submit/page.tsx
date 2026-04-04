"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Design tokens ──────────────────────────────────────────────────────────
const parch    = "#F5F0E4";
const ink      = "#1C1608";
const gold     = "#8B7040";
const green    = "#2D7A3A";
const border   = "#C4A862";
const inkFaint = "#9C8B6E";
const inkMuted = "#6B5D3F";
const inkSoft  = "#3A2E18";
const bg       = "#E8E2D4";

// ── Static options ─────────────────────────────────────────────────────────
const COUNTRIES = [
  "Nigeria","Ghana","South Africa","Kenya","Senegal","Côte d'Ivoire",
  "Ethiopia","Tanzania","Uganda","Cameroon","Egypt","Morocco","Tunisia",
  "Zimbabwe","Zambia","Mozambique","Rwanda","Other",
];

const LANGUAGES = [
  { code:"yo",  name:"Yorùbá" },  { code:"ig",  name:"Igbo" },
  { code:"ha",  name:"Hausa" },   { code:"en",  name:"English" },
  { code:"pcm", name:"Naijá Pidgin" }, { code:"zu", name:"Zulu" },
  { code:"sw",  name:"Swahili" }, { code:"fr",  name:"French" },
  { code:"ar",  name:"Arabic" },  { code:"am",  name:"Amharic" },
  { code:"tw",  name:"Twi" },     { code:"so",  name:"Somali" },
  { code:"pt",  name:"Portuguese" }, { code:"other", name:"Other" },
];

const GENRES = [
  "Drama","Thriller","Comedy","Romance","Action",
  "Family","Horror","Sci-Fi","Documentary","Animation","Crime","Musical",
];

const RATINGS = ["G","PG","PG-13","R","18+","NR (Not Rated)"];

const CREW_ROLES = [
  "Writer","Producer","Executive Producer",
  "Director of Photography","Editor","Music Composer",
  "Production Designer","Costume Designer","Casting Director","Other",
];

const STREAMING_PLATFORMS = [
  "Netflix","Amazon Prime","Showmax","Apple TV+","Disney+","YouTube",
  "IrokoTV","AfricanMoviesTV","Other",
];

const RELATIONSHIPS = [
  "I am the filmmaker",
  "I represent the filmmaker / production company",
  "Film distributor",
  "Film journalist / researcher",
  "Fan",
];

// ── Types ──────────────────────────────────────────────────────────────────
type CrewEntry    = { role: string; name: string };
type CastEntry    = { actor: string; character: string };
type StreamEntry  = { platform: string; url: string };
type FestivalEntry = { name: string; year: string; award: string };

type FormData = {
  // Step 1 — Film
  title: string;
  originalTitle: string;
  year: string;
  country: string;
  runtime: string;
  genres: string[];
  languages: string[];
  rating: string;
  tagline: string;
  synopsis: string;
  // Step 2 — Team
  director: string;
  crew: CrewEntry[];
  cast: CastEntry[];
  // Step 3 — Media & Distribution
  posterUrl: string;
  trailerUrl: string;
  trailerVerified: boolean;
  streaming: StreamEntry[];
  cinemaCountry: string;
  cinemaDate: string;
  festivals: FestivalEntry[];
  // Step 4 — Submitter
  relationship: string;
  name: string;
  email: string;
  notes: string;
};

const initial: FormData = {
  title: "", originalTitle: "", year: "", country: "", runtime: "",
  genres: [], languages: [], rating: "", tagline: "", synopsis: "",
  director: "",
  crew: [{ role: "", name: "" }],
  cast: [{ actor: "", character: "" }],
  posterUrl: "", trailerUrl: "", trailerVerified: false,
  streaming: [{ platform: "", url: "" }],
  cinemaCountry: "", cinemaDate: "",
  festivals: [{ name: "", year: "", award: "" }],
  relationship: "", name: "", email: "", notes: "",
};

// ── Style helpers ──────────────────────────────────────────────────────────
function inp(): React.CSSProperties {
  return {
    width: "100%", padding: "9px 12px",
    border: `0.5px solid ${border}`, background: "#fff",
    fontFamily: "var(--font-sans,sans-serif)",
    fontSize: 12, color: ink, outline: "none", boxSizing: "border-box",
  };
}
function lbl(): React.CSSProperties {
  return {
    display: "block", fontFamily: "var(--font-sans,sans-serif)",
    fontSize: 9, color: gold, letterSpacing: "0.14em",
    fontWeight: 700, marginBottom: 5,
  };
}
function hint(text: string) {
  return (
    <span style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkFaint, marginLeft: 6, fontWeight: 400, letterSpacing: 0 }}>
      {text}
    </span>
  );
}
function sectionHead(title: string) {
  return (
    <div style={{
      fontFamily: "var(--font-sans,sans-serif)", fontSize: 9, color: gold,
      letterSpacing: "0.18em", fontWeight: 700,
      borderBottom: `0.5px solid ${border}`, paddingBottom: 6, marginBottom: 14,
    }}>{title}</div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function SubmitPage() {
  const [step,      setStep]      = useState(1);
  const [data,      setData]      = useState<FormData>(initial);
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setData(p => ({ ...p, [k]: v }));
  }

  function toggleMulti(field: "genres" | "languages", val: string) {
    setData(p => ({
      ...p,
      [field]: p[field].includes(val)
        ? p[field].filter(x => x !== val)
        : [...p[field], val],
    }));
  }

  // Crew helpers
  function updateCrew(i: number, k: keyof CrewEntry, v: string) {
    const next = [...data.crew]; next[i] = { ...next[i], [k]: v }; set("crew", next);
  }
  function addCrew()           { set("crew", [...data.crew, { role: "", name: "" }]); }
  function removeCrew(i: number) { set("crew", data.crew.filter((_, j) => j !== i)); }

  // Cast helpers
  function updateCast(i: number, k: keyof CastEntry, v: string) {
    const next = [...data.cast]; next[i] = { ...next[i], [k]: v }; set("cast", next);
  }
  function addCast()           { set("cast", [...data.cast, { actor: "", character: "" }]); }
  function removeCast(i: number) { set("cast", data.cast.filter((_, j) => j !== i)); }

  // Streaming helpers
  function updateStream(i: number, k: keyof StreamEntry, v: string) {
    const next = [...data.streaming]; next[i] = { ...next[i], [k]: v }; set("streaming", next);
  }
  function addStream()           { set("streaming", [...data.streaming, { platform: "", url: "" }]); }
  function removeStream(i: number) { set("streaming", data.streaming.filter((_, j) => j !== i)); }

  // Festival helpers
  function updateFest(i: number, k: keyof FestivalEntry, v: string) {
    const next = [...data.festivals]; next[i] = { ...next[i], [k]: v }; set("festivals", next);
  }
  function addFest()           { set("festivals", [...data.festivals, { name: "", year: "", award: "" }]); }
  function removeFest(i: number) { set("festivals", data.festivals.filter((_, j) => j !== i)); }

  // Poster upload
  async function handlePosterUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/v1/submit/upload-poster", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      set("posterUrl", url);
    } catch {
      setError("Poster upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/v1/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "film",
          title: data.title || "Untitled",
          submitter: data.name,
          excerpt: data.synopsis,
          metadata: {
            originalTitle:  data.originalTitle || null,
            year:           data.year ? parseInt(data.year) : null,
            country:        data.country,
            runtime:        data.runtime ? parseInt(data.runtime) : null,
            genres:         data.genres,
            languages:      data.languages,
            rating:         data.rating || null,
            tagline:        data.tagline || null,
            director:       data.director,
            crew:           data.crew.filter(c => c.name && c.role),
            cast:           data.cast.filter(c => c.actor),
            posterUrl:      data.posterUrl || null,
            trailerUrl:     data.trailerUrl || null,
            trailerVerified: data.trailerVerified,
            streaming:      data.streaming.filter(s => s.platform),
            cinemaCountry:  data.cinemaCountry || null,
            cinemaDate:     data.cinemaDate || null,
            festivals:      data.festivals.filter(f => f.name),
            relationship:   data.relationship,
            submitterEmail: data.email,
            notes:          data.notes || null,
          },
        }),
      });
      if (!res.ok) throw new Error("Server error");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ background: bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: parch, border: `1px solid ${border}`, padding: "40px 48px", textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: green, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 12 }}>SUBMITTED</div>
          <h2 style={{ fontFamily: "var(--font-serif,Georgia,serif)", fontSize: 22, fontWeight: 700, color: ink, margin: "0 0 12px" }}>Thank you.</h2>
          <p style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 13, color: inkMuted, lineHeight: 1.6, margin: "0 0 20px" }}>
            We&apos;ll review your submission within 5 working days and get back to you.
          </p>
          <Link href="/" style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: gold, textDecoration: "none", fontWeight: 700, letterSpacing: "0.06em" }}>
            ← Back to M&apos;Bari
          </Link>
        </div>
      </div>
    );
  }

  const STEPS = ["Film Details", "The Team", "Media & Release", "About You"];

  return (
    <div style={{ background: bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px 60px" }}>
      <div style={{ width: "100%", maxWidth: 600, marginBottom: 12 }}>
        <Link href="/" style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: inkFaint, textDecoration: "none" }}>← Back to M&apos;Bari</Link>
      </div>

      <div style={{ width: "100%", maxWidth: 600, background: parch, border: `1px solid ${inkSoft}`, position: "relative", padding: "28px 32px 36px" }}>
        <div style={{ position: "absolute", inset: 4, border: `0.5px solid ${border}`, pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 8, color: gold, letterSpacing: "0.2em", fontWeight: 700, marginBottom: 6 }}>
            M&apos;BARI · FILM SUBMISSION
          </div>
          <h1 style={{ fontFamily: "var(--font-serif,Georgia,serif)", fontSize: 22, fontWeight: 700, color: ink, margin: 0 }}>
            Submit a Film
          </h1>
          <p style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: inkFaint, marginTop: 6, lineHeight: 1.5 }}>
            Help us document African cinema. All fields marked * are required.
          </p>
        </div>

        {/* Step tabs */}
        <div style={{ display: "flex", marginBottom: 24, borderBottom: `1px solid ${border}` }}>
          {STEPS.map((s, i) => (
            <button key={s} type="button" onClick={() => i + 1 < step && setStep(i + 1)}
              style={{
                flex: 1, padding: "8px 4px", border: "none",
                background: step === i + 1 ? parch : "transparent",
                borderBottom: step === i + 1 ? `2px solid ${gold}` : "2px solid transparent",
                fontFamily: "var(--font-sans,sans-serif)", fontSize: 9,
                color: step === i + 1 ? gold : step > i + 1 ? inkMuted : inkFaint,
                fontWeight: step === i + 1 ? 700 : 400,
                letterSpacing: "0.1em", cursor: i + 1 < step ? "pointer" : "default",
              }}>
              {i + 1}. {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── STEP 1: Film Details ──────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl()}>FILM TITLE *</label>
                <input type="text" value={data.title} onChange={e => set("title", e.target.value)}
                  placeholder="As it appears in credits" style={inp()} />
              </div>
              <div>
                <label style={lbl()}>ORIGINAL TITLE {hint("if different")}</label>
                <input type="text" value={data.originalTitle} onChange={e => set("originalTitle", e.target.value)}
                  placeholder="e.g. title in Yorùbá" style={inp()} />
              </div>
              <div>
                <label style={lbl()}>YEAR *</label>
                <input type="number" value={data.year} onChange={e => set("year", e.target.value)}
                  placeholder="2025" min={1960} max={2030} style={inp()} />
              </div>
              <div>
                <label style={lbl()}>COUNTRY OF PRODUCTION *</label>
                <select value={data.country} onChange={e => set("country", e.target.value)} style={{ ...inp(), appearance: "none" }}>
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl()}>RUNTIME {hint("minutes")}</label>
                <input type="number" value={data.runtime} onChange={e => set("runtime", e.target.value)}
                  placeholder="e.g. 105" min={1} style={inp()} />
              </div>
            </div>

            <div>
              <label style={lbl()}>GENRES</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {GENRES.map(g => (
                  <button key={g} type="button" onClick={() => toggleMulti("genres", g)}
                    style={{
                      padding: "4px 12px",
                      border: `0.5px solid ${data.genres.includes(g) ? gold : border}`,
                      background: data.genres.includes(g) ? `${gold}18` : "transparent",
                      fontFamily: "var(--font-sans,sans-serif)", fontSize: 11,
                      color: data.genres.includes(g) ? gold : inkMuted, cursor: "pointer",
                    }}>{g}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl()}>LANGUAGES SPOKEN IN THE FILM</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {LANGUAGES.map(l => (
                  <button key={l.code} type="button" onClick={() => toggleMulti("languages", l.code)}
                    style={{
                      padding: "4px 12px",
                      border: `0.5px solid ${data.languages.includes(l.code) ? gold : border}`,
                      background: data.languages.includes(l.code) ? `${gold}18` : "transparent",
                      fontFamily: "var(--font-sans,sans-serif)", fontSize: 11,
                      color: data.languages.includes(l.code) ? gold : inkMuted, cursor: "pointer",
                    }}>{l.name}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl()}>AGE / CONTENT RATING</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {RATINGS.map(r => (
                  <button key={r} type="button" onClick={() => set("rating", data.rating === r ? "" : r)}
                    style={{
                      padding: "4px 14px",
                      border: `0.5px solid ${data.rating === r ? gold : border}`,
                      background: data.rating === r ? `${gold}18` : "transparent",
                      fontFamily: "var(--font-sans,sans-serif)", fontSize: 11,
                      color: data.rating === r ? gold : inkMuted, cursor: "pointer",
                    }}>{r}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl()}>TAGLINE {hint("one-line marketing hook")}</label>
              <input type="text" value={data.tagline} onChange={e => set("tagline", e.target.value)}
                placeholder='"The camera never lies. Or does it?"' style={inp()} />
            </div>

            <div>
              <label style={lbl()}>SYNOPSIS *</label>
              <textarea value={data.synopsis} onChange={e => set("synopsis", e.target.value)}
                placeholder="A 2–4 sentence description of the film's story and themes."
                rows={5} style={{ ...inp(), resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* ── STEP 2: Team ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {sectionHead("DIRECTOR")}
            <div>
              <label style={lbl()}>DIRECTOR *</label>
              <input type="text" value={data.director} onChange={e => set("director", e.target.value)}
                placeholder="Full name" style={inp()} />
            </div>

            {sectionHead("OTHER CREW")}
            {data.crew.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label style={lbl()}>ROLE</label>}
                  <select value={c.role} onChange={e => updateCrew(i, "role", e.target.value)} style={{ ...inp(), appearance: "none" }}>
                    <option value="">Select role</option>
                    {CREW_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  {i === 0 && <label style={lbl()}>FULL NAME</label>}
                  <input type="text" value={c.name} onChange={e => updateCrew(i, "name", e.target.value)}
                    placeholder="Full name" style={inp()} />
                </div>
                <button type="button" onClick={() => removeCrew(i)}
                  style={{ padding: "9px 10px", border: `0.5px solid ${border}`, background: "transparent", color: inkFaint, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addCrew}
              style={{ alignSelf: "flex-start", padding: "6px 14px", border: `0.5px solid ${border}`, background: "transparent", fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkMuted, cursor: "pointer", letterSpacing: "0.08em" }}>
              + ADD CREW MEMBER
            </button>

            {sectionHead("CAST")}
            {data.cast.map((c, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label style={lbl()}>ACTOR NAME</label>}
                  <input type="text" value={c.actor} onChange={e => updateCast(i, "actor", e.target.value)}
                    placeholder="Full name" style={inp()} />
                </div>
                <div>
                  {i === 0 && <label style={lbl()}>CHARACTER NAME</label>}
                  <input type="text" value={c.character} onChange={e => updateCast(i, "character", e.target.value)}
                    placeholder="Role in film (optional)" style={inp()} />
                </div>
                <button type="button" onClick={() => removeCast(i)}
                  style={{ padding: "9px 10px", border: `0.5px solid ${border}`, background: "transparent", color: inkFaint, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addCast}
              style={{ alignSelf: "flex-start", padding: "6px 14px", border: `0.5px solid ${border}`, background: "transparent", fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkMuted, cursor: "pointer", letterSpacing: "0.08em" }}>
              + ADD CAST MEMBER
            </button>
          </div>
        )}

        {/* ── STEP 3: Media & Release ───────────────────────────────────── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {sectionHead("POSTER / THUMBNAIL")}
            <div>
              <label style={lbl()}>OFFICIAL POSTER IMAGE {hint("JPG, PNG or WebP · max 5 MB")}</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePosterUpload(f); }}
                style={{ display: "none" }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{
                    padding: "9px 18px", border: `0.5px solid ${border}`,
                    background: uploading ? `${border}40` : "transparent",
                    fontFamily: "var(--font-sans,sans-serif)", fontSize: 11,
                    color: uploading ? inkFaint : inkMuted,
                    cursor: uploading ? "not-allowed" : "pointer", letterSpacing: "0.08em",
                  }}>
                  {uploading ? "UPLOADING…" : "CHOOSE FILE"}
                </button>
                {data.posterUrl && (
                  <>
                    <div style={{ position: "relative", width: 54, height: 80, flexShrink: 0 }}>
                      <Image src={data.posterUrl} alt="Poster preview" fill unoptimized style={{ objectFit: "cover" }} sizes="54px" />
                    </div>
                    <span style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: green }}>✓ Uploaded</span>
                  </>
                )}
              </div>
            </div>

            {sectionHead("TRAILER")}
            <div>
              <label style={lbl()}>TRAILER URL {hint("YouTube, Vimeo, etc.")}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="url" value={data.trailerUrl}
                  onChange={e => { set("trailerUrl", e.target.value); set("trailerVerified", false); }}
                  placeholder="https://youtube.com/watch?v=…" style={{ ...inp(), flex: 1 }} />
                {data.trailerUrl && (
                  <a href={data.trailerUrl} target="_blank" rel="noopener noreferrer"
                    onClick={() => set("trailerVerified", true)}
                    style={{
                      padding: "9px 14px", border: `0.5px solid ${data.trailerVerified ? green : gold}`,
                      background: data.trailerVerified ? `${green}10` : "transparent",
                      fontFamily: "var(--font-sans,sans-serif)", fontSize: 10,
                      color: data.trailerVerified ? green : gold,
                      textDecoration: "none", fontWeight: 700,
                      letterSpacing: "0.08em", whiteSpace: "nowrap",
                    }}>
                    {data.trailerVerified ? "✓ VERIFIED" : "VERIFY ↗"}
                  </a>
                )}
              </div>
              <div style={{ fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkFaint, marginTop: 4 }}>
                Click VERIFY ↗ to open and confirm the link works.
              </div>
            </div>

            {sectionHead("WHERE TO WATCH")}
            {data.streaming.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: 8, alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label style={lbl()}>PLATFORM</label>}
                  <select value={s.platform} onChange={e => updateStream(i, "platform", e.target.value)} style={{ ...inp(), appearance: "none" }}>
                    <option value="">Select</option>
                    {STREAMING_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  {i === 0 && <label style={lbl()}>DIRECT LINK {hint("optional")}</label>}
                  <input type="url" value={s.url} onChange={e => updateStream(i, "url", e.target.value)}
                    placeholder="https://…" style={inp()} />
                </div>
                <button type="button" onClick={() => removeStream(i)}
                  style={{ padding: "9px 10px", border: `0.5px solid ${border}`, background: "transparent", color: inkFaint, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addStream}
              style={{ alignSelf: "flex-start", padding: "6px 14px", border: `0.5px solid ${border}`, background: "transparent", fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkMuted, cursor: "pointer", letterSpacing: "0.08em" }}>
              + ADD PLATFORM
            </button>

            {sectionHead("CINEMA RELEASE")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl()}>COUNTRY</label>
                <input type="text" value={data.cinemaCountry} onChange={e => set("cinemaCountry", e.target.value)}
                  placeholder="e.g. Nigeria" style={inp()} />
              </div>
              <div>
                <label style={lbl()}>RELEASE DATE</label>
                <input type="date" value={data.cinemaDate} onChange={e => set("cinemaDate", e.target.value)} style={inp()} />
              </div>
            </div>

            {sectionHead("FESTIVALS & AWARDS")}
            {data.festivals.map((f, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.5fr 1fr auto", gap: 8, alignItems: "flex-end" }}>
                <div>
                  {i === 0 && <label style={lbl()}>FESTIVAL NAME</label>}
                  <input type="text" value={f.name} onChange={e => updateFest(i, "name", e.target.value)}
                    placeholder="e.g. AFRIFF" style={inp()} />
                </div>
                <div>
                  {i === 0 && <label style={lbl()}>YEAR</label>}
                  <input type="text" value={f.year} onChange={e => updateFest(i, "year", e.target.value)}
                    placeholder="2024" style={inp()} />
                </div>
                <div>
                  {i === 0 && <label style={lbl()}>AWARD {hint("if any")}</label>}
                  <input type="text" value={f.award} onChange={e => updateFest(i, "award", e.target.value)}
                    placeholder="Best Film, Nomination…" style={inp()} />
                </div>
                <button type="button" onClick={() => removeFest(i)}
                  style={{ padding: "9px 10px", border: `0.5px solid ${border}`, background: "transparent", color: inkFaint, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" onClick={addFest}
              style={{ alignSelf: "flex-start", padding: "6px 14px", border: `0.5px solid ${border}`, background: "transparent", fontFamily: "var(--font-sans,sans-serif)", fontSize: 10, color: inkMuted, cursor: "pointer", letterSpacing: "0.08em" }}>
              + ADD FESTIVAL
            </button>
          </div>
        )}

        {/* ── STEP 4: About You ─────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl()}>YOUR RELATIONSHIP TO THIS FILM *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RELATIONSHIPS.map(rel => (
                  <label key={rel} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    fontFamily: "var(--font-sans,sans-serif)", fontSize: 12,
                    color: inkMuted, cursor: "pointer", padding: "7px 10px",
                    border: `0.5px solid ${data.relationship === rel ? gold : border}`,
                    background: data.relationship === rel ? `${gold}10` : "transparent",
                  }}>
                    <input type="radio" name="relationship" value={rel}
                      checked={data.relationship === rel}
                      onChange={e => set("relationship", e.target.value)}
                      style={{ accentColor: gold }} />
                    {rel}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl()}>YOUR FULL NAME *</label>
              <input type="text" value={data.name} onChange={e => set("name", e.target.value)}
                placeholder="Full name" style={inp()} />
            </div>
            <div>
              <label style={lbl()}>EMAIL ADDRESS *</label>
              <input type="email" value={data.email} onChange={e => set("email", e.target.value)}
                placeholder="you@example.com" style={inp()} />
            </div>
            <div>
              <label style={lbl()}>ADDITIONAL NOTES {hint("anything else we should know")}</label>
              <textarea value={data.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Sources, context, corrections, how to reach you…"
                rows={4} style={{ ...inp(), resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 14, fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: "#C0392B" }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 10 }}>
          {step > 1 ? (
            <button type="button" onClick={() => setStep(s => s - 1)}
              style={{ border: `0.5px solid ${border}`, background: "transparent", padding: "10px 20px", fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: inkMuted, cursor: "pointer", letterSpacing: "0.08em" }}>
              ← BACK
            </button>
          ) : <div />}

          {step < 4 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              style={{ background: gold, border: "none", padding: "10px 28px", fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: "#fff", cursor: "pointer", fontWeight: 700, letterSpacing: "0.1em" }}>
              NEXT →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit}
              disabled={loading || !data.title || !data.name || !data.email}
              style={{
                background: (loading || !data.title || !data.name || !data.email) ? border : green,
                border: "none", padding: "10px 28px",
                fontFamily: "var(--font-sans,sans-serif)", fontSize: 11, color: "#fff",
                cursor: (loading || !data.title || !data.name || !data.email) ? "not-allowed" : "pointer",
                fontWeight: 700, letterSpacing: "0.1em",
              }}>
              {loading ? "SUBMITTING…" : "SUBMIT FILM"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
