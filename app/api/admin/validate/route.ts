/**
 * POST /api/admin/validate
 *
 * Dry-run validation endpoint. Send film data and receive validation results
 * without actually persisting anything.
 *
 * Body: {
 *   film: { title, year, country, ... },
 *   languages?: [{ code, percentage }],
 *   availability?: [{ countryCode, platform, accessType }],
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateFilm,
  validateLanguages,
  validateAvailability,
  type FilmInput,
  type LanguageInput,
  type AvailabilityInput,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

interface ValidateBody {
  film: FilmInput;
  languages?: LanguageInput[];
  availability?: AvailabilityInput[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ValidateBody;

    const filmResult = validateFilm(body.film);
    const langResult = body.languages
      ? validateLanguages(body.languages)
      : { valid: true, errors: [], warnings: [] };
    const availResult = body.availability
      ? validateAvailability(body.availability)
      : { valid: true, errors: [], warnings: [] };

    const allErrors = [
      ...filmResult.errors,
      ...langResult.errors,
      ...availResult.errors,
    ];
    const allWarnings = [
      ...filmResult.warnings,
      ...langResult.warnings,
      ...availResult.warnings,
    ];

    return NextResponse.json({
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      summary: {
        film: { valid: filmResult.valid, errorCount: filmResult.errors.length, warningCount: filmResult.warnings.length },
        languages: { valid: langResult.valid, errorCount: langResult.errors.length, warningCount: langResult.warnings.length },
        availability: { valid: availResult.valid, errorCount: availResult.errors.length, warningCount: availResult.warnings.length },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 }
    );
  }
}
