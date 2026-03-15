// Approximate exchange rates (local units per 1 USD)
const FX: Record<string, { symbol: string; perUsd: number }> = {
  NG: { symbol: "₦", perUsd: 1600 },
  ZA: { symbol: "R",  perUsd: 18   },
  KE: { symbol: "KSh", perUsd: 130 },
  GH: { symbol: "₵", perUsd: 15   },
};

function fmtLocal(num: number, symbol: string): string {
  if (num >= 1e9) return `${symbol}${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${symbol}${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${symbol}${(num / 1e3).toFixed(0)}K`;
  return `${symbol}${num}`;
}

function fmtUsdNum(num: number, perUsd: number): string {
  const usd = num / perUsd;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${Math.round(usd)}`;
}

/** Format a box-office figure in local currency (₦ by default). */
export function fmt(n: number | bigint, country?: string): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  const { symbol } = FX[country ?? "NG"] ?? FX.NG;
  return fmtLocal(num, symbol);
}

/**
 * Format a box-office figure as "₦82M · $51K".
 * Pass the film's country code so the correct local currency is used.
 */
export function fmtDual(n: number | bigint, country?: string): string {
  const num = typeof n === "bigint" ? Number(n) : n;
  const { symbol, perUsd } = FX[country ?? "NG"] ?? FX.NG;
  return `${fmtLocal(num, symbol)} · ${fmtUsdNum(num, perUsd)}`;
}

export function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}
