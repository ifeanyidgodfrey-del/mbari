/**
 * scripts/enrich-omdb.ts
 *
 * Enriches existing M'Bari films using the OMDb API:
 *   - criticScore  — mapped from Rotten Tomatoes or Metascore (0-100)
 *   - awards       — award win/nomination strings
 *   - Patches imdbId if missing
 *
 * Requires: OMDB_API_KEY in .env.local
 *   → Free tier (1,000 req/day): https://www.omdbapi.com/apikey.aspx
 *
 * Usage (inside Docker container or locally with DATABASE_URL set):
 *   npx tsx scripts/enrich-omdb.ts
 *
 * Re-runnable — only updates rows with null/empty values.
 */

import { Client } from "pg";

const OMDB_BASE = "https://www.omdbapi.com";

type OmdbResponse = {
  Response: "True" | "False";
  Title: string;
  Awards?: string;       // e.g. "Won 2 Oscars. 14 wins & 34 nominations total."
  Ratings?: { Source: string; Value: string }[];  // RT, Metacritic, IMDB
  Metascore?: string;    // "85" or "N/A"
  imdbRating?: string;   // "7.8" or "N/A"
  imdbID?: string;
};

async function omdbFetch(imdbId: string): Promise<OmdbResponse> {
  const key = process.env.OMDB_API_KEY;
  if (!key) throw new Error("OMDB_API_KEY not set — get a free key at https://www.omdbapi.com/apikey.aspx");
  const url = `${OMDB_BASE}/?i=${imdbId}&apikey=${key}&tomatoes=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDb HTTP ${res.status}`);
  return res.json() as Promise<OmdbResponse>;
}

/** Extract a 0-100 critic score from OMDb ratings. Prefers RT, falls back to Metascore. */
function extractCriticScore(data: OmdbResponse): number | null {
  // Rotten Tomatoes percentage
  const rt = data.Ratings?.find((r) => r.Source === "Rotten Tomatoes");
  if (rt && rt.Value.endsWith("%")) {
    const v = parseInt(rt.Value, 10);
    if (!isNaN(v)) return v;
  }
  // Metacritic /100
  if (data.Metascore && data.Metascore !== "N/A") {
    const v = parseInt(data.Metascore, 10);
    if (!isNaN(v)) return v;
  }
  // IMDb /10 → scale to /100
  if (data.imdbRating && data.imdbRating !== "N/A") {
    const v = parseFloat(data.imdbRating);
    if (!isNaN(v)) return Math.round(v * 10);
  }
  return null;
}

/** Parse award wins and nominations from OMDb award string */
function parseAwards(awardsStr: string | undefined): string[] {
  if (!awardsStr || awardsStr === "N/A") return [];
  // Return each sentence as a separate award string
  return awardsStr
    .split(/\.\s+/)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter((s) => s.length > 3);
}

async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();

  // Only enrich films that have an imdbId
  const { rows: films } = await db.query<{
    id: string; title: string; imdbId: string; criticScore: number | null; awards: string[];
  }>(
    `SELECT id, title, "imdbId", "criticScore", awards
     FROM "Film"
     WHERE "imdbId" IS NOT NULL AND "imdbId" != ''
     ORDER BY title`
  );

  console.log(`\nEnriching ${films.length} films via OMDb...\n`);

  let enriched = 0, skipped = 0, failed = 0;

  for (const film of films) {
    try {
      const data = await omdbFetch(film.imdbId);

      if (data.Response !== "True") {
        console.log(`  SKIP  ${film.title} — OMDb: not found`);
        skipped++;
        continue;
      }

      const newScore = extractCriticScore(data);
      const newAwards = parseAwards(data.Awards);

      // Only update fields that are currently empty
      const updates: string[] = [];
      const vals: (number | string | string[] | null)[] = [];
      let idx = 1;

      if (film.criticScore == null && newScore != null) {
        updates.push(`"criticScore" = $${idx++}`);
        vals.push(newScore);
      }
      if (film.awards.length === 0 && newAwards.length > 0) {
        updates.push(`awards = $${idx++}::text[]`);
        vals.push(newAwards);
      }

      if (updates.length === 0) {
        console.log(`  SKIP  ${film.title} — already enriched`);
        skipped++;
        continue;
      }

      vals.push(film.id);
      await db.query(
        `UPDATE "Film" SET ${updates.join(", ")}, "updatedAt" = NOW() WHERE id = $${idx}`,
        vals
      );

      console.log(
        `  OK    ${film.title} — score: ${newScore ?? "—"} | awards: ${newAwards.length > 0 ? newAwards[0] : "none"}`
      );
      enriched++;
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("OMDB_API_KEY not set")) {
        console.error(`\n  ERROR: ${msg}\n`);
        break;
      }
      console.error(`  FAIL  ${film.title}:`, msg);
      failed++;
    }
  }

  await db.end();
  console.log(`\n── Done ──`);
  console.log(`  Enriched : ${enriched}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Failed   : ${failed}`);
}

main().catch(console.error);
