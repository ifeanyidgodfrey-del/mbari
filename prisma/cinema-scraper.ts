/**
 * prisma/cinema-scraper.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Mbari Sync — Cinema intelligence scraper
 *
 * Sources:
 *   Revenue (primary):  elCinema EG (weekly + cumulative EGP — verified)
 *   Titles only:        Ster-Kinekor ZA, Nu Metro ZA, KenyaBuzz KE,
 *                       Anga Cinemas KE, Silverbird GH, viewGhana GH
 *   Indie/Festival:     Zawya EG, Labia ZA
 *   Note:               FilmOne NG requires authenticated session — manual entry
 *
 * Revenue strategy:
 *   EG  → boxCumulative in piastres (EGP × 100), boxWeekendLocal in piastres
 *   NG  → manual entry via /admin (FilmOne scorecard)
 *   ZA/KE/GH → screenCount only
 *
 * Ignore list:  prisma/ignore-titles.json  (rejected candidates never re-surface)
 *
 * Outputs:
 *   prisma/review-queue.json            new films for admin approval
 *   prisma/deactivation-candidates.json stale boxLive films (>14d unseen)
 *
 * Run:  npx tsx prisma/cinema-scraper.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as cheerio from "cheerio";
import { differenceInDays } from "date-fns";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const QUEUE_PATH      = path.join(__dirname, "review-queue.json");
const DEACT_PATH      = path.join(__dirname, "deactivation-candidates.json");
const IGNORE_PATH     = path.join(__dirname, "ignore-titles.json");
const DEACTIVATION_THRESHOLD_DAYS = 14;
// Films in countries with NO scraper (e.g. NG/FilmOne requires auth) must be
// manually re-confirmed in /admin/sync every N days — otherwise they age off too.
const MAX_UNCONFIRMED_DAYS = 21;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScrapedFilm {
  title: string;
  country: string;
  source: string;
  isIndie: boolean;
  revenueWeekly?: number;   // EG only — EGP × 100 (piastres)
  revenueTotal?: number;    // EG only — EGP × 100 (piastres)
  screenCount?: number;
}

// ─── Ignore list ─────────────────────────────────────────────────────────────

function loadIgnoreList(): Set<string> {
  if (!fs.existsSync(IGNORE_PATH)) { fs.writeFileSync(IGNORE_PATH, "[]"); }
  const list = JSON.parse(fs.readFileSync(IGNORE_PATH, "utf8")) as string[];
  return new Set(list.map(normalise));
}

// Known non-African international titles to pre-ignore
const ALWAYS_IGNORE = new Set([
  "scream 7", "avatar fire and ash", "zootopia 2", "minecraft movie",
  "return to silent hill", "wuthering heights", "hamnet",
  "send help", "killer whale", "primate", "the housemaid",
  "snow white", "dog man", "the spongebob movie search for squarepants",
]);

// Patterns that indicate nav/UI text — not film titles
const NAV_PATTERNS = [
  /^(search|home|menu|contact|about|submit|login|register|sign in|sign up)$/i,
  /^(quick links?|top articles?|related articles?|support|company|services?)$/i,
  /^(movies?|films?|cinema|cinemas|showtimes?|now showing|coming soon|tickets?)$/i,
  /^(leave your|cancel reply|comments?|reply|share|read more|view more|see all)$/i,
  /^(shopping|fashion|lifestyle|news|blog|entertainment|sports?|politics?)$/i,
  /\d+ comments?/i,
  /showing (at|this week)/i,
  /cinema tickets?/i,
  /^[A-Z\s]{2,}$/, // ALL CAPS nav items
  /^(0|1|2|[a-z])$/, // single char
  // Blog/article patterns
  /which app is best/i,
  /new option for/i,
  /\d{4}:.+/,        // "2026: article headline" format
  /:.*(?:ghanaians?|nigerians?|kenyans?)/i,
  /contact us/i,
  /leave your thought/i,
  /cancel reply/i,
];

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchHTML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) { console.warn(`  ⚠  ${url} → HTTP ${res.status}`); return null; }
    return await res.text();
  } catch (e) {
    console.warn(`  ⚠  ${url} → ${(e as Error).message}`);
    return null;
  }
}

// ─── Revenue parser: "3,652,074 EGP" or "71.9M" → piastres ─────────────────

function parseEGP(raw: string): number | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/[,\s]/g, "").trim();
  const m = s.match(/([\d.]+)\s*([BMKbmk])?/);
  if (!m) return undefined;
  let val = parseFloat(m[1]);
  if (!isFinite(val) || val === 0) return undefined;
  const mult = m[2]?.toUpperCase();
  if (mult === "B") val *= 1_000_000_000;
  else if (mult === "M") val *= 1_000_000;
  else if (mult === "K") val *= 1_000;
  return Math.round(val * 100); // EGP → piastres
}

// ─── elCinema box office — verified extraction pattern ───────────────────────

function extractElCinema(html: string): ScrapedFilm[] {
  // Navigation links to skip
  const NAV_LINKS = new Set(["playing in which cinemas?", "revenue details"]);

  // All links to /en/work/ pages — real films interleaved with nav
  const LINK_RE = /<a[^>]*href="\/en\/work\/[^"]*"[^>]*>([^<]{2,80})<\/a>/gi;
  const allLinks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = LINK_RE.exec(html)) !== null) {
    allLinks.push(m[1].trim());
  }

  // Real film titles = every link that isn't navigation
  const filmTitles = allLinks.filter((t) => !NAV_LINKS.has(t.toLowerCase()));

  const films: ScrapedFilm[] = [];
  for (const title of filmTitles) {
    if (title.length < 2 || title.length > 100) continue;

    // Find revenue near this title in the HTML
    const idx = html.indexOf(title);
    if (idx < 0) continue;
    const chunk = html.slice(idx, idx + 800);

    // Extract all EGP revenue numbers in this block
    const revNums = [...chunk.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*EGP/gi)]
      .map((n) => parseEGP(n[1]))
      .filter((n): n is number => !!n);

    // First = weekly, second = cumulative (as confirmed from live data)
    const revenueWeekly = revNums[0];
    const revenueTotal  = revNums[1] ?? revNums[0];

    films.push({ title, country: "EG", source: "elcinema", isIndie: false, revenueWeekly, revenueTotal });
  }

  return films;
}

// ─── Scraper definitions ──────────────────────────────────────────────────────

interface ScraperTarget {
  id: string;
  name: string;
  country: string;
  url: string;
  isIndie: boolean;
  extract: (html: string) => ScrapedFilm[];
}

const SCRAPERS: ScraperTarget[] = [

  // ── elCinema EG — verified revenue + titles ────────────────────────────────
  {
    id: "elcinema",
    name: "elCinema Box Office (EG)",
    country: "EG",
    url: "https://www.elcinema.com/en/boxoffice/",
    isIndie: false,
    extract: extractElCinema,
  },

  // ── Ster-Kinekor ZA ───────────────────────────────────────────────────────
  {
    id: "sterkinekor-za",
    name: "Ster-Kinekor ZA",
    country: "ZA",
    url: "https://www.sterkinekor.com/program",
    isIndie: false,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      // Try multiple selector patterns
      const candidates: string[] = [];
      $("[class*='movie-title'],[class*='film-title'],h2,h3").each((_, el) => { candidates.push($(el).text().trim()); });
      $("a[href*='/movies/']").each((_, el) => { candidates.push($(el).text().trim()); });
      for (const title of candidates) {
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "ZA", source: "sterkinekor", isIndie: false });
        }
      }
      return films;
    },
  },

  // ── Nu Metro ZA ───────────────────────────────────────────────────────────
  {
    id: "numetro-za",
    name: "Nu Metro ZA",
    country: "ZA",
    url: "https://www.numetro.co.za/movies/now-showing",
    isIndie: false,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $("[class*='movie-title'],[class*='film-name'],h3,h2").each((_, el) => {
        const title = $(el).text().trim();
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "ZA", source: "numetro", isIndie: false });
        }
      });
      return films;
    },
  },

  // ── KenyaBuzz KE ──────────────────────────────────────────────────────────
  {
    id: "kenyabuzz",
    name: "KenyaBuzz Cinemas (KE)",
    country: "KE",
    url: "https://kenyabuzz.com/cinemas",
    isIndie: false,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $("[class*='movie'],[class*='film']").each((_, el) => {
        const title = $(el).find("[class*='title'],h3,h2").first().text().trim() || $(el).text().trim();
        const screens = $(el).find("[class*='cinema']").length;
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title);
          films.push({ title, country: "KE", source: "kenyabuzz", isIndie: false, screenCount: screens || undefined });
        }
      });
      return films;
    },
  },

  // ── Anga / Nyali Cinemax KE ───────────────────────────────────────────────
  {
    id: "anga-ke",
    name: "Anga Cinemas Kenya",
    country: "KE",
    url: "https://www.angacinemas.co.ke/now-showing",
    isIndie: false,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $("[class*='title'],h2,h3,a[href*='/movie/']").each((_, el) => {
        const title = $(el).text().trim();
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "KE", source: "anga", isIndie: false });
        }
      });
      return films;
    },
  },

  // ── Silverbird GH ─────────────────────────────────────────────────────────
  {
    id: "silverbird-gh",
    name: "Silverbird Ghana",
    country: "GH",
    url: "https://silverbirdcinemas.com/genre/now-showing/",
    isIndie: false,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $(".entry-title,h2,h3,[class*='movie-title']").each((_, el) => {
        const title = $(el).text().trim();
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "GH", source: "silverbird-gh", isIndie: false });
        }
      });
      return films;
    },
  },

  // ── viewGhana GH ──────────────────────────────────────────────────────────
  {
    id: "viewghana",
    name: "viewGhana Movies",
    country: "GH",
    url: "https://viewghana.com/movies",
    isIndie: false,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $("[class*='movie'],[class*='film'],h3,h2").each((_, el) => {
        const title = $(el).find("[class*='title'],h3,h2").first().text().trim() || $(el).text().trim();
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "GH", source: "viewghana", isIndie: false });
        }
      });
      return films;
    },
  },

  // ── Zawya EG (indie/arthouse) ─────────────────────────────────────────────
  {
    id: "zawya-eg",
    name: "Zawya Cairo (Indie/EG)",
    country: "EG",
    url: "https://www.zawyafilm.com/en/now-showing",
    isIndie: true,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $("[class*='film-title'],[class*='movie-title'],h3,h2").each((_, el) => {
        const title = $(el).text().trim();
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "EG", source: "zawya", isIndie: true });
        }
      });
      return films;
    },
  },

  // ── Labia Theatre ZA (indie) ──────────────────────────────────────────────
  {
    id: "labia-za",
    name: "Labia Theatre Cape Town",
    country: "ZA",
    url: "https://www.labia.co.za",
    isIndie: true,
    extract: (html) => {
      const $ = cheerio.load(html);
      const films: ScrapedFilm[] = [];
      const seen = new Set<string>();
      $("h1,h2,h3,[class*='title'],[class*='film']").each((_, el) => {
        const title = $(el).text().trim();
        if (title.length > 2 && title.length < 100 && !seen.has(title)) {
          seen.add(title); films.push({ title, country: "ZA", source: "labia", isIndie: true });
        }
      });
      return films;
    },
  },
];

// ─── Title normalisation + fuzzy match ───────────────────────────────────────

function normalise(title: string): string {
  return title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function titlesMatch(a: string, b: string): boolean {
  const na = normalise(a), nb = normalise(b);
  if (na === nb) return true;
  if (na.length > 4 && nb.includes(na)) return true;
  if (nb.length > 4 && na.includes(nb)) return true;
  return false;
}

// Normalise country field — DB has some films as "Nigeria" instead of "NG"
const COUNTRY_ISO: Record<string, string> = {
  nigeria: "NG", "south africa": "ZA", kenya: "KE",
  ghana: "GH", ethiopia: "ET", egypt: "EG",
};
function isoCountry(c: string): string {
  return COUNTRY_ISO[c.toLowerCase()] ?? c;
}

// ─── Run all scrapers ─────────────────────────────────────────────────────────

async function runScrapers(): Promise<Map<string, ScrapedFilm[]>> {
  const byCountry = new Map<string, ScrapedFilm[]>();

  for (const scraper of SCRAPERS) {
    process.stdout.write(`  ${scraper.name}...`);
    const html = await fetchHTML(scraper.url);
    if (!html) { console.log(" ✗"); continue; }

    const raw = scraper.extract(html);
    const seen = new Set<string>();
    const films = raw.filter((f) => {
      const key = normalise(f.title);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const existing = byCountry.get(scraper.country) ?? [];
    byCountry.set(scraper.country, [...existing, ...films]);
    console.log(` ✓ ${films.length} titles`);
    await sleep(1500);
  }

  return byCountry;
}

// ─── Reconcile: flag stale boxLive films ─────────────────────────────────────

async function reconcileBoxLive(byCountry: Map<string, ScrapedFilm[]>): Promise<void> {
  // Only reconcile countries where we actually scraped data this run
  // Countries with no scraper (NG) are skipped — manual admin manages those
  const coveredCountries = new Set([...byCountry.keys()]);
  console.log(`  Coverage: ${[...coveredCountries].join(", ")} (NG is manual — FilmOne requires auth)`);

  const activeFilms = await prisma.film.findMany({
    where: { boxLive: true },
    select: { id: true, slug: true, title: true, country: true, lastScrapedAt: true },
  });

  const deactivation: object[] = [];
  const now = new Date();

  for (const film of activeFilms) {
    const iso = isoCountry(film.country);
    const noScraper = !coveredCountries.has(iso) && !coveredCountries.has(film.country);

    if (noScraper) {
      // No scraper for this country (e.g. NG — FilmOne requires auth).
      // We cannot confirm via scrape, so we enforce a MAX_UNCONFIRMED_DAYS cap.
      // Admin must click "Still Live" in /admin/sync every 21 days to keep it active.
      const daysSinceConfirm = film.lastScrapedAt
        ? differenceInDays(now, film.lastScrapedAt)
        : MAX_UNCONFIRMED_DAYS + 1;

      if (daysSinceConfirm >= MAX_UNCONFIRMED_DAYS) {
        await prisma.film.update({ where: { id: film.id }, data: { boxLive: false } });
        deactivation.push({
          slug: film.slug, title: film.title, country: film.country,
          daysMissing: daysSinceConfirm,
          lastScrapedAt: film.lastScrapedAt?.toISOString() ?? null,
          action: "unconfirmed_no_scraper",
          deactivatedAt: now.toISOString(),
        });
        console.log(`  ✗  UNCONFIRMED: "${film.title}" (${film.country}) — ${daysSinceConfirm}d without admin confirmation`);
      } else {
        console.log(`  ⏭  No scraper for ${iso} — confirmed ${daysSinceConfirm}d ago, ${MAX_UNCONFIRMED_DAYS - daysSinceConfirm}d remaining`);
      }
      continue;
    }

    const countryFilms = byCountry.get(iso) ?? byCountry.get(film.country) ?? [];
    const found = countryFilms.some((sf) => titlesMatch(sf.title, film.title));

    if (found) {
      await prisma.film.update({ where: { id: film.id }, data: { lastScrapedAt: now } });
    } else {
      const daysMissing = film.lastScrapedAt
        ? differenceInDays(now, film.lastScrapedAt)
        : DEACTIVATION_THRESHOLD_DAYS + 1;

      if (daysMissing >= DEACTIVATION_THRESHOLD_DAYS) {
        // Auto-deactivate — scraper is the gatekeeper, no admin confirmation needed
        await prisma.film.update({ where: { id: film.id }, data: { boxLive: false } });
        deactivation.push({
          slug: film.slug, title: film.title, country: film.country,
          daysMissing, lastScrapedAt: film.lastScrapedAt?.toISOString() ?? null,
          action: "set_boxLive_false", deactivatedAt: now.toISOString(),
        });
        console.log(`  ✗  DEACTIVATED: "${film.title}" (${film.country}) — ${daysMissing}d unseen`);
      } else {
        console.log(`  ℹ  Grace: "${film.title}" (${daysMissing}d)`);
      }
    }
  }

  // Append to audit log (never wipe — keep history)
  const existing = fs.existsSync(DEACT_PATH) ? JSON.parse(fs.readFileSync(DEACT_PATH, "utf-8")) : [];
  const merged = [...existing.filter((e: any) => !deactivation.some((d: any) => d.slug === e.slug)), ...deactivation];
  fs.writeFileSync(DEACT_PATH, JSON.stringify(merged, null, 2));
  console.log(`\n  ${deactivation.length} films auto-deactivated`);
}

// ─── Revenue update: EG cumulative ───────────────────────────────────────────

async function updateRevenue(byCountry: Map<string, ScrapedFilm[]>): Promise<void> {
  let updated = 0;
  const egFilms = byCountry.get("EG") ?? [];

  for (const scraped of egFilms) {
    if (!scraped.revenueTotal) continue;
    const all = await prisma.film.findMany({ where: { country: "EG" }, select: { id: true, title: true, boxCumulative: true } });
    const match = all.find((f) => titlesMatch(f.title, scraped.title));
    if (!match) continue;
    const current = match.boxCumulative ? Number(match.boxCumulative) : 0;
    if (scraped.revenueTotal > current) {
      await prisma.film.update({ where: { id: match.id }, data: { boxCumulative: BigInt(scraped.revenueTotal) } });
      const egp = (scraped.revenueTotal / 100).toLocaleString();
      console.log(`  💰 "${scraped.title}" → ${egp} EGP`);
      updated++;
    }
  }
  if (updated === 0) console.log("  No EG revenue updates");
}

// ─── TMDb origin filter ───────────────────────────────────────────────────────

// African ISO country codes — films from these are always relevant
const AFRICAN_COUNTRIES = new Set([
  "NG", "ZA", "KE", "GH", "ET", "EG", "CM", "TZ", "MA", "SN", "CI",
  "UG", "RW", "ZW", "ZM", "MW", "MZ", "AO", "BW", "NA", "LS", "SZ",
  "TN", "DZ", "LY", "SD", "SO", "ER", "DJ", "BJ", "BF", "ML", "NE",
  "TD", "MR", "GN", "SL", "LR", "GW", "GM", "CV", "ST",
]);

// African/relevant language codes
const AFRICAN_LANGUAGES = new Set([
  "yo", "ig", "ha", "am", "ar", "af", "sw", "ak", "ff", "pcm",
  "zu", "xh", "st", "tn", "ss", "ve", "ts", "nr", "rw", "lg",
  "so", "om", "ti", "mg", "ny", "sn", "nd",
]);

interface TmdbOriginResult {
  found: boolean;
  originalLanguage?: string;
  productionCountries?: string[];   // ISO 3166-1 alpha-2
  tmdbId?: number;
  releaseYear?: number;
  autoReject: boolean;               // true = US English film → skip
  confidence: number;
  originNote: string;
}

async function checkTmdbOrigin(title: string, scraperCountry: string): Promise<TmdbOriginResult> {
  const TMDB_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_KEY) return { found: false, autoReject: false, confidence: 0.65, originNote: "no-api-key" };

  try {
    const url = new URL("https://api.themoviedb.org/3/search/movie");
    url.searchParams.set("api_key", TMDB_KEY);
    url.searchParams.set("query", title);
    url.searchParams.set("language", "en-US");
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return { found: false, autoReject: false, confidence: 0.65, originNote: `tmdb-${res.status}` };

    const data = await res.json() as { results: { id: number; original_language: string; release_date?: string; title: string }[] };
    if (!data.results?.length) return { found: false, autoReject: false, confidence: 0.55, originNote: "not-on-tmdb" };

    const top = data.results[0];
    await sleep(300); // rate limit

    // Fetch production countries for the top result
    const detailRes = await fetch(
      `https://api.themoviedb.org/3/movie/${top.id}?api_key=${TMDB_KEY}&language=en-US`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) }
    );
    await sleep(300);

    if (!detailRes.ok) {
      // Fall back to just language check
      const lang = top.original_language;
      const africanLang = AFRICAN_LANGUAGES.has(lang);
      return {
        found: true, tmdbId: top.id, originalLanguage: lang,
        autoReject: lang === "en" && !africanLang,
        confidence: africanLang ? 0.92 : 0.65,
        originNote: `lang:${lang}`,
      };
    }

    const detail = await detailRes.json() as {
      original_language: string;
      production_countries: { iso_3166_1: string }[];
      release_date?: string;
    };

    const lang = detail.original_language;
    const prodCountries = (detail.production_countries ?? []).map((c) => c.iso_3166_1);
    const isUSEnglish = lang === "en" && prodCountries.includes("US") && !prodCountries.some((c) => AFRICAN_COUNTRIES.has(c));
    const isAfrican = prodCountries.some((c) => AFRICAN_COUNTRIES.has(c));
    const hasAfricanLang = AFRICAN_LANGUAGES.has(lang);

    let confidence: number;
    let autoReject = false;
    let originNote: string;

    if (isUSEnglish) {
      // American English film found in an African cinema — likely Hollywood
      autoReject = true;
      confidence = 0;
      originNote = `us-english:${prodCountries.join(",")}`;
    } else if (isAfrican || hasAfricanLang) {
      confidence = 0.95;
      originNote = `african:${lang}:${prodCountries.join(",")}`;
    } else if (lang === "ar") {
      // Arabic — likely Egyptian or North African
      confidence = 0.88;
      originNote = `arabic:${prodCountries.join(",")}`;
    } else {
      // Unknown origin — keep but low confidence, flag for review
      confidence = 0.55;
      originNote = `foreign:${lang}:${prodCountries.join(",")}`;
    }

    return {
      found: true, tmdbId: top.id, originalLanguage: lang,
      productionCountries: prodCountries,
      autoReject, confidence, originNote,
    };
  } catch (e) {
    return { found: false, autoReject: false, confidence: 0.65, originNote: `error:${(e as Error).message.slice(0, 40)}` };
  }
}

// ─── Discover new films ───────────────────────────────────────────────────────

async function discoverNew(byCountry: Map<string, ScrapedFilm[]>): Promise<void> {
  const ignore = loadIgnoreList();
  const existing = await prisma.film.findMany({ select: { title: true, country: true } });

  const queue: object[] = fs.existsSync(QUEUE_PATH)
    ? JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8")) : [];
  const queueKeys = new Set((queue as { title: string }[]).map((q) => normalise(q.title)));

  let added = 0;

  for (const [country, films] of byCountry) {
    for (const f of films) {
      const key = normalise(f.title);
      if (ALWAYS_IGNORE.has(key) || ignore.has(key)) continue;
      // Filter nav/UI text
      if (NAV_PATTERNS.some((p) => p.test(f.title.trim()))) continue;
      const inDb = existing.some((e) => isoCountry(e.country) === country && titlesMatch(e.title, f.title));
      if (inDb || queueKeys.has(key)) continue;

      // TMDb origin filter — auto-reject US English films
      // But never auto-reject a title already in our DB (might be showing cross-border)
      const alreadyInDb = existing.some((e) => titlesMatch(e.title, f.title));
      const origin = alreadyInDb
        ? { found: true, autoReject: false, confidence: 0.85, originNote: "cross-border", tmdbId: undefined, originalLanguage: undefined, productionCountries: undefined }
        : await checkTmdbOrigin(f.title, country);

      if (origin.autoReject) {
        const ignoreList = JSON.parse(fs.readFileSync(IGNORE_PATH, "utf8")) as string[];
        const nkey = normalise(f.title);
        if (!ignoreList.map(normalise).includes(nkey)) {
          ignoreList.push(nkey);
          fs.writeFileSync(IGNORE_PATH, JSON.stringify(ignoreList, null, 2));
        }
        console.log(`  🚫 Auto-rejected (${origin.originNote}): "${f.title}"`);
        continue;
      }

      // Confidence: TMDb origin result takes priority, then source-based fallback
      const confidence = origin.found
        ? origin.confidence
        : f.revenueTotal ? 0.95 : f.source === "elcinema" ? 0.85 : 0.65;

      queue.push({
        title: f.title, country, source: f.source, isIndie: f.isIndie,
        revenueWeekly: f.revenueWeekly ?? null,
        revenueTotal: f.revenueTotal ?? null,
        screenCount: f.screenCount ?? null,
        tmdbId: origin.tmdbId ?? null,
        originalLanguage: origin.originalLanguage ?? null,
        productionCountries: origin.productionCountries ?? null,
        originNote: origin.originNote,
        confidence, discoveredAt: new Date().toISOString(),
        approved: false, notes: "",
      });
      queueKeys.add(key);
      added++;
    }
  }

  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  console.log(`  ${added} new → review-queue.json (${queue.length} total in queue)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── Mbari Cinema Sync ─────────────────────────────────────────\n");
  console.log("① Scraping sources...\n");
  const byCountry = await runScrapers();
  const total = [...byCountry.values()].reduce((s, a) => s + a.length, 0);
  console.log(`\n  ${total} titles across: ${[...byCountry.keys()].join(", ")}\n`);

  console.log("② Reconciling box office...\n");
  await reconcileBoxLive(byCountry);

  console.log("\n③ Revenue (EG)...\n");
  await updateRevenue(byCountry);

  console.log("\n④ Discovering new films...\n");
  await discoverNew(byCountry);

  console.log("\n── Done ──────────────────────────────────────────────────────");
  console.log("  review-queue.json  |  deactivation-candidates.json");
  console.log("  To reject a title: add its normalised name to ignore-titles.json");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
