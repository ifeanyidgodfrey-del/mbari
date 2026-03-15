import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        background: "#F5F0E4",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: "clamp(80px, 16vw, 140px)",
          fontWeight: 700,
          color: "#C4A862",
          lineHeight: 1,
          opacity: 0.35,
          marginBottom: 24,
        }}
      >
        404
      </div>

      <h1
        style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: "clamp(22px, 4vw, 32px)",
          fontWeight: 700,
          color: "#1C1608",
          margin: "0 0 12px",
        }}
      >
        Page not found
      </h1>

      <p
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 13,
          color: "#6B5D3F",
          lineHeight: 1.7,
          maxWidth: 380,
          margin: "0 0 32px",
        }}
      >
        This film, event, or page doesn&apos;t exist in M&apos;Bari yet — or may not have been imported.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            background: "#1C1608",
            color: "#F5F0E4",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "10px 22px",
            textDecoration: "none",
          }}
        >
          BACK TO HOME
        </Link>
        <Link
          href="/films"
          style={{
            border: "1px solid #C4A862",
            color: "#8B7040",
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "10px 22px",
            textDecoration: "none",
          }}
        >
          BROWSE FILMS
        </Link>
      </div>
    </div>
  );
}
