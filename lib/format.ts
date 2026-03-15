// Approximate exchange rates (local units per 1 USD)
const FX: Record<string, { symbol: string; perUsd: number }> = {
  NG: { symbol: "₦", perUsd: 1600 },
  ZA: { symbol: "R",  perUsd: 18   },
  KE: { symbol: "KSh", perUsd: 130 },
  GH: { symbol: "₵", perUsd: 15   },
};

// Population in millions (2024 estimates)
const POP_M: Record<string, number> = {
  NG: 220,
  ZA: 60,
  KE: 55,
  GH: 33,
};

/**
 * Returns USD box office per capita in cents.
 * e.g. ₦1.88B in Nigeria → $1.175M / 220M people → 0.53¢/person
 */
export function perCapitaCents(n: number | bigint, country: string): number {
  const num = typeof n === "bigint" ? Number(n) : n;
  const { perUsd } = FX[country] ?? FX.NG;
  const pop = POP_M[country] ?? POP_M.NG;
  const usd = num / perUsd;
  return (usd / (pop * 1_000_000)) * 100; // cents per person
}

/** Format per-capita as "¢0.53" or "$1.20" */
export function fmtPerCap(n: number | bigint, country: string): string {
  const cents = perCapitaCents(n, country);
  if (cents >= 100) return `$${(cents / 100).toFixed(2)}`;
  if (cents >= 1)   return `¢${cents.toFixed(1)}`;
  return `¢${cents.toFixed(2)}`;
}

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
