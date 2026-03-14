"use client";

import { CulturalDividerSVG } from "@/lib/patterns";

interface CulturalDividerProps {
  langCode: string;
  width?: number;
}

export default function CulturalDivider({
  langCode,
  width = 320,
}: CulturalDividerProps) {
  const svg = CulturalDividerSVG(langCode, width);

  return (
    <div
      style={{
        height: 14,
        margin: "4px 0",
        overflow: "hidden",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
