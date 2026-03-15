"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  FR: "France", GB: "UK", US: "USA", NZ: "New Zealand", IE: "Ireland",
};
const COUNTRY_COLOR: Record<string, string> = {
  NG: "#2D7A3A", ZA: "#1A5C8A", KE: "#8B1A1A", GH: "#B8860B",
};

type FilmWithRelations = {
  id: string;
  slug: string;
  title: string;
  year: number;
  country: string;
  tagline: string | null;
  posterUrl: string | null;
  criticScore: number | null;
  boxLive: boolean;
  crew: {
    role: string;
    crewMember: { name: string };
  }[];
};

export default function FlipHero({ films }: { films: FilmWithRelations[] }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (films.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % films.length);
        setVisible(true);
      }, 400);
    }, 5500);
    return () => clearInterval(interval);
  }, [films.length]);

  const film = films[current];
  if (!film) return null;

  const director = film.crew.find((c) => c.role === "Director");

  return (
    <div
      style={{
        position: "relative",
        maxHeight: 360,
        overflow: "hidden",
        border: "0.5px solid #C4A862",
        background: "#F5F0E4",
      }}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
          display: "flex",
          height: 360,
        }}
      >
        {/* Poster */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            background: "#E8E0CE",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {film.posterUrl ? (
            <Image
              src={film.posterUrl}
              alt={film.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="200px"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#E8E0CE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 11,
                  color: "#8B7040",
                  textAlign: "center",
                  padding: 16,
                }}
              >
                {film.title}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "24px 24px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {film.boxLive && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#2D7A3A",
                    color: "#fff",
                    fontSize: 9,
                    fontFamily: "var(--font-sans, sans-serif)",
                    letterSpacing: "0.12em",
                    padding: "3px 8px",
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fff",
                      display: "inline-block",
                      animation: "pulse 1.4s infinite",
                    }}
                  />
                  LIVE
                </span>
              )}
              {film.criticScore != null && (
                <span
                  style={{
                    background: "#2D7A3A",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    padding: "2px 8px",
                  }}
                >
                  {film.criticScore}
                </span>
              )}
              <span
                style={{
                  background: COUNTRY_COLOR[film.country] ?? "#8B7040",
                  color: "#fff",
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: "var(--font-sans, sans-serif)",
                  letterSpacing: "0.1em",
                  padding: "2px 7px",
                }}
              >
                {COUNTRY_NAME[film.country] ?? film.country}
              </span>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 700,
                color: "#1C1608",
                lineHeight: 1.1,
                margin: "0 0 6px",
              }}
            >
              {film.title}
            </h2>

            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: "#8B7040",
                marginBottom: 10,
                letterSpacing: "0.05em",
              }}
            >
              {film.year}
              {director ? ` · A film by ${director.crewMember.name}` : ""}
            </div>

            {film.tagline && (
              <p
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 14,
                  color: "#3A2E18",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  margin: "0 0 16px",
                }}
              >
                &ldquo;{film.tagline}&rdquo;
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {films.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setVisible(false);
                    setTimeout(() => {
                      setCurrent(i);
                      setVisible(true);
                    }, 300);
                  }}
                  style={{
                    width: i === current ? 18 : 6,
                    height: 6,
                    background: i === current ? "#8B7040" : "#C4A862",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s",
                  }}
                  aria-label={`Film ${i + 1}`}
                />
              ))}
            </div>

            <Link
              href={`/film/${film.slug}`}
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 11,
                color: "#8B7040",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.06em",
                borderBottom: "1px solid #C4A862",
                paddingBottom: 1,
              }}
            >
              Read more →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
