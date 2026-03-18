"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string | null;
  title: string;
  bgColor: string;
  bgDeep: string;
  textColor: string;
};

export default function FilmHeroImage({ src, title, bgColor, bgDeep, textColor }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, ${bgColor} 0%, ${bgDeep} 60%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}>
        {/* Large decorative initial */}
        <div style={{
          fontFamily: "var(--font-serif, Georgia, serif)",
          fontSize: "clamp(6rem, 14vw, 11rem)",
          fontStyle: "italic",
          color: `${textColor}18`,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: "-0.04em",
        }}>
          {title.charAt(0)}
        </div>
        <div style={{
          fontSize: "0.52rem",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: `${textColor}40`,
          fontFamily: "var(--font-sans, sans-serif)",
        }}>
          Film Still Unavailable
        </div>
      </div>
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={title}
        fill
        style={{ objectFit: "cover", objectPosition: "center top" }}
        sizes="50vw"
        priority
        onError={() => setFailed(true)}
      />
      {/* Gradient fade — left & bottom */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(to right, ${bgDeep} 0%, transparent 22%),
                     linear-gradient(to top, ${bgDeep} 0%, transparent 28%)`,
        pointerEvents: "none",
      }} />
    </>
  );
}
