/**
 * POST /api/admin/manual-import
 *
 * Adds a film that has no TMDb entry (or hasn't been catalogued there yet).
 * All film metadata is provided directly in the request body.
 *
 * Body: {
 *   title: string,
 *   year: number,
 *   country: string,
 *   synopsis: string,
 *   genres: string[],
 *   runtime?: string,
 *   tagline?: string,
 *   posterUrl?: string,
 *   backdropUrl?: string,
 *   trailerUrl?: string,
 *   rated?: string,
 *   slugOverride?: string,
 *   awards?: string[],
 *   languages?: { code: string; percentage: number }[],
 *   availability?: { countryCode: string; platform: string; accessType: string; url?: string }[],
 *   criticScore?: number,
 *   audienceScore?: number,
 *   verifiedScore?: number,
 *   heatScore?: number,
 *   boxWeekend?: number,
 *   boxCumulative?: number,
 *   boxWeek?: number,
 *   boxLive?: boolean,
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mirrorFilmImages } from "@/lib/r2";
import { validateFilm, validateLanguages, validateAvailability } from "@/lib/validation";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title, year, country, synopsis, genres = [],
      runtime, tagline, posterUrl, backdropUrl, trailerUrl,
      rated, slugOverride, awards = [],
      languages, availability,
      criticScore, audienceScore, verifiedScore, heatScore,
      boxWeekend, boxCumulative, boxWeek, boxLive,
    } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    const filmValidation = validateFilm({
      title, year, country, genres,
      criticScore, audienceScore, verifiedScore, heatScore,
      boxWeekend, boxCumulative, boxWeek, boxLive,
      posterUrl,
    });

    if (!filmValidation.valid) {
      return NextResponse.json({
        error: "Validation failed",
        errors: filmValidation.errors,
        warnings: filmValidation.warnings,
      }, { status: 422 });
    }

    if (languages && languages.length > 0) {
      const langValidation = validateLanguages(languages);
      if (!langValidation.valid) {
        return NextResponse.json({
          error: "Language validation failed",
          errors: langValidation.errors,
          warnings: langValidation.warnings,
        }, { status: 422 });
      }
    }

    if (availability && availability.length > 0) {
      const availValidation = validateAvailability(availability);
      if (!availValidation.valid) {
        return NextResponse.json({
          error: "Availability validation failed",
          errors: availValidation.errors,
          warnings: availValidation.warnings,
        }, { status: 422 });
      }
    }

    // ── Slug ─────────────────────────────────────────────────────────────────
    const slug = slugOverride ?? `${slugify(title)}-${year}`;

    // ── Mirror images to R2 ──────────────────────────────────────────────────
    const { posterUrl: storedPoster, backdropUrl: storedBackdrop } =
      await mirrorFilmImages(slug, posterUrl ?? null, backdropUrl ?? null);

    // ── Upsert Film ──────────────────────────────────────────────────────────
    const film = await prisma.film.upsert({
      where: { slug },
      create: {
        slug,
        title,
        year,
        country,
        synopsis,
        genres,
        runtime: runtime ?? null,
        tagline: tagline ?? null,
        posterUrl: storedPoster,
        backdropUrl: storedBackdrop,
        trailerUrl: trailerUrl ?? null,
        rated: rated ?? null,
        awards,
        tmdbId: null,
        imdbId: null,
        criticScore: criticScore ?? null,
        audienceScore: audienceScore ?? null,
        verifiedScore: verifiedScore ?? null,
        heatScore: heatScore ?? null,
        boxWeekend: boxWeekend ? BigInt(boxWeekend) : null,
        boxCumulative: boxCumulative ? BigInt(boxCumulative) : null,
        boxWeek: boxWeek ?? null,
        boxLive: boxLive ?? false,
      },
      update: {
        title, year, country, synopsis, genres,
        runtime: runtime ?? null,
        tagline: tagline ?? null,
        posterUrl: storedPoster,
        backdropUrl: storedBackdrop,
        trailerUrl: trailerUrl ?? null,
        ...(rated !== undefined && { rated }),
        ...(criticScore !== undefined && { criticScore }),
        ...(audienceScore !== undefined && { audienceScore }),
        ...(verifiedScore !== undefined && { verifiedScore }),
        ...(heatScore !== undefined && { heatScore }),
        ...(boxWeekend !== undefined && { boxWeekend: BigInt(boxWeekend) }),
        ...(boxCumulative !== undefined && { boxCumulative: BigInt(boxCumulative) }),
        ...(boxWeek !== undefined && { boxWeek }),
        ...(boxLive !== undefined && { boxLive }),
        ...(awards.length > 0 && { awards }),
      },
    });

    // ── Languages ────────────────────────────────────────────────────────────
    const langs = languages ?? [{ code: "en", percentage: 100 }];
    for (const l of langs) {
      const lang = await prisma.language.upsert({
        where: { code: l.code },
        create: { code: l.code, name: l.code, native: null },
        update: {},
      });
      await prisma.filmLanguage.upsert({
        where: { filmId_languageId: { filmId: film.id, languageId: lang.id } },
        create: { filmId: film.id, languageId: lang.id, percentage: l.percentage },
        update: { percentage: l.percentage },
      });
    }

    // ── Availability ─────────────────────────────────────────────────────────
    if (availability && availability.length > 0) {
      for (const a of availability) {
        await prisma.availability.upsert({
          where: {
            filmId_countryCode_platform: {
              filmId: film.id,
              countryCode: a.countryCode,
              platform: a.platform,
            },
          },
          create: {
            filmId: film.id,
            countryCode: a.countryCode,
            platform: a.platform,
            accessType: a.accessType,
            url: a.url ?? null,
          },
          update: { accessType: a.accessType, url: a.url ?? null },
        });
      }
    }

    return NextResponse.json({
      success: true,
      film: { id: film.id, slug: film.slug, title: film.title, year: film.year, posterUrl: film.posterUrl },
      validation: { warnings: filmValidation.warnings },
    });
  } catch (err) {
    console.error("[/api/admin/manual-import]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A film with this slug already exists. Use slugOverride to change it." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
