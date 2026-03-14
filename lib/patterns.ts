const P = {
  inkSoft: "#3A2E18",
};

function yo(w: number): string {
  return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.3" fill="none">
    <path d="M0 3 ${Array.from({ length: Math.floor(w / 16) }, (_, i) => `Q${i * 16 + 8} ${i % 2 ? 10 : -4}, ${(i + 1) * 16} 3`).join(" ")}"/>
    <path d="M0 10 ${Array.from({ length: Math.floor(w / 16) }, (_, i) => `Q${i * 16 + 8} ${i % 2 ? 17 : 3}, ${(i + 1) * 16} 10`).join(" ")}"/>
  </g>`;
}

function ig(w: number): string {
  const segs = Math.floor(w / 12);
  return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.3" fill="none">
    <path d="M0 2 ${Array.from({ length: segs }, (_, i) => `L${i * 12 + 6} ${i % 2 ? 12 : 2} L${(i + 1) * 12} 2`).join(" ")}"/>
    <path d="M0 7 ${Array.from({ length: segs }, (_, i) => `L${i * 12 + 6} ${i % 2 ? 2 : 12} L${(i + 1) * 12} 7`).join(" ")}"/>
  </g>`;
}

function ha(w: number): string {
  return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.3" fill="none">
    ${Array.from({ length: Math.floor(w / 20) }, (_, i) => `<path d="M${i * 20 + 10} 0 L${i * 20 + 20} 7 L${i * 20 + 10} 14 L${i * 20} 7 Z"/>`).join("")}
  </g>`;
}

function zu(w: number): string {
  return `<g stroke="${P.inkSoft}" stroke-width="0.5" opacity="0.25" fill="none">
    ${Array.from({ length: Math.floor(w / 16) }, (_, i) => `<rect x="${i * 16}" y="1" width="14" height="5" rx="0"/><rect x="${i * 16 + 3}" y="8" width="8" height="4" rx="0"/>`).join("")}
  </g>`;
}

function en(w: number): string {
  return `<g stroke="${P.inkSoft}" stroke-width="0.4" opacity="0.2" fill="none">
    <path d="M0 7 ${Array.from({ length: Math.floor(w / 8) }, (_, i) => `L${i * 8 + 4} ${i % 2 ? 1 : 13} L${(i + 1) * 8} 7`).join(" ")}"/>
  </g>`;
}

const PATTERNS: Record<string, (w: number) => string> = { yo, ig, ha, zu, en, pcm: en };

export function getPattern(code: string, w: number): string {
  return (PATTERNS[code] || en)(w);
}

export function CulturalDividerSVG(langCode: string, width: number): string {
  return `<svg width="${width}" height="14" viewBox="0 0 ${width} 14">${getPattern(langCode, width)}</svg>`;
}
