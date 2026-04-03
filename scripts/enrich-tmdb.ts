/**
 * scripts/enrich-tmdb.ts
 *
 * Enriches existing M'Bari films using the TMDb API:
 *   1. FilmLanguage — spoken languages with estimated percentages
 *   2. Availability  — streaming/rent/buy providers per country (JustWatch data via TMDb)
 *   3. Plugs any missing: tagline, runtime, imdbId, trailerUrl
 *
 * Usage (inside Docker container or locally with DATABASE_URL set):
 *   npx tsx scripts/enrich-tmdb.ts
 *
 * Re-runnable — all inserts use ON CONFLICT DO NOTHING or DO UPDATE.
 */

import { Client } from "pg";

const TMDB_BASE = "https://api.themoviedb.org/3";

// Countries to pull watch-provider data for
const PROVIDER_COUNTRIES = ["NG", "GH", "ZA", "KE", "EG", "ET", "MA", "US", "GB", "FR"];

type TmdbDetail = {
  id: number;
  title: string;
  tagline?: string;
  runtime?: number;
  original_language: string;
  spoken_languages: { iso_639_1: string; english_name: string; name: string }[];
  external_ids?: { imdb_id?: string | null };
  videos?: { results: { key: string; site: string; type: string; official: boolean }[] };
};

type WatchProvider = { provider_id: number; provider_name: string };
type ProviderSet = { flatrate?: WatchProvider[]; rent?: WatchProvider[]; buy?: WatchProvider[] };
type WatchProvidersResponse = { results: Record<string, ProviderSet> };

async function tmdbGet<T>(path: string, extra = ""): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not set");
  const url = `${TMDB_BASE}${path}?api_key=${key}&language=en-US${extra}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

/** Distribute 100% across N languages; original_language gets priority */
function distributePercentages(langs: string[], originalLang: string): Record<string, number> {
  // Put original language first
  const ordered = [
    ...langs.filter((l) => l === originalLang),
    ...langs.filter((l) => l !== originalLang),
  ];
  const n = ordered.length;
  if (n === 0) return {};
  if (n === 1) return { [ordered[0]]: 100 };
  // Taper: primary gets ~60%, rest share remainder evenly
  const primaryPct = Math.round(60 + (40 * (1 / n)));
  const remainder = 100 - primaryPct;
  const secondaryPct = Math.floor(remainder / (n - 1));
  const result: Record<string, number> = {};
  ordered.forEach((lang, i) => {
    result[lang] = i === 0 ? primaryPct : secondaryPct;
  });
  // Fix rounding — give leftover to primary
  const total = Object.values(result).reduce((a, b) => a + b, 0);
  result[ordered[0]] += 100 - total;
  return result;
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  // Fetch all films that have a tmdbId
  const { rows: films } = await db.query<{
    id: string; title: string; tmdbId: number; imdbId: string | null;
    trailerUrl: string | null; tagline: string | null; runtime: string | null;
  }>(
    `SELECT id, title, "tmdbId", "imdbId", "trailerUrl", tagline, runtime
     FROM "Film" WHERE "tmdbId" IS NOT NULL ORDER BY title`
  );

  console.log(`\nEnriching ${films.length} films via TMDb...\n`);

  let langAdded = 0, availAdded = 0, metaUpdated = 0;

  for (const film of films) {
    try {
      console.log(`  → ${film.title} (tmdb:${film.tmdbId})`);

      // ── 1. Fetch film detail (for languages, tagline, runtime, imdbId)
      const detail = await tmdbGet<TmdbDetail>(
        `/movie/${film.tmdbId}`,
        "&append_to_response=external_ids,videos"
      );

      // ── 2. Patch missing metadata
      const patchFields: string[] = [];
      const patchVals: (string | null)[] = [];
      let idx = 1;

      if (!film.tagline && detail.tagline) {
        patchFields.push(`tagline = $${idx++}`);
        patchVals.push(detail.tagline);
      }
      if (!film.runtime && detail.runtime) {
        patchFields.push(`runtime = $${idx++}`);
        patchVals.push(`${detail.runtime} min`);
      }
      if (!film.imdbId && detail.external_ids?.imdb_id) {
        patchFields.push(`"imdbId" = $${idx++}`);
        patchVals.push(detail.external_ids.imdb_id);
      }
      if (!film.trailerUrl) {
        const t = detail.videos?.results.find(
          (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
        ) ?? detail.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
        if (t) {
          patchFields.push(`"trailerUrl" = $${idx++}`);
          patchVals.push(`https://www.youtube.com/watch?v=${t.key}`);
        }
      }

      if (patchFields.length > 0) {
        patchVals.push(film.id);
        await db.query(
          `UPDATE "Film" SET ${patchFields.join(", ")}, "updatedAt" = NOW()
           WHERE id = $${idx}`,
          patchVals
        );
        console.log(`      meta: updated ${patchFields.join(", ").replace(/\$\d+/g, "").trim()}`);
        metaUpdated++;
      }

      // ── 3. FilmLanguage — upsert Language records, then FilmLanguage
      if (detail.spoken_languages.length > 0) {
        const codes = detail.spoken_languages.map((l) => l.iso_639_1).filter(Boolean);
        const pctMap = distributePercentages(codes, detail.original_language);

        for (const lang of detail.spoken_languages) {
          if (!lang.iso_639_1) continue;
          const code = lang.iso_639_1;
          const name = lang.english_name || lang.name || code;
          const native = lang.name !== lang.english_name ? lang.name : null;

          // Upsert Language
          const { rows: langRows } = await db.query<{ id: string }>(
            `INSERT INTO "Language" (id, code, name, native)
             VALUES (gen_random_uuid(), $1, $2, $3)
             ON CONFLICT (code) DO UPDATE SET
               name = EXCLUDED.name,
               native = COALESCE(EXCLUDED.native, "Language".native)
             RETURNING id`,
            [code, name, native]
          );
          const languageId = langRows[0].id;

          // Upsert FilmLanguage
          const pct = pctMap[code] ?? Math.floor(100 / codes.length);
          const { rowCount } = await db.query(
            `INSERT INTO "FilmLanguage" (id, "filmId", "languageId", percentage)
             VALUES (gen_random_uuid(), $1, $2, $3)
             ON CONFLICT ("filmId", "languageId") DO UPDATE SET percentage = EXCLUDED.percentage`,
            [film.id, languageId, pct]
          );
          if ((rowCount ?? 0) > 0) langAdded++;
        }
        console.log(`      langs: ${codes.join(", ")}`);
      }

      // ── 4. Watch providers → Availability
      const provData = await tmdbGet<WatchProvidersResponse>(
        `/movie/${film.tmdbId}/watch/providers`
      );
      await new Promise((r) => setTimeout(r, 250)); // small pause between calls

      for (const country of PROVIDER_COUNTRIES) {
        const countryData = provData.results[country];
        if (!countryData) continue;

        const accessMap: [keyof ProviderSet, string][] = [
          ["flatrate", "stream"],
          ["rent", "rent"],
          ["buy", "buy"],
        ];

        for (const [key, accessType] of accessMap) {
          const providers = countryData[key] ?? [];
          for (const p of providers) {
            const { rowCount } = await db.query(
              `INSERT INTO "Availability" (id, "filmId", "countryCode", platform, "accessType", url)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, NULL)
               ON CONFLICT ("filmId", "countryCode", platform) DO NOTHING`,
              [film.id, country, p.provider_name, accessType]
            );
            if ((rowCount ?? 0) > 0) {
              console.log(`      avail: ${country} · ${p.provider_name} (${accessType})`);
              availAdded++;
            }
          }
        }
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  FAIL  ${film.title}:`, err instanceof Error ? err.message : err);
    }
  }

  await db.end();
  console.log(`\n── Done ──`);
  console.log(`  Languages added/updated : ${langAdded}`);
  console.log(`  Availability rows added  : ${availAdded}`);
  console.log(`  Films with meta patched  : ${metaUpdated}`);
}

main().catch(console.error);
