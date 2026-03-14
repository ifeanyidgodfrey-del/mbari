/**
 * TMDb API v3 client
 * Docs: https://developer.themoviedb.org/reference/intro/getting-started
 */

const BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

export const TMDB_POSTER_URL = (path: string, size: "w342" | "w500" | "original" = "w500") =>
  path ? `${IMG_BASE}/${size}${path}` : null;

export const TMDB_BACKDROP_URL = (path: string, size: "w780" | "w1280" | "original" = "w1280") =>
  path ? `${IMG_BASE}/${size}${path}` : null;

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  const bearerToken = process.env.TMDB_API_TOKEN;

  if (!apiKey && !bearerToken) throw new Error("TMDB_API_KEY or TMDB_API_TOKEN must be set");

  const url = new URL(`${BASE}${path}`);
  if (apiKey) url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const headers: Record<string, string> = { Accept: "application/json" };
  if (bearerToken && !apiKey) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 300 }, // cache 5 min in Next.js data cache
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TMDb ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string; // YYYY-MM-DD
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  origin_country?: string[];
}

export interface TmdbMovieDetail extends TmdbMovie {
  runtime: number | null;
  status: string;
  tagline: string;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string; english_name: string }[];
  credits: {
    cast: {
      id: number;
      name: string;
      character: string;
      order: number;
      known_for_department: string;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
    }[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
  external_ids?: {
    imdb_id: string | null;
  };
}

export interface TmdbSearchResult {
  page: number;
  results: TmdbMovie[];
  total_results: number;
  total_pages: number;
}

// ─── Region map ──────────────────────────────────────────────────────────────

export const REGIONS: { code: string; label: string; flag: string }[] = [
  { code: "NG", label: "Nigeria", flag: "🇳🇬" },
  { code: "GH", label: "Ghana", flag: "🇬🇭" },
  { code: "ZA", label: "South Africa", flag: "🇿🇦" },
  { code: "KE", label: "Kenya", flag: "🇰🇪" },
  { code: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", label: "Senegal", flag: "🇸🇳" },
  { code: "ET", label: "Ethiopia", flag: "🇪🇹" },
  { code: "CM", label: "Cameroon", flag: "🇨🇲" },
];

// ─── Language map (TMDb → M'Bari code) ───────────────────────────────────────

export const LANG_MAP: Record<string, string> = {
  yo: "yo",
  ig: "ig",
  ha: "ha",
  pcm: "pcm",
  zu: "zu",
  xh: "xh",
  sw: "sw",
  am: "am",
  fr: "fr",
  en: "en",
};

// ─── Genre map ────────────────────────────────────────────────────────────────

export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Discover films by region (origin country ISO 3166-1)
 * Sorted by popularity by default
 */
export async function discoverByRegion(
  region: string,
  page = 1,
  sortBy: "popularity.desc" | "revenue.desc" | "release_date.desc" = "popularity.desc",
  year?: number
): Promise<TmdbSearchResult> {
  const params: Record<string, string> = {
    with_origin_country: region,
    sort_by: sortBy,
    page: String(page),
    "vote_count.gte": "5", // filter out noise
  };
  if (year) {
    params.primary_release_year = String(year);
  }
  return tmdbFetch<TmdbSearchResult>("/discover/movie", params);
}

/**
 * Free-text search with optional region filter
 */
export async function searchMovies(
  query: string,
  page = 1,
  region?: string
): Promise<TmdbSearchResult> {
  const params: Record<string, string> = { query, page: String(page) };
  if (region) params.region = region;
  return tmdbFetch<TmdbSearchResult>("/search/movie", params);
}

/**
 * Get full film details including credits and videos
 */
export async function getMovieDetail(tmdbId: number): Promise<TmdbMovieDetail> {
  return tmdbFetch<TmdbMovieDetail>(`/movie/${tmdbId}`, {
    append_to_response: "credits,videos,external_ids",
  });
}

/**
 * Convert a TMDb movie detail into a M'Bari Film record shape
 * (ready to upsert into Prisma — minus M'Bari-specific fields)
 */
export function tmdbToFilmShape(detail: TmdbMovieDetail) {
  const year = detail.release_date ? Number(detail.release_date.slice(0, 4)) : 0;
  const runtime = detail.runtime ? `${detail.runtime} min` : null;

  // Primary country
  const country = detail.production_countries[0]?.iso_3166_1 ?? "NG";

  // Genres
  const genres = detail.genres.map((g) => g.name);

  // YouTube trailer
  const trailer = detail.videos?.results.find(
    (v) => v.site === "YouTube" && v.type === "Trailer" && v.official
  ) ?? detail.videos?.results.find((v) => v.site === "YouTube" && v.type === "Trailer");
  const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

  // Cast (top 8)
  const cast = detail.credits.cast
    .sort((a, b) => a.order - b.order)
    .slice(0, 8)
    .map((c) => ({ name: c.name, character: c.character }));

  // Key crew
  const crew = detail.credits.crew.filter((c) =>
    ["Director", "Writer", "Screenplay", "Producer", "Executive Producer",
     "Director of Photography", "Original Music Composer", "Editor"].includes(c.job)
  );

  // Slug
  const slug = detail.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    + (year ? `-${year}` : "");

  return {
    slug,
    title: detail.title,
    year,
    runtime,
    rated: null,
    tagline: detail.tagline || null,
    synopsis: detail.overview,
    posterUrl: detail.poster_path ? TMDB_POSTER_URL(detail.poster_path) : null,
    backdropUrl: detail.backdrop_path ? TMDB_BACKDROP_URL(detail.backdrop_path) : null,
    country,
    genres,
    tmdbId: detail.id,
    imdbId: detail.external_ids?.imdb_id ?? null,
    trailerUrl,
    cast,
    crew,
    originalLanguage: detail.original_language,
  };
}
