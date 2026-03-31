"use client";
import Link from "next/link";
import { useState } from "react";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
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
        <div style={{ display: "flex", gap: 14 }}>
          {[
            ["Films", "/films"],
            ["Cast", "/cast"],
            ["Crew", "/crew"],
            ["Events", "/events"],
            ["Submit", "/submit"],
            ["Methodology", "/methodology"],
          ].map(([label, href]) => (
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
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 13.5,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.1em",
        }}>
          Where culture lives
        </span>
        <Link href="/admin" style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 13.5,
          color: "rgba(255,255,255,0.45)",
          textDecoration: "none",
          letterSpacing: "0.06em",
        }}>
          Admin
        </Link>
      </div>
    </nav>
  );
}
