"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── Palette ──────────────────────────────────────────────────────────────────

const P = {
  parch: "#F5F0E4",
  parchLight: "#FAF6ED",
  parchDark: "#EDE5D0",
  ink: "#1C1608",
  inkSoft: "#3A2E18",
  inkMuted: "#6B5D3F",
  inkFaint: "#9C8B6E",
  gold: "#8B7040",
  goldLight: "#C4A862",
  green: "#2D7A3A",
  orange: "#D4882A",
  red: "#B83232",
  border: "#D8CDB4",
  borderLight: "#E8DFCC",
  navBg: "#1C1608",
  white: "#FFFDF7",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface NowPlayingMissing {
  tmdbId: number;
  title: string;
  release_date: string;
  poster_url: string | null;
  overview: string;
  vote_average: number;
  original_language: string;
  region: string;
}

interface NowPlayingInDb {
  tmdbId: number;
  title: string;
  slug: string;
  boxLive: boolean;
  missingLiveFlag: boolean;
}

interface NowPlayingResult {
  missing: NowPlayingMissing[];
  inDb: NowPlayingInDb[];
  total: number;
  regions: string[];
  checkedAt: string;
}

interface TmdbResult {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  already_imported: boolean;
}

interface LangEntry { code: string; percentage: number }
interface AvailEntry { countryCode: string; platform: string; accessType: string; url: string }

interface ImportOverrides {
  languages: LangEntry[];
  availability: AvailEntry[];
  criticScore: string;
  audienceScore: string;
  verifiedScore: string;
  heatScore: string;
  boxWeekend: string;
  boxCumulative: string;
  boxWeek: string;
  boxLive: boolean;
  rated: string;
  slugOverride: string;
  yearOverride: string;
}

const EMPTY_OVERRIDES = (): ImportOverrides => ({
  languages: [{ code: "en", percentage: 100 }],
  availability: [],
  criticScore: "",
  audienceScore: "",
  verifiedScore: "",
  heatScore: "",
  boxWeekend: "",
  boxCumulative: "",
  boxWeek: "",
  boxLive: false,
  rated: "",
  slugOverride: "",
  yearOverride: "",
});

const REGIONS = [
  { code: "NG", label: "Nigeria", flag: "🇳🇬" },
  { code: "GH", label: "Ghana", flag: "🇬🇭" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
  { code: "KE", label: "Kenya", flag: "🇰🇪" },
  { code: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", label: "Senegal", flag: "🇸🇳" },
  { code: "ET", label: "Ethiopia", flag: "🇪🇹" },
  { code: "CM", label: "Cameroon", flag: "🇨🇲" },
];

const LANGUAGES = [
  { code: "yo", name: "Yorùbá" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "pcm", name: "Naijá Pidgin" },
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "zu", name: "Zulu" },
  { code: "xh", name: "Xhosa" },
  { code: "sw", name: "Swahili" },
  { code: "am", name: "Amharic" },
];

const PLATFORMS = ["Netflix", "Prime Video", "Showmax", "iROKOtv", "YouTube", "Cinema", "Apple TV+", "Disney+", "Other"];
const ACCESS_TYPES = [
  { v: "sub", label: "Subscription" },
  { v: "rent", label: "Rental" },
  { v: "free", label: "Free" },
  { v: "ticket", label: "Cinema ticket" },
];
const SORT_OPTIONS = [
  { v: "popularity.desc", label: "Most popular" },
  { v: "revenue.desc", label: "Highest revenue" },
  { v: "release_date.desc", label: "Most recent" },
];

// Map TMDb original_language codes to M'Bari language codes
function defaultLanguages(originalLanguage: string): LangEntry[] {
  const map: Record<string, string> = {
    yo: "yo", ig: "ig", ha: "ha", pcm: "pcm",
    fr: "fr", sw: "sw", am: "am", zu: "zu", xh: "xh", en: "en",
  };
  const code = map[originalLanguage] ?? "en";
  return [{ code, percentage: 100 }];
}

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 8,
      fontFamily: "var(--font-sans, sans-serif)",
      color: P.gold,
      letterSpacing: "0.14em",
      fontWeight: 700,
      marginBottom: 4,
    }}>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", style = {},
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: `1px solid ${P.border}`,
        background: P.white,
        color: P.ink,
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: 12,
        padding: "6px 8px",
        outline: "none",
        ...style,
      }}
    />
  );
}

function Btn({
  onClick, children, variant = "primary", disabled = false, small = false,
}: {
  onClick?: () => void; children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger" | "success";
  disabled?: boolean; small?: boolean;
}) {
  const bg: Record<string, string> = {
    primary: P.gold, ghost: "transparent", danger: P.red, success: P.green,
  };
  const col: Record<string, string> = {
    primary: "#fff", ghost: P.inkMuted, danger: "#fff", success: "#fff",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? P.border : bg[variant],
        color: disabled ? P.inkFaint : col[variant],
        border: variant === "ghost" ? `1px solid ${P.border}` : "none",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: small ? "4px 10px" : "7px 14px",
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

// ─── Now Playing Check Panel ──────────────────────────────────────────────────

function NowPlayingPanel({ onImport }: { onImport: (film: TmdbResult, autoBoxLive: boolean) => void }) {
  const [result, setResult] = useState<NowPlayingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [markingLive, setMarkingLive] = useState<string | null>(null);

  const check = async () => {
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const res = await fetch("/api/admin/now-playing?regions=NG,GH,ZA,KE");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const markLive = async (slug: string) => {
    setMarkingLive(slug);
    try {
      const res = await fetch("/api/admin/set-box-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, boxLive: true }),
      });
      if (!res.ok) throw new Error("Failed to mark live");
      // Update local state to reflect the change
      setResult((r) => r ? {
        ...r,
        inDb: r.inDb.map((f) => f.slug === slug ? { ...f, boxLive: true, missingLiveFlag: false } : f),
      } : r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setMarkingLive(null);
    }
  };

  return (
    <div style={{
      background: result?.missing.length ? `${P.red}08` : P.parchLight,
      border: `1px solid ${result?.missing.length ? P.red : P.border}`,
      padding: "12px 16px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: P.gold,
            marginBottom: 2,
          }}>
            NOW PLAYING CHECK
          </div>
          <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkMuted }}>
            Cross-reference TMDb&apos;s &quot;now playing&quot; list for NG, GH, ZA, KE against M&apos;Bari&apos;s database.
            {result && (
              <span style={{ marginLeft: 6, color: result.missing.length ? P.red : P.green, fontWeight: 700 }}>
                {result.missing.length === 0
                  ? `✓ All ${result.total} films in cinemas are imported`
                  : `⚠ ${result.missing.length} film${result.missing.length !== 1 ? "s" : ""} in cinemas but NOT in M'Bari`}
              </span>
            )}
          </div>
        </div>
        <Btn onClick={check} variant={result?.missing.length ? "danger" : "ghost"} small disabled={loading}>
          {loading ? "Checking…" : result ? "Re-check" : "Check Now"}
        </Btn>
      </div>

      {error && (
        <div style={{ marginTop: 8, fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.red }}>
          {error}
        </div>
      )}

      {open && result && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Missing films */}
          {result.missing.length > 0 && (
            <div>
              <div style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: P.red,
                marginBottom: 6,
              }}>
                MISSING FROM M&apos;BARI ({result.missing.length})
              </div>
              {result.missing.map((film) => (
                <div key={film.tmdbId} style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "6px 10px",
                  background: `${P.red}08`,
                  border: `0.5px solid ${P.red}40`,
                  marginBottom: 4,
                }}>
                  {film.poster_url && (
                    <Image src={film.poster_url} alt={film.title} width={32} height={48}
                      style={{ objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 13, fontWeight: 700, color: P.ink }}>
                      {film.title}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.inkFaint }}>
                      {film.release_date?.slice(0, 4)} · {film.original_language.toUpperCase()} · TMDb #{film.tmdbId} · Region: {film.region}
                    </div>
                  </div>
                  <Btn
                    small
                    variant="primary"
                    onClick={() => onImport({
                      id: film.tmdbId,
                      title: film.title,
                      release_date: film.release_date,
                      poster_url: film.poster_url,
                      backdrop_url: null,
                      overview: film.overview,
                      vote_average: film.vote_average,
                      vote_count: 0,
                      genre_ids: [],
                      original_language: film.original_language,
                      already_imported: false,
                    }, true)}
                  >
                    Import
                  </Btn>
                </div>
              ))}
            </div>
          )}

          {/* In DB but missing live flag */}
          {result.inDb.filter((f) => f.missingLiveFlag).length > 0 && (
            <div>
              <div style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: P.orange,
                marginBottom: 6,
                marginTop: 8,
              }}>
                IN DB BUT NOT MARKED LIVE ({result.inDb.filter((f) => f.missingLiveFlag).length})
              </div>
              {result.inDb.filter((f) => f.missingLiveFlag).map((film) => (
                <div key={film.tmdbId} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 10px",
                  background: `${P.orange}08`,
                  border: `0.5px solid ${P.orange}40`,
                  marginBottom: 4,
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 11,
                }}>
                  <span style={{ color: P.ink, flex: 1 }}>{film.title}</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <Link href={`/film/${film.slug}`} style={{ color: P.gold, fontSize: 10, textDecoration: "none", whiteSpace: "nowrap" }}>
                      Edit →
                    </Link>
                    <Btn
                      small
                      variant="success"
                      disabled={markingLive === film.slug}
                      onClick={() => markLive(film.slug)}
                    >
                      {markingLive === film.slug ? "…" : "Mark Live"}
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.missing.length === 0 && result.inDb.filter((f) => f.missingLiveFlag).length === 0 && (
            <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.green, padding: "6px 0" }}>
              ✓ All {result.total} films currently in cinemas are imported and marked live.
            </div>
          )}

          <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.inkFaint, marginTop: 4 }}>
            Last checked: {new Date(result.checkedAt).toLocaleString()} · Regions: {result.regions.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({
  film,
  onClose,
  onSuccess,
  autoBoxLive = false,
}: {
  film: TmdbResult;
  onClose: () => void;
  onSuccess: (slug: string) => void;
  autoBoxLive?: boolean;
}) {
  const [overrides, setOverrides] = useState<ImportOverrides>(() => ({
    languages: defaultLanguages(film.original_language),
    availability: autoBoxLive
      ? [{ countryCode: "NG", platform: "Cinema", accessType: "ticket", url: "" }]
      : [],
    criticScore: "",
    audienceScore: "",
    verifiedScore: "",
    heatScore: "",
    boxWeekend: "",
    boxCumulative: "",
    boxWeek: "",
    boxLive: autoBoxLive,
    rated: "",
    slugOverride: "",
    yearOverride: film.release_date?.slice(0, 4) ?? "",
  }));
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);

  const set = <K extends keyof ImportOverrides>(key: K, val: ImportOverrides[K]) =>
    setOverrides((o) => ({ ...o, [key]: val }));

  const addLang = () =>
    set("languages", [...overrides.languages, { code: "yo", percentage: 0 }]);

  const updateLang = (i: number, field: keyof LangEntry, val: string | number) =>
    set("languages", overrides.languages.map((l, idx) =>
      idx === i ? { ...l, [field]: field === "percentage" ? Number(val) : val } : l
    ));

  const removeLang = (i: number) =>
    set("languages", overrides.languages.filter((_, idx) => idx !== i));

  const addAvail = () =>
    set("availability", [...overrides.availability, { countryCode: "NG", platform: "Netflix", accessType: "sub", url: "" }]);

  const updateAvail = (i: number, field: keyof AvailEntry, val: string) =>
    set("availability", overrides.availability.map((a, idx) =>
      idx === i ? { ...a, [field]: val } : a
    ));

  const removeAvail = (i: number) =>
    set("availability", overrides.availability.filter((_, idx) => idx !== i));

  const doImport = async () => {
    setImporting(true);
    setError(null);
    setValidationErrors([]);
    try {
      const body = {
        tmdbId: film.id,
        languages: overrides.languages,
        availability: overrides.availability.filter((a) => a.platform),
        ...(overrides.criticScore && { criticScore: Number(overrides.criticScore) }),
        ...(overrides.audienceScore && { audienceScore: Number(overrides.audienceScore) }),
        ...(overrides.verifiedScore && { verifiedScore: Number(overrides.verifiedScore) }),
        ...(overrides.heatScore && { heatScore: Number(overrides.heatScore) }),
        ...(overrides.boxWeekend && { boxWeekend: Number(overrides.boxWeekend) }),
        ...(overrides.boxCumulative && { boxCumulative: Number(overrides.boxCumulative) }),
        ...(overrides.boxWeek && { boxWeek: Number(overrides.boxWeek) }),
        boxLive: overrides.boxLive,
        ...(overrides.rated && { rated: overrides.rated }),
        ...(overrides.slugOverride && { slugOverride: overrides.slugOverride }),
        ...(overrides.yearOverride && { yearOverride: Number(overrides.yearOverride) }),
      };

      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        // Surface individual validation errors if present
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          setValidationErrors(data.errors);
        }
        throw new Error(data.error ?? "Import failed");
      }
      onSuccess(data.film.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setImporting(false);
    }
  };

  const year = film.release_date?.slice(0, 4);
  const langPctTotal = overrides.languages.reduce((s, l) => s + l.percentage, 0);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(28,22,8,0.7)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto", padding: "20px 16px",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 600,
        background: P.parch,
        border: `1px solid ${P.inkSoft}`,
        position: "relative",
        padding: "24px 28px",
        marginBottom: 20,
      }}>
        {/* Inner border */}
        <div style={{ position: "absolute", inset: 4, border: `0.5px solid ${P.goldLight}`, pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {film.poster_url && (
            <div style={{ flexShrink: 0, width: 72, height: 108, overflow: "hidden", border: `0.5px solid ${P.border}` }}>
              <Image
                src={film.poster_url}
                alt={film.title}
                width={72}
                height={108}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-serif, Georgia, serif)",
              fontSize: 20,
              fontWeight: 700,
              color: P.ink,
              lineHeight: 1.2,
              marginBottom: 4,
            }}>
              {film.title}
            </div>
            <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkFaint }}>
              {year} · TMDb #{film.id} · ⭐ {film.vote_average.toFixed(1)} ({film.vote_count.toLocaleString()} votes)
            </div>
            <p style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              color: P.inkMuted,
              lineHeight: 1.5,
              margin: "6px 0 0",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {film.overview}
            </p>
          </div>
        </div>

        <div style={{ borderTop: `0.5px solid ${P.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Languages */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Label>LANGUAGE BREAKDOWN</Label>
              <span style={{
                fontSize: 9,
                fontFamily: "var(--font-sans, sans-serif)",
                color: langPctTotal === 100 ? P.green : P.red,
                fontWeight: 700,
              }}>
                {langPctTotal}% {langPctTotal !== 100 && "(must sum to 100)"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {overrides.languages.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <select
                    value={l.code}
                    onChange={(e) => updateLang(i, "code", e.target.value)}
                    style={{
                      flex: 1,
                      border: `1px solid ${P.border}`,
                      background: P.white,
                      color: P.ink,
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 12,
                      padding: "5px 6px",
                    }}
                  >
                    {LANGUAGES.map((lg) => (
                      <option key={lg.code} value={lg.code}>{lg.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={l.percentage}
                    onChange={(e) => updateLang(i, "percentage", e.target.value)}
                    style={{
                      width: 60,
                      border: `1px solid ${P.border}`,
                      background: P.white,
                      color: P.ink,
                      fontFamily: "var(--font-sans, sans-serif)",
                      fontSize: 12,
                      padding: "5px 6px",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: 11, color: P.inkFaint }}>%</span>
                  {overrides.languages.length > 1 && (
                    <button
                      onClick={() => removeLang(i)}
                      style={{ background: "none", border: "none", color: P.red, cursor: "pointer", fontSize: 14, padding: "0 2px" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 6 }}>
              <Btn onClick={addLang} variant="ghost" small>+ Add language</Btn>
            </div>
          </div>

          {/* Scores */}
          <div>
            <Label>SCORES (leave blank to fill in later)</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
              {(["criticScore", "audienceScore", "verifiedScore", "heatScore"] as const).map((k) => (
                <div key={k}>
                  <div style={{ fontSize: 8, color: P.inkFaint, fontFamily: "var(--font-sans, sans-serif)", marginBottom: 3, letterSpacing: "0.08em" }}>
                    {k === "criticScore" ? "CRITIC"
                      : k === "audienceScore" ? "AUDIENCE"
                        : k === "verifiedScore" ? "VERIFIED"
                          : "HEAT"} (0–100)
                  </div>
                  <Input
                    type="number"
                    value={overrides[k]}
                    onChange={(v) => set(k, v)}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Box office */}
          <div>
            <Label>BOX OFFICE (Naira)</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <div>
                <div style={{ fontSize: 8, color: P.inkFaint, fontFamily: "var(--font-sans, sans-serif)", marginBottom: 3, letterSpacing: "0.08em" }}>WEEKEND</div>
                <Input type="number" value={overrides.boxWeekend} onChange={(v) => set("boxWeekend", v)} placeholder="e.g. 82000000" />
              </div>
              <div>
                <div style={{ fontSize: 8, color: P.inkFaint, fontFamily: "var(--font-sans, sans-serif)", marginBottom: 3, letterSpacing: "0.08em" }}>CUMULATIVE</div>
                <Input type="number" value={overrides.boxCumulative} onChange={(v) => set("boxCumulative", v)} placeholder="e.g. 378000000" />
              </div>
              <div>
                <div style={{ fontSize: 8, color: P.inkFaint, fontFamily: "var(--font-sans, sans-serif)", marginBottom: 3, letterSpacing: "0.08em" }}>WEEK #</div>
                <Input type="number" value={overrides.boxWeek} onChange={(v) => set("boxWeek", v)} placeholder="e.g. 4" />
              </div>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="boxLive"
                checked={overrides.boxLive}
                onChange={(e) => set("boxLive", e.target.checked)}
              />
              <label htmlFor="boxLive" style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: P.inkMuted,
                cursor: "pointer",
              }}>
                Cinema barcode partner — LIVE data
              </label>
            </div>
          </div>

          {/* Rating + slug + year override */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <Label>RATING</Label>
              <Input value={overrides.rated} onChange={(v) => set("rated", v)} placeholder="e.g. 15+" />
            </div>
            <div>
              <Label>
                YEAR OVERRIDE
                {!film.release_date && (
                  <span style={{ marginLeft: 4, color: P.red, fontWeight: 700 }}>⚠ REQUIRED</span>
                )}
              </Label>
              <Input
                type="number"
                value={overrides.yearOverride}
                onChange={(v) => set("yearOverride", v)}
                placeholder={film.release_date?.slice(0, 4) ?? "e.g. 2026"}
                style={!overrides.yearOverride ? { borderColor: P.red } : {}}
              />
            </div>
            <div>
              <Label>SLUG OVERRIDE (only if conflict)</Label>
              <Input value={overrides.slugOverride} onChange={(v) => set("slugOverride", v)} placeholder="auto-generated from title" />
            </div>
          </div>

          {/* Availability */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Label>AVAILABILITY</Label>
              <Btn onClick={addAvail} variant="ghost" small>+ Add</Btn>
            </div>
            {overrides.availability.length === 0 && (
              <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkFaint, fontStyle: "italic" }}>
                No availability added — can be filled in later from the film page.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {overrides.availability.map((a, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 1fr 20px", gap: 4, alignItems: "center" }}>
                  <select
                    value={a.countryCode}
                    onChange={(e) => updateAvail(i, "countryCode", e.target.value)}
                    style={{ border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, padding: "4px 4px" }}
                  >
                    {["NG", "GH", "ZA", "KE", "US", "GB", "CM", "SN", "CI", "ET"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={a.platform}
                    onChange={(e) => updateAvail(i, "platform", e.target.value)}
                    style={{ border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, padding: "4px 4px" }}
                  >
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <select
                    value={a.accessType}
                    onChange={(e) => updateAvail(i, "accessType", e.target.value)}
                    style={{ border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, padding: "4px 4px" }}
                  >
                    {ACCESS_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                  </select>
                  <input
                    type="url"
                    value={a.url}
                    onChange={(e) => updateAvail(i, "url", e.target.value)}
                    placeholder="https://..."
                    style={{ border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, padding: "4px 6px" }}
                  />
                  <button
                    onClick={() => removeAvail(i)}
                    style={{ background: "none", border: "none", color: P.red, cursor: "pointer", fontSize: 14 }}
                  >×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Errors */}
          {(error || validationErrors.length > 0) && (
            <div style={{
              background: `${P.red}15`,
              border: `1px solid ${P.red}`,
              padding: "8px 12px",
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 11,
              color: P.red,
            }}>
              {error && <div style={{ fontWeight: 700, marginBottom: validationErrors.length > 0 ? 6 : 0 }}>{error}</div>}
              {validationErrors.map((e, i) => (
                <div key={i} style={{ marginTop: 3 }}>
                  <span style={{ fontWeight: 700 }}>{e.field}:</span> {e.message}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
            <Btn onClick={onClose} variant="ghost">Cancel</Btn>
            <Btn
              onClick={doImport}
              variant="success"
              disabled={importing || langPctTotal !== 100}
            >
              {importing ? "Importing…" : `Import — ${film.title}`}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Film result card ─────────────────────────────────────────────────────────

function FilmCard({
  film,
  onImport,
  onView,
}: {
  film: TmdbResult;
  onImport: () => void;
  onView: () => void;
}) {
  const year = film.release_date?.slice(0, 4);

  return (
    <div style={{
      border: `0.5px solid ${film.already_imported ? P.green : P.border}`,
      background: film.already_imported ? `${P.green}08` : P.parchLight,
      display: "flex",
      gap: 0,
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Poster */}
      <div style={{
        width: 64,
        flexShrink: 0,
        background: P.parchDark,
        overflow: "hidden",
        position: "relative",
      }}>
        {film.poster_url ? (
          <Image
            src={film.poster_url}
            alt={film.title}
            width={64}
            height={96}
            style={{ objectFit: "cover", width: "100%", height: "100%", display: "block" }}
          />
        ) : (
          <div style={{
            width: 64,
            height: 96,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            color: P.border,
          }}>
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: "10px 12px", minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: 14,
          fontWeight: 700,
          color: P.ink,
          lineHeight: 1.2,
          marginBottom: 2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {film.title}
        </div>
        <div style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 10,
          color: P.inkFaint,
          marginBottom: 5,
        }}>
          {year} · ⭐ {film.vote_average.toFixed(1)} · {film.original_language.toUpperCase()}
          {film.already_imported && (
            <span style={{
              marginLeft: 8,
              background: P.green,
              color: "#fff",
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.1em",
              padding: "1px 5px",
            }}>
              IMPORTED
            </span>
          )}
        </div>
        <p style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 11,
          color: P.inkMuted,
          lineHeight: 1.45,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {film.overview || "No synopsis available."}
        </p>
      </div>

      {/* Actions */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
        padding: "8px 10px",
        borderLeft: `0.5px solid ${P.borderLight}`,
        flexShrink: 0,
      }}>
        <Btn onClick={onView} variant="ghost" small>Preview</Btn>
        {film.already_imported ? (
          <Btn onClick={onImport} variant="ghost" small>Re-import</Btn>
        ) : (
          <Btn onClick={onImport} variant="primary" small>Import</Btn>
        )}
      </div>
    </div>
  );
}

// ─── Success toast ────────────────────────────────────────────────────────────

function SuccessToast({ slug, onClose }: { slug: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 300,
      background: P.green,
      color: "#fff",
      padding: "12px 18px",
      fontFamily: "var(--font-sans, sans-serif)",
      fontSize: 12,
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    }}>
      <span>✓ Imported successfully</span>
      <Link
        href={`/film/${slug}`}
        style={{ color: "#fff", textDecoration: "underline", fontSize: 11 }}
      >
        View film →
      </Link>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>×</button>
    </div>
  );
}

// ─── Manual Entry Form ────────────────────────────────────────────────────────

function ManualEntryForm({ onSuccess }: { onSuccess: (slug: string) => void }) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [synopsis, setSynopsis] = useState("");
  const [genres, setGenres] = useState("");
  const [runtime, setRuntime] = useState("");
  const [tagline, setTagline] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [backdropUrl, setBackdropUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [rated, setRated] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [awards, setAwards] = useState("");

  const [languages, setLanguages] = useState<LangEntry[]>([{ code: "en", percentage: 100 }]);
  const [availability, setAvailability] = useState<AvailEntry[]>([]);
  const [criticScore, setCriticScore] = useState("");
  const [audienceScore, setAudienceScore] = useState("");
  const [verifiedScore, setVerifiedScore] = useState("");
  const [heatScore, setHeatScore] = useState("");
  const [boxWeekend, setBoxWeekend] = useState("");
  const [boxCumulative, setBoxCumulative] = useState("");
  const [boxWeek, setBoxWeek] = useState("");
  const [boxLive, setBoxLive] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const langTotal = languages.reduce((s, l) => s + l.percentage, 0);

  const addLang = () => setLanguages((prev) => [...prev, { code: "en", percentage: 0 }]);
  const removeLang = (i: number) => setLanguages((prev) => prev.filter((_, j) => j !== i));
  const updateLang = (i: number, key: "code" | "percentage", val: string) =>
    setLanguages((prev) => prev.map((l, j) => j === i ? { ...l, [key]: key === "percentage" ? Number(val) : val } : l));

  const addAvail = () => setAvailability((prev) => [...prev, { countryCode: "NG", platform: "Netflix", accessType: "svod", url: "" }]);
  const removeAvail = (i: number) => setAvailability((prev) => prev.filter((_, j) => j !== i));
  const updateAvail = (i: number, key: keyof AvailEntry, val: string) =>
    setAvailability((prev) => prev.map((a, j) => j === i ? { ...a, [key]: val } : a));

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors([]);
    setWarnings([]);
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        year: Number(year),
        country: country.trim(),
        synopsis: synopsis.trim(),
        genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
        runtime: runtime.trim() || undefined,
        tagline: tagline.trim() || undefined,
        posterUrl: posterUrl.trim() || undefined,
        backdropUrl: backdropUrl.trim() || undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        rated: rated.trim() || undefined,
        slugOverride: slugOverride.trim() || undefined,
        awards: awards.split(",").map((a) => a.trim()).filter(Boolean),
        languages,
        availability,
        boxLive,
      };
      if (criticScore) body.criticScore = Number(criticScore);
      if (audienceScore) body.audienceScore = Number(audienceScore);
      if (verifiedScore) body.verifiedScore = Number(verifiedScore);
      if (heatScore) body.heatScore = Number(heatScore);
      if (boxWeekend) body.boxWeekend = Number(boxWeekend);
      if (boxCumulative) body.boxCumulative = Number(boxCumulative);
      if (boxWeek) body.boxWeek = Number(boxWeek);

      const res = await fetch("/api/admin/manual-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const errs = data.errors?.map((e: { message: string }) => e.message) ?? [data.error ?? "Unknown error"];
        setErrors(errs);
        const warns = data.warnings?.map((w: { message: string }) => w.message) ?? [];
        setWarnings(warns);
        return;
      }
      if (data.validation?.warnings?.length) {
        setWarnings(data.validation.warnings.map((w: { message: string }) => w.message));
      }
      onSuccess(data.film.slug);
      // Reset form
      setTitle(""); setYear(""); setSynopsis(""); setGenres(""); setRuntime("");
      setTagline(""); setPosterUrl(""); setBackdropUrl(""); setTrailerUrl("");
      setRated(""); setSlugOverride(""); setAwards("");
      setLanguages([{ code: "en", percentage: 100 }]); setAvailability([]);
      setCriticScore(""); setAudienceScore(""); setVerifiedScore(""); setHeatScore("");
      setBoxWeekend(""); setBoxCumulative(""); setBoxWeek(""); setBoxLive(false);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Unknown error"]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        background: P.parchLight,
        border: `0.5px solid ${P.border}`,
        padding: "16px 20px",
        fontFamily: "var(--font-sans, sans-serif)",
        fontSize: 11,
        color: P.inkMuted,
        lineHeight: 1.6,
      }}>
        Add a film that isn&apos;t on TMDb — or one that TMDb hasn&apos;t catalogued yet. All M&apos;Bari validation still applies.
        Images must be hosted on <strong>media.mbari.art</strong> or <strong>images.unsplash.com</strong>.
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ background: `${P.red}10`, border: `1px solid ${P.red}`, padding: "12px 16px" }}>
          {errors.map((e, i) => (
            <div key={i} style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, color: P.red, marginBottom: 4 }}>✕ {e}</div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div style={{ background: `${P.orange}10`, border: `1px solid ${P.orange}`, padding: "12px 16px" }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, color: P.orange, marginBottom: 4 }}>⚠ {w}</div>
          ))}
        </div>
      )}

      {/* Core fields */}
      <div style={{ background: P.parchLight, border: `0.5px solid ${P.border}`, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700 }}>FILM DETAILS</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 160px", gap: 10 }}>
          <div><Label>TITLE *</Label><Input value={title} onChange={setTitle} placeholder="e.g. Breath of Life" /></div>
          <div><Label>YEAR *</Label><Input type="number" value={year} onChange={setYear} placeholder="2025" /></div>
          <div><Label>COUNTRY *</Label><Input value={country} onChange={setCountry} placeholder="Nigeria" /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
          <div><Label>GENRES (comma-separated) *</Label><Input value={genres} onChange={setGenres} placeholder="Drama, Crime, Thriller" /></div>
          <div><Label>RUNTIME</Label><Input value={runtime} onChange={setRuntime} placeholder="1h 52m" /></div>
        </div>

        <div><Label>TAGLINE</Label><Input value={tagline} onChange={setTagline} placeholder="Optional one-liner" /></div>

        <div>
          <Label>SYNOPSIS *</Label>
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows={4}
            placeholder="Film synopsis / description…"
            style={{
              width: "100%",
              border: `1px solid ${P.border}`,
              background: P.white,
              color: P.ink,
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 12,
              padding: "6px 8px",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><Label>POSTER URL (media.mbari.art or images.unsplash.com)</Label><Input value={posterUrl} onChange={setPosterUrl} placeholder="https://…" /></div>
          <div><Label>BACKDROP URL</Label><Input value={backdropUrl} onChange={setBackdropUrl} placeholder="https://…" /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: 10 }}>
          <div><Label>TRAILER URL (YouTube)</Label><Input value={trailerUrl} onChange={setTrailerUrl} placeholder="https://youtube.com/…" /></div>
          <div><Label>RATED</Label><Input value={rated} onChange={setRated} placeholder="PG-13" /></div>
          <div><Label>AWARDS (comma-separated)</Label><Input value={awards} onChange={setAwards} placeholder="AMVCA Best Film, …" /></div>
        </div>

        <div><Label>SLUG OVERRIDE (optional — auto-generated from title + year)</Label><Input value={slugOverride} onChange={setSlugOverride} placeholder="leave blank to auto-generate" /></div>
      </div>

      {/* Language breakdown */}
      <div style={{ background: P.parchLight, border: `0.5px solid ${P.border}`, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700 }}>LANGUAGE BREAKDOWN</div>
          <span style={{ fontSize: 9, fontFamily: "var(--font-sans, sans-serif)", color: langTotal === 100 ? P.green : P.red, fontWeight: 700 }}>
            {langTotal}% {langTotal !== 100 && "(must sum to 100)"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {languages.map((l, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select value={l.code} onChange={(e) => updateLang(i, "code", e.target.value)}
                style={{ flex: 1, border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "5px 6px" }}>
                {LANGUAGES.map((lg) => <option key={lg.code} value={lg.code}>{lg.name}</option>)}
              </select>
              <input type="number" min={0} max={100} value={l.percentage} onChange={(e) => updateLang(i, "percentage", e.target.value)}
                style={{ width: 60, border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "5px 6px", textAlign: "center" }} />
              <span style={{ fontSize: 11, color: P.inkFaint }}>%</span>
              {languages.length > 1 && (
                <button onClick={() => removeLang(i)} style={{ background: "none", border: "none", color: P.red, cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}><Btn onClick={addLang} variant="ghost" small>+ Add language</Btn></div>
      </div>

      {/* Scores */}
      <div style={{ background: P.parchLight, border: `0.5px solid ${P.border}`, padding: "16px 20px" }}>
        <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 10 }}>SCORES (leave blank to fill in later)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "CRITIC", val: criticScore, set: setCriticScore },
            { label: "AUDIENCE", val: audienceScore, set: setAudienceScore },
            { label: "VERIFIED", val: verifiedScore, set: setVerifiedScore },
            { label: "HEAT", val: heatScore, set: setHeatScore },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <div style={{ fontSize: 8, color: P.inkFaint, fontFamily: "var(--font-sans, sans-serif)", marginBottom: 3, letterSpacing: "0.08em" }}>{label} (0–100)</div>
              <Input type="number" value={val} onChange={set} placeholder="—" />
            </div>
          ))}
        </div>
      </div>

      {/* Box office */}
      <div style={{ background: P.parchLight, border: `0.5px solid ${P.border}`, padding: "16px 20px" }}>
        <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 10 }}>BOX OFFICE (Nigerian Naira)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 8, marginBottom: 8 }}>
          <div><Label>CUMULATIVE TOTAL</Label><Input type="number" value={boxCumulative} onChange={setBoxCumulative} placeholder="e.g. 450000000" /></div>
          <div><Label>LAST WEEKEND</Label><Input type="number" value={boxWeekend} onChange={setBoxWeekend} placeholder="e.g. 45000000" /></div>
          <div><Label>WEEK #</Label><Input type="number" value={boxWeek} onChange={setBoxWeek} placeholder="e.g. 3" /></div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkMuted, cursor: "pointer" }}>
          <input type="checkbox" checked={boxLive} onChange={(e) => setBoxLive(e.target.checked)} />
          Currently in cinemas (box office LIVE)
        </label>
      </div>

      {/* Availability */}
      <div style={{ background: P.parchLight, border: `0.5px solid ${P.border}`, padding: "16px 20px" }}>
        <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 9, color: P.gold, letterSpacing: "0.14em", fontWeight: 700, marginBottom: 10 }}>WHERE TO WATCH</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {availability.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <select value={a.countryCode} onChange={(e) => updateAvail(i, "countryCode", e.target.value)}
                style={{ width: 80, border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "5px 6px" }}>
                {["NG","GH","ZA","KE","US","GB","FR","CA","DE"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={a.platform} onChange={(e) => updateAvail(i, "platform", e.target.value)}
                style={{ flex: 1, minWidth: 120, border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "5px 6px" }}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={a.accessType} onChange={(e) => updateAvail(i, "accessType", e.target.value)}
                style={{ width: 110, border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "5px 6px" }}>
                <option value="svod">Subscription</option>
                <option value="tvod">Rental</option>
                <option value="cinema">Cinema</option>
                <option value="free">Free</option>
                <option value="avod">Ad-supported</option>
              </select>
              <button onClick={() => removeAvail(i)} style={{ background: "none", border: "none", color: P.red, cursor: "pointer", fontSize: 14, padding: "0 2px" }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}><Btn onClick={addAvail} variant="ghost" small>+ Add platform</Btn></div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 40 }}>
        <Btn onClick={handleSubmit} disabled={submitting || !title || !year || !country || !synopsis}>
          {submitting ? "Saving…" : "Add film to M'Bari →"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [region, setRegion] = useState("NG");
  const [sort, setSort] = useState("popularity.desc");
  const [year, setYear] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"discover" | "search" | "manual">("discover");
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<TmdbResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [importFilm, setImportFilm] = useState<TmdbResult | null>(null);
  const [importAutoBoxLive, setImportAutoBoxLive] = useState(false);
  const [previewFilm, setPreviewFilm] = useState<TmdbResult | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const queryRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(async (p = 1) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ mode, page: String(p) });
      if (mode === "discover") {
        params.set("region", region);
        params.set("sort", sort);
        if (year) params.set("year", year);
      } else {
        params.set("query", query);
        params.set("region", region);
      }

      const res = await fetch(`/api/admin/tmdb?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Fetch failed");

      setResults(data.results ?? []);
      setTotalPages(data.total_pages ?? 1);
      setTotalResults(data.total_results ?? 0);
      setPage(p);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Unknown error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [mode, region, sort, year, query]);

  // Auto-fetch on discover param changes
  useEffect(() => {
    if (mode === "discover") {
      fetchResults(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, region, sort, year]);

  // Debounce search
  useEffect(() => {
    if (mode !== "search") return;
    if (queryRef.current) clearTimeout(queryRef.current);
    if (!query.trim()) { setResults([]); return; }
    queryRef.current = setTimeout(() => fetchResults(1), 400);
    return () => { if (queryRef.current) clearTimeout(queryRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, region, mode]);

  const markImported = (slug: string) => {
    setResults((r) => r.map((f) => f.id === importFilm?.id ? { ...f, already_imported: true } : f));
    setImportFilm(null);
    setSuccessSlug(slug);
  };

  return (
    <div style={{ background: P.parch, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        borderBottom: `2px solid ${P.ink}`,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: P.parchLight,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
            <Link href="/admin" style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.inkFaint, textDecoration: "none" }}>
              ← Admin
            </Link>
            <span style={{ color: P.border, fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.gold, letterSpacing: "0.1em", fontWeight: 700 }}>
              TMDB IMPORT
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 22, fontWeight: 700, color: P.ink }}>
            Import from TMDb
          </div>
          <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkFaint, marginTop: 2 }}>
            Browse African films by region. Click Import to create a M&apos;Bari record with TMDb metadata — then add local data.
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: P.inkFaint, fontFamily: "var(--font-sans, sans-serif)", letterSpacing: "0.1em" }}>IMAGES STORED TO</div>
          <div style={{ fontSize: 11, color: P.gold, fontFamily: "var(--font-sans, sans-serif)", fontWeight: 700 }}>Cloudflare R2 · media.mbari.art</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        {/* Now Playing Check */}
        <NowPlayingPanel onImport={(film, autoBoxLive) => {
          setImportFilm(film);
          setImportAutoBoxLive(autoBoxLive ?? false);
        }} />

        {/* Controls */}
        <div style={{
          background: P.parchLight,
          border: `0.5px solid ${P.border}`,
          padding: "14px 16px",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
        }}>
          {/* Mode toggle */}
          <div>
            <Label>MODE</Label>
            <div style={{ display: "flex", gap: 0 }}>
              {(["discover", "search", "manual"] as const).map((m, i, arr) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setResults([]); setPage(1); }}
                  style={{
                    padding: "6px 12px",
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    border: `1px solid ${P.border}`,
                    borderRight: i < arr.length - 1 ? "none" : undefined,
                    background: mode === m ? P.gold : P.white,
                    color: mode === m ? "#fff" : P.inkMuted,
                    cursor: "pointer",
                  }}
                >
                  {m === "discover" ? "DISCOVER" : m === "search" ? "SEARCH" : "MANUAL ENTRY"}
                </button>
              ))}
            </div>
          </div>

          {/* Region */}
          {mode !== "manual" && (
            <div>
              <Label>REGION</Label>
              <select
                value={region}
                onChange={(e) => { setRegion(e.target.value); setPage(1); }}
                style={{
                  border: `1px solid ${P.border}`,
                  background: P.white,
                  color: P.ink,
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 12,
                  padding: "6px 8px",
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.flag} {r.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Search query */}
          {mode === "search" && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <Label>SEARCH TITLE</Label>
              <Input
                value={query}
                onChange={(v) => { setQuery(v); setPage(1); }}
                placeholder="e.g. King of Boys, Jenifa…"
              />
            </div>
          )}

          {/* Sort + year (discover only) */}
          {mode === "discover" && (
            <>
              <div>
                <Label>SORT BY</Label>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  style={{ border: `1px solid ${P.border}`, background: P.white, color: P.ink, fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, padding: "6px 8px" }}
                >
                  {SORT_OPTIONS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <Label>YEAR (OPTIONAL)</Label>
                <Input
                  type="number"
                  value={year}
                  onChange={(v) => { setYear(v); setPage(1); }}
                  placeholder="e.g. 2024"
                  style={{ width: 90 }}
                />
              </div>
            </>
          )}
        </div>

        {/* Manual entry form */}
        {mode === "manual" && (
          <ManualEntryForm onSuccess={(slug) => setSuccessSlug(slug)} />
        )}

        {/* Results header */}
        {mode !== "manual" && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
            borderBottom: `1px solid ${P.border}`,
            paddingBottom: 8,
          }}>
            <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 10, color: P.inkFaint }}>
              {loading ? "Loading…"
                : loadError ? ""
                  : results.length > 0
                    ? `${totalResults.toLocaleString()} results · page ${page} of ${totalPages}`
                    : mode === "search" && !query ? "Enter a search term above"
                      : "No results"}
            </span>
            {!loading && results.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <Btn onClick={() => fetchResults(page - 1)} variant="ghost" small disabled={page <= 1}>← Prev</Btn>
                <Btn onClick={() => fetchResults(page + 1)} variant="ghost" small disabled={page >= totalPages}>Next →</Btn>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {mode !== "manual" && loadError && (
          <div style={{
            background: `${P.red}12`,
            border: `1px solid ${P.red}`,
            padding: "10px 14px",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            color: P.red,
            marginBottom: 16,
          }}>
            {loadError.includes("TMDB_API_KEY")
              ? "TMDb API key not set. Add TMDB_API_KEY to your .env file."
              : `Error: ${loadError}`}
          </div>
        )}

        {/* Loading skeleton */}
        {mode !== "manual" && loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: 96,
                background: P.parchDark,
                border: `0.5px solid ${P.borderLight}`,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        )}

        {/* Results grid */}
        {mode !== "manual" && !loading && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((film) => (
              <FilmCard
                key={film.id}
                film={film}
                onImport={() => { setImportFilm(film); setImportAutoBoxLive(false); }}
                onView={() => setPreviewFilm(film)}
              />
            ))}
          </div>
        )}

        {/* Bottom pagination */}
        {mode !== "manual" && !loading && results.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            <Btn onClick={() => fetchResults(page - 1)} variant="ghost" disabled={page <= 1}>← Previous page</Btn>
            <span style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkFaint, alignSelf: "center" }}>
              {page} / {totalPages}
            </span>
            <Btn onClick={() => fetchResults(page + 1)} variant="ghost" disabled={page >= totalPages}>Next page →</Btn>
          </div>
        )}
      </div>

      {/* Import modal */}
      {importFilm && (
        <ImportModal
          film={importFilm}
          onClose={() => { setImportFilm(null); setImportAutoBoxLive(false); }}
          onSuccess={markImported}
          autoBoxLive={importAutoBoxLive}
        />
      )}

      {/* Quick preview panel */}
      {previewFilm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 150,
          background: "rgba(28,22,8,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewFilm(null); }}
        >
          <div style={{
            background: P.parch,
            border: `1px solid ${P.inkSoft}`,
            maxWidth: 480,
            width: "100%",
            padding: "20px 24px",
            position: "relative",
          }}>
            <div style={{ position: "absolute", inset: 4, border: `0.5px solid ${P.goldLight}`, pointerEvents: "none" }} />
            <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
              {previewFilm.poster_url && (
                <Image src={previewFilm.poster_url} alt={previewFilm.title} width={80} height={120}
                  style={{ objectFit: "cover", flexShrink: 0, border: `0.5px solid ${P.border}` }} />
              )}
              <div>
                <div style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontSize: 20, fontWeight: 700, color: P.ink, marginBottom: 4 }}>
                  {previewFilm.title}
                </div>
                <div style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 11, color: P.inkFaint, marginBottom: 8 }}>
                  {previewFilm.release_date?.slice(0, 4)} · TMDb #{previewFilm.id} · {previewFilm.original_language.toUpperCase()}
                  · ⭐ {previewFilm.vote_average.toFixed(1)}
                </div>
                <p style={{ fontFamily: "var(--font-sans, sans-serif)", fontSize: 12, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>
                  {previewFilm.overview}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setPreviewFilm(null)} variant="ghost">Close</Btn>
              <Btn onClick={() => { setImportFilm(previewFilm); setPreviewFilm(null); }} variant="primary">
                Import this film
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {successSlug && (
        <SuccessToast slug={successSlug} onClose={() => setSuccessSlug(null)} />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
