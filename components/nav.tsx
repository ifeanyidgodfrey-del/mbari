"use client";
import Link from "next/link";
import { useState } from "react";

const NAV_LINKS: [string, string][] = [
  ["Films", "/films"],
  ["Cast", "/cast"],
  ["Crew", "/crew"],
  ["Events", "/events"],
  ["Submit", "/submit"],
  ["Methodology", "/methodology"],
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "68px",
        background: "#080600",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid rgba(200,146,10,0.3)",
      }}>
        {/* Left: wordmark + desktop nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{
            fontFamily: "var(--font-sans, 'Source Sans 3', sans-serif)",
            fontSize: 18,
            fontWeight: 700,
            color: "#C8920A",
            letterSpacing: "0.22em",
            textDecoration: "none",
          }}>
            M'BARI
          </Link>
          {/* Desktop nav links — hidden on mobile via CSS */}
          <div className="mbari-nav-links" style={{ display: "flex", gap: 14 }}>
            {NAV_LINKS.map(([label, href]) => (
              <Link key={href} href={href} style={{
                fontFamily: "var(--font-sans, sans-serif)",
                fontSize: 15,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "0.06em",
              }}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: tagline + admin + hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="mbari-nav-links" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 13.5,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.1em",
          }}>
            Where culture lives
          </span>
          <Link href="/admin" className="mbari-nav-links" style={{
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 13.5,
            color: "rgba(255,255,255,0.45)",
            textDecoration: "none",
            letterSpacing: "0.06em",
          }}>
            Admin
          </Link>

          {/* Hamburger — visible on mobile only */}
          <button
            className={`mbari-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mbari-mobile-menu">
          {NAV_LINKS.map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
          <Link
            href="/admin"
            onClick={() => setMenuOpen(false)}
            style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}
          >
            Admin
          </Link>
        </div>
      )}
    </>
  );
}
