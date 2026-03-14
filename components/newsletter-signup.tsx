"use client";

import { useState, type FormEvent } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You're in. See you Monday.");
        setEmail("");
        setName("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        fontFamily: "var(--font-serif, Georgia, serif)",
        fontSize: 14,
        color: "#2D7A3A",
        fontWeight: 700,
        padding: "8px 0",
      }}>
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex",
      gap: 8,
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
    }}>
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 12,
          padding: "8px 12px",
          border: "0.5px solid #C4A862",
          background: "#FFFDF7",
          color: "#1C1608",
          width: 140,
          outline: "none",
        }}
      />
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 12,
          padding: "8px 12px",
          border: "0.5px solid #C4A862",
          background: "#FFFDF7",
          color: "#1C1608",
          width: 200,
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          padding: "9px 18px",
          background: "#8B7040",
          color: "#fff",
          border: "none",
          cursor: status === "loading" ? "wait" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "loading" ? "JOINING..." : "SUBSCRIBE"}
      </button>
      {status === "error" && (
        <div style={{
          width: "100%",
          fontFamily: "var(--font-sans, sans-serif)",
          fontSize: 11,
          color: "#C0392B",
          marginTop: 4,
        }}>
          {message}
        </div>
      )}
    </form>
  );
}
