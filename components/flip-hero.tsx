"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const COUNTRY_NAME: Record<string, string> = {
  NG: "Nigeria", ZA: "South Africa", KE: "Kenya", GH: "Ghana",
  ET: "Ethiopia", EG: "Egypt",
  FR: "France", GB: "UK", US: "USA", NZ: "New Zealand", IE: "Ireland",
};
const COUNTRY_COLOR: Record<string, string> = {
  NG: "#1A6B30", ZA: "#0F4A7A", KE: "#7A1010", GH: "#A87800",
  ET: "#005200", EG: "#B07A00",
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
  boxCumulative?: bigint | null;
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
        overflow: "hidden",
        background: "#0A0800",
        width: "100%",
      }}
    >
      <div
        className="mbari-hero-inner"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {/* Poster */}
        <div
          className="mbari-hero-poster"
        >
          {film.posterUrl ? (
            <Image
              src={film.posterUrl}
              alt={film.title}
              fill
              style={{ objectFit: "cover" }}
              sizes="260px"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(160deg, #1A1208 0%, #0A0800 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: "clamp(18px, 2.5vw, 28px)",
                  color: "#C8920A",
                  textAlign: "center",
                  lineHeight: 1.3,
                  fontWeight: 700,
                }}
              >
                {film.title}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className="mbari-hero-content"
        >
          <div>
            {/* Badges row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {film.boxLive && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#C8391A",
                    color: "#fff",
                    fontSize: 10,
                    fontFamily: "var(--font-sans, sans-serif)",
                    letterSpacing: "0.14em",
                    padding: "4px 10px",
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
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
                    background: "#C8920A",
                    color: "#0A0800",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "var(--font-serif, Georgia, serif)",
                    padding: "4px 12px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {film.criticScore}
                </span>
              )}
              <span
                style={{
                  background: COUNTRY_COLOR[film.country] ?? "#5A4010",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-sans, sans-serif)",
                  letterSpacing: "0.1em",
                  padding: "4px 10px",
                }}
              >
                {COUNTRY_NAME[film.country] ?? film.country}
              </span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "var(--font-serif, Georgia, serif)",
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 700,
                color: "#FBF8F0",
                lineHeight: 1.05,
                margin: "0 0 10px",
              }}
            >
              {film.title}
            </h2>

            {/* Director / year */}
            <div
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 13,
                color: "rgba(255,255,255,0.65)",
                marginBottom: 14,
                letterSpacing: "0.05em",
              }}
            >
              {film.year}
              {director ? ` · A film by ${director.crewMember.name}` : ""}
            </div>

            {/* Tagline */}
            {film.tagline && (
              <p
                style={{
                  fontFamily: "var(--font-serif, Georgia, serif)",
                  fontSize: 16,
                  color: "rgba(251,248,240,0.9)",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  margin: "0 0 20px",
                }}
              >
                &ldquo;{film.tagline}&rdquo;
              </p>
            )}

            {/* Box office hero stat */}
            {film.boxCumulative != null && Number(film.boxCumulative) > 0 && (
              <div
                style={{
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span style={{
                  fontFamily: "var(--font-sans, sans-serif)",
                  fontSize: 10,
                  color: "rgba(200,146,10,0.8)",
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                }}>
                  TOTAL BOX OFFICE
                </span>
              </div>
            )}
          </div>

          {/* Bottom row: dots + read more */}
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
                gap: 6,
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
                    width: i === current ? 24 : 8,
                    height: 8,
                    background: i === current ? "#C8920A" : "rgba(200,146,10,0.35)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.3s, background 0.3s",
                    borderRadius: 4,
                  }}
                  aria-label={`Film ${i + 1}`}
                />
              ))}
            </div>

            <Link
              href={`/film/${film.slug}`}
              style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 13,
                color: "#FBF8F0",
                textDecoration: "none",
                fontWeight: 700,
                letterSpacing: "0.08em",
                borderBottom: "2px solid #C8920A",
                paddingBottom: 2,
                display: "inline-block",
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
