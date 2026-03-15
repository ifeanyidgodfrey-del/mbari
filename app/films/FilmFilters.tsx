"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const P = {
  parch: "#F5F0E4",
  parchLight: "#FAF6ED",
  ink: "#1C1608",
  inkMuted: "#6B5D3F",
  inkFaint: "#9C8B6E",
  gold: "#8B7040",
  goldLight: "#C4A862",
  border: "#D8CDB4",
  white: "#FFFDF7",
  green: "#2D7A3A",
};

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime",
  "Documentary", "Drama", "Family", "Fantasy", "History",
  "Horror", "Music", "Mystery", "Romance", "Science Fiction", "Thriller",
];

const COUNTRIES = [
  { code: "NG", label: "Nigeria" },
  { code: "ZA", label: "South Africa" },
  { code: "KE", label: "Kenya" },
  { code: "GH", label: "Ghana" },
];

const SORTS = [
  { value: "score", label: "Top Score" },
  { value: "boxoffice", label: "Box Office" },
  { value: "year", label: "Year (Newest)" },
  { value: "popular", label: "Most Popular" },
];

export default function FilmFilters({
  years,
  total,
}: {
  years: number[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clear = () => router.push(pathname);

  const hasFilters =
    get("q") || get("year") || get("genre") || get("country") || get("live") || get("sort");

  return (
    <div
      style={{
        background: P.parchLight,
        border: `1px solid ${P.border}`,
        padding: "14px 16px",
        marginBottom: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Search + live toggle row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search title, synopsis…"
          defaultValue={get("q")}
          onKeyDown={(e) => {
            if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => update("q", e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            border: `1px solid ${P.border}`,
            background: P.white,
            color: P.ink,
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 12,
            padding: "6px 10px",
            outline: "none",
          }}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            color: get("live") ? P.green : P.inkMuted,
            fontWeight: get("live") ? 700 : 400,
            whiteSpace: "nowrap",
          }}
        >
          <div
            onClick={() => update("live", get("live") ? "" : "1")}
            style={{
              width: 32,
              height: 18,
              background: get("live") ? P.green : P.border,
              borderRadius: 9,
              position: "relative",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 2,
                left: get("live") ? 16 : 2,
                width: 14,
                height: 14,
                background: "#fff",
                borderRadius: "50%",
                transition: "left 0.2s",
              }}
            />
          </div>
          In cinemas now
        </label>
        <span
          style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 10,
            color: P.inkFaint,
            whiteSpace: "nowrap",
          }}
        >
          {total} film{total !== 1 ? "s" : ""}
        </span>
        {hasFilters && (
          <button
            onClick={clear}
            style={{
              background: "none",
              border: `1px solid ${P.border}`,
              color: P.inkMuted,
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 10,
              padding: "4px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Year */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: P.gold,
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            YEAR
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => update("year", get("year") === String(y) ? "" : String(y))}
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  fontWeight: get("year") === String(y) ? 700 : 400,
                  padding: "3px 8px",
                  border: `1px solid ${get("year") === String(y) ? P.gold : P.border}`,
                  background: get("year") === String(y) ? P.gold : "transparent",
                  color: get("year") === String(y) ? "#fff" : P.inkMuted,
                  cursor: "pointer",
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Country */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: P.gold,
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            COUNTRY
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => update("country", get("country") === c.code ? "" : c.code)}
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  fontWeight: get("country") === c.code ? 700 : 400,
                  padding: "3px 8px",
                  border: `1px solid ${get("country") === c.code ? P.gold : P.border}`,
                  background: get("country") === c.code ? P.gold : "transparent",
                  color: get("country") === c.code ? "#fff" : P.inkMuted,
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: P.gold,
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            GENRE
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => update("genre", get("genre") === g ? "" : g)}
                style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  fontWeight: get("genre") === g ? 700 : 400,
                  padding: "3px 8px",
                  border: `1px solid ${get("genre") === g ? P.gold : P.border}`,
                  background: get("genre") === g ? P.gold : "transparent",
                  color: get("genre") === g ? "#fff" : P.inkMuted,
                  cursor: "pointer",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-sans, sans-serif)",
              fontSize: 8,
              color: P.gold,
              letterSpacing: "0.14em",
              fontWeight: 700,
              marginBottom: 5,
            }}
          >
            SORT BY
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {SORTS.map((s) => {
              const active = (get("sort") || "score") === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => update("sort", s.value === "score" ? "" : s.value)}
                  style={{
                    fontFamily: "var(--font-sans, sans-serif)",
                    fontSize: 10,
                    fontWeight: active ? 700 : 400,
                    padding: "3px 8px",
                    border: `1px solid ${active ? P.goldLight : P.border}`,
                    background: active ? P.goldLight : "transparent",
                    color: active ? "#fff" : P.inkMuted,
                    cursor: "pointer",
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
