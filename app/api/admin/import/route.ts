/**
 * POST /api/admin/import
 *
 * Body: {
 *   tmdbId: number,
 *   // M'Bari-specific overrides supplied by admin in the UI:
 *   languages: { code: string; percentage: number }[],
 *   availability: { countryCode: string; platform: string; accessType: string; url?: string }[],
 *   criticScore?: number,
 *   audienceScore?: number,
 *   verifiedScore?: number,
 *   heatScore?: number,
 *   boxWeekend?: number,
 *   boxCumulative?: number,
 *   boxWeek?: number,
 *   boxLive?: boolean,
 *   rated?: string,
 * }
 *
 * Flow:
 * 1. Fetch full TMDb detail
 * 2. Mirror poster + backdrop to Cloudflare R2
 * 3. Upsert Film in Prisma
 * 4. Create CastMember records
 * 5. Upsert CrewMember + CrewCredit records
 * 6. Upsert Language + FilmLanguage records
 * 7. Upsert Availability records
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMovieDetail, tmdbToFilmShape } from "@/lib/tmdb";
import { mirrorFilmImages } from "@/lib/r2";
import { validateFilm, validateLanguages, validateAvailability } from "@/lib/validation";

export const dynamic = "force-dynamic";

interface ImportBody {
  tmdbId: number;
  languages?: { code: string; percentage: number }[];
  availability?: { countryCode: string; platform: string; accessType: string; url?: string }[];
  criticScore?: number;
  audienceScore?: number;
  verifiedScore?: number;
  heatScore?: number;
  boxWeekend?: number;
  boxCumulative?: number;
  boxWeek?: number;
  boxLive?: boolean;
  rated?: string;
  // allow admin to override slug if auto-generated one collides
  slugOverride?: string;
  // allow admin to override year when TMDb has no release_date yet
  yearOverride?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ImportBody;
    const { tmdbId } = body;

    if (!tmdbId || typeof tmdbId !== "number") {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 });
    }

    // 1. Fetch from TMDb
    const detail = await getMovieDetail(tmdbId);
    const shape = tmdbToFilmShape(detail);

    // Use yearOverride when TMDb has no release_date (year will be null)
    const filmYear = body.yearOverride ?? shape.year;
    if (!filmYear) {
      return NextResponse.json({
        error: "Validation failed",
        errors: [{
          field: "year",
          rule: "year_missing",
          message: "TMDb has no release date for this film. Please provide a Year Override in the import form.",
          severity: "error",
        }],
        warnings: [],
      }, { status: 422 });
    }

    const slug = body.slugOverride ??
      (shape.slug.includes(String(filmYear)) ? shape.slug : `${shape.slug}-${filmYear}`);

    // 1b. Validate film data before persisting
    const filmValidation = validateFilm({
      title: shape.title,
      year: filmYear,
      country: shape.country,
      genres: shape.genres,
      criticScore: body.criticScore,
      audienceScore: body.audienceScore,
      verifiedScore: body.verifiedScore,
      heatScore: body.heatScore,
      boxWeekend: body.boxWeekend,
      boxCumulative: body.boxCumulative,
      boxWeek: body.boxWeek,
      boxLive: body.boxLive,
    });

    if (!filmValidation.valid) {
      return NextResponse.json({
        error: "Validation failed",
        errors: filmValidation.errors,
        warnings: filmValidation.warnings,
      }, { status: 422 });
    }

    // Validate languages if provided
    if (body.languages && body.languages.length > 0) {
      const langValidation = validateLanguages(body.languages);
      if (!langValidation.valid) {
        return NextResponse.json({
          error: "Language validation failed",
          errors: langValidation.errors,
          warnings: langValidation.warnings,
        }, { status: 422 });
      }
    }

    // Validate availability if provided
    if (body.availability && body.availability.length > 0) {
      const availValidation = validateAvailability(body.availability);
      if (!availValidation.valid) {
        return NextResponse.json({
          error: "Availability validation failed",
          errors: availValidation.errors,
          warnings: availValidation.warnings,
        }, { status: 422 });
      }
    }

    // 2. Mirror images to R2
    const { posterUrl, backdropUrl } = await mirrorFilmImages(
      slug,
      shape.posterUrl ?? null,
      shape.backdropUrl ?? null
    );

    // 3. Upsert Film
    const film = await prisma.film.upsert({
      where: { slug },
      create: {
        slug,
        title: shape.title,
        year: filmYear,
        runtime: shape.runtime,
        rated: body.rated ?? null,
        tagline: shape.tagline,
        synopsis: shape.synopsis,
        posterUrl,
        backdropUrl,
        country: shape.country,
        genres: shape.genres,
        tmdbId: shape.tmdbId,
        imdbId: shape.imdbId,
        trailerUrl: shape.trailerUrl,
        criticScore: body.criticScore ?? null,
        audienceScore: body.audienceScore ?? null,
        verifiedScore: body.verifiedScore ?? null,
        heatScore: body.heatScore ?? null,
        boxWeekend: body.boxWeekend ? BigInt(body.boxWeekend) : null,
        boxCumulative: body.boxCumulative ? BigInt(body.boxCumulative) : null,
        boxWeek: body.boxWeek ?? null,
        boxLive: body.boxLive ?? false,
        awards: [],
      },
      update: {
        title: shape.title,
        year: filmYear,
        runtime: shape.runtime,
        tagline: shape.tagline,
        synopsis: shape.synopsis,
        posterUrl,
        backdropUrl,
        country: shape.country,
        genres: shape.genres,
        tmdbId: shape.tmdbId,
        imdbId: shape.imdbId,
        trailerUrl: shape.trailerUrl,
        ...(body.rated !== undefined && { rated: body.rated }),
        ...(body.criticScore !== undefined && { criticScore: body.criticScore }),
        ...(body.audienceScore !== undefined && { audienceScore: body.audienceScore }),
        ...(body.verifiedScore !== undefined && { verifiedScore: body.verifiedScore }),
        ...(body.heatScore !== undefined && { heatScore: body.heatScore }),
        ...(body.boxWeekend !== undefined && { boxWeekend: BigInt(body.boxWeekend) }),
        ...(body.boxCumulative !== undefined && { boxCumulative: BigInt(body.boxCumulative) }),
        ...(body.boxWeek !== undefined && { boxWeek: body.boxWeek }),
        ...(body.boxLive !== undefined && { boxLive: body.boxLive }),
      },
    });

    // 4. Cast members (recreate — simple approach)
    if (shape.cast.length > 0) {
      await prisma.castMember.deleteMany({ where: { filmId: film.id } });
      await prisma.castMember.createMany({
        data: shape.cast.map((c) => ({
          filmId: film.id,
          name: c.name,
          character: c.character || null,
        })),
      });
    }

    // 5. Crew members + credits
    const KEY_JOBS = new Set([
      "Director", "Writer", "Screenplay", "Producer", "Executive Producer",
      "Director of Photography", "Cinematographer", "Original Music Composer",
      "Editor", "Sound Designer", "Costume Designer", "Visual Effects Supervisor",
    ]);

    for (const c of shape.crew) {
      if (!KEY_JOBS.has(c.job)) continue;

      const crewSlug = c.name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");

      const isAbove = ["Director", "Writer", "Screenplay", "Producer", "Executive Producer"].includes(c.job);

      const member = await prisma.crewMember.upsert({
        where: { slug: crewSlug },
        create: {
          slug: crewSlug,
          name: c.name,
          type: isAbove ? "above" : "craft",
          roles: [c.job],
          awards: [],
          available: false,
        },
        update: {
          // append role if not already listed
          roles: { push: c.job },
        },
      });

      // CrewCredit — ignore duplicate
      await prisma.crewCredit.upsert({
        where: { filmId_crewMemberId_role: { filmId: film.id, crewMemberId: member.id, role: c.job } },
        create: { filmId: film.id, crewMemberId: member.id, role: c.job },
        update: {},
      });
    }

    // 6. Language + FilmLanguage
    const langs = body.languages ?? [
      { code: shape.originalLanguage === "yo" ? "yo"
          : shape.originalLanguage === "ig" ? "ig"
          : shape.originalLanguage === "ha" ? "ha"
          : shape.originalLanguage === "fr" ? "fr"
          : "en",
        percentage: 100 },
    ];

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

    // 7. Availability
    if (body.availability && body.availability.length > 0) {
      for (const a of body.availability) {
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
          update: {
            accessType: a.accessType,
            url: a.url ?? null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      film: {
        id: film.id,
        slug: film.slug,
        title: film.title,
        year: film.year,
        posterUrl: film.posterUrl,
      },
      imagesStoredToR2: posterUrl !== shape.posterUrl || backdropUrl !== shape.backdropUrl,
      validation: {
        warnings: filmValidation.warnings,
      },
    });
  } catch (err) {
    console.error("[/api/admin/import]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    // Surface slug conflict clearly
    if (message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A film with this slug already exists. Use slugOverride to disambiguate." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
