/**
 * GET /api/admin/now-playing
 *
 * Calls TMDb's /movie/now_playing for each African region and cross-references
 * against M'Bari's DB. Returns films currently in cinemas that are NOT yet
 * imported, so admins can catch missing titles systematically.
 *
 * Query params:
 *   regions — comma-separated ISO codes (default: NG,GH,ZA,KE)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

interface TmdbNowPlayingResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  original_language: string;
}

interface TmdbNowPlayingResponse {
  results: TmdbNowPlayingResult[];
  total_pages: number;
}

async function fetchNowPlaying(region: string, page = 1): Promise<TmdbNowPlayingResponse> {
  const token = process.env.TMDB_API_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  if (!token && !apiKey) throw new Error("TMDB credentials not configured");

  const url = new URL(`${BASE}/movie/now_playing`);
  url.searchParams.set("region", region);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(page));
  if (apiKey) url.searchParams.set("api_key", apiKey);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (token && !apiKey) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDb ${res.status} for region ${region}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionParam = searchParams.get("regions") ?? "NG,GH,ZA,KE";
    const regions = regionParam.split(",").map((r) => r.trim().toUpperCase());

    // Fetch now-playing from all requested regions (page 1 only — top 20 per region)
    const allResults: (TmdbNowPlayingResult & { region: string })[] = [];

    await Promise.all(
      regions.map(async (region) => {
        try {
          const data = await fetchNowPlaying(region);
          for (const film of data.results) {
            if (!allResults.find((f) => f.id === film.id)) {
              allResults.push({ ...film, region });
            }
          }
        } catch {
          // Skip region if TMDb returns no data
        }
      })
    );

    if (allResults.length === 0) {
      return NextResponse.json({ missing: [], inDb: [], total: 0 });
    }

    // Cross-reference with M'Bari DB by tmdbId
    const tmdbIds = allResults.map((f) => f.id);
    const existing = await prisma.film.findMany({
      where: { tmdbId: { in: tmdbIds } },
      select: { tmdbId: true, slug: true, title: true, boxLive: true },
    });
    const existingIds = new Set(existing.map((f) => f.tmdbId));

    const missing = allResults
      .filter((f) => !existingIds.has(f.id))
      .map((f) => ({
        tmdbId: f.id,
        title: f.title,
        release_date: f.release_date,
        poster_url: f.poster_path ? `${IMG_BASE}/w342${f.poster_path}` : null,
        overview: f.overview,
        vote_average: f.vote_average,
        original_language: f.original_language,
        region: f.region,
      }));

    const inDb = allResults
      .filter((f) => existingIds.has(f.id))
      .map((f) => {
        const dbFilm = existing.find((e) => e.tmdbId === f.id)!;
        return {
          tmdbId: f.id,
          title: f.title,
          slug: dbFilm.slug,
          boxLive: dbFilm.boxLive,
          missingLiveFlag: !dbFilm.boxLive,
        };
      });

    return NextResponse.json({
      missing,
      inDb,
      total: allResults.length,
      regions,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
