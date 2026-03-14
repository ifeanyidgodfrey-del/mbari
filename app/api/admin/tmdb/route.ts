/**
 * GET /api/admin/tmdb?mode=discover&region=NG&page=1&sort=popularity.desc
 * GET /api/admin/tmdb?mode=search&query=jenifa&region=NG
 * GET /api/admin/tmdb?mode=detail&id=12345
 *
 * Proxies TMDb requests server-side (keeps API key off the client).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  discoverByRegion,
  searchMovies,
  getMovieDetail,
  TMDB_POSTER_URL,
  TMDB_BACKDROP_URL,
} from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode") ?? "discover";

  try {
    if (mode === "discover") {
      const region = searchParams.get("region") ?? "NG";
      const page = Number(searchParams.get("page") ?? 1);
      const sort = (searchParams.get("sort") ?? "popularity.desc") as
        | "popularity.desc"
        | "revenue.desc"
        | "release_date.desc";
      const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;

      const data = await discoverByRegion(region, page, sort, year);

      // Enrich with poster URLs + already-imported flag
      const tmdbIds = data.results.map((r) => r.id);
      const existing = await prisma.film.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true },
      }).catch(() => [] as { tmdbId: number | null }[]);

      const importedIds = new Set(existing.map((r) => r.tmdbId).filter(Boolean));

      return NextResponse.json({
        page: data.page,
        total_results: data.total_results,
        total_pages: data.total_pages,
        results: data.results.map((r) => ({
          ...r,
          poster_url: r.poster_path ? TMDB_POSTER_URL(r.poster_path, "w342") : null,
          backdrop_url: r.backdrop_path ? TMDB_BACKDROP_URL(r.backdrop_path, "w780") : null,
          already_imported: importedIds.has(r.id),
        })),
      });
    }

    if (mode === "search") {
      const query = searchParams.get("query") ?? "";
      const region = searchParams.get("region") ?? undefined;
      const page = Number(searchParams.get("page") ?? 1);

      if (!query.trim()) {
        return NextResponse.json({ results: [], total_results: 0, total_pages: 0, page: 1 });
      }

      const data = await searchMovies(query, page, region);

      return NextResponse.json({
        ...data,
        results: data.results.map((r) => ({
          ...r,
          poster_url: r.poster_path ? TMDB_POSTER_URL(r.poster_path, "w342") : null,
          backdrop_url: r.backdrop_path ? TMDB_BACKDROP_URL(r.backdrop_path, "w780") : null,
        })),
      });
    }

    if (mode === "detail") {
      const id = Number(searchParams.get("id"));
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      const detail = await getMovieDetail(id);
      return NextResponse.json({
        ...detail,
        poster_url: detail.poster_path ? TMDB_POSTER_URL(detail.poster_path, "w500") : null,
        backdrop_url: detail.backdrop_path ? TMDB_BACKDROP_URL(detail.backdrop_path, "w1280") : null,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("[/api/admin/tmdb]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
