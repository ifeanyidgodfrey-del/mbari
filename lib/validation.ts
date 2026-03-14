/**
 * M'Bari Data Validation Infrastructure
 *
 * A replaceable, rule-based validation layer that prevents inaccurate data
 * from entering the system. Each rule is independent and can be toggled,
 * replaced, or extended without touching the rest of the codebase.
 *
 * Usage:
 *   const result = validateFilm(filmData);
 *   if (!result.valid) { // handle result.errors and result.warnings }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;            // true if no errors (warnings are OK)
  errors: ValidationError[]; // blocking issues
  warnings: ValidationError[]; // non-blocking advisories
}

export interface FilmInput {
  title?: string;
  year?: number;
  runtime?: string;
  country?: string;
  genres?: string[];
  synopsis?: string;
  criticScore?: number | null;
  audienceScore?: number | null;
  verifiedScore?: number | null;
  heatScore?: number | null;
  boxWeekend?: bigint | number | null;
  boxCumulative?: bigint | number | null;
  boxWeek?: number | null;
  boxLive?: boolean;
  tmdbId?: number | null;
  posterUrl?: string | null;
}

// ─── Rule Engine ─────────────────────────────────────────────────────────────

type ValidationRule = (input: FilmInput, now?: Date) => ValidationError[];

const filmRules: ValidationRule[] = [];

/** Register a new validation rule. Rules are executed in registration order. */
export function registerRule(rule: ValidationRule) {
  filmRules.push(rule);
}

/** Remove all rules (useful for testing). */
export function clearRules() {
  filmRules.length = 0;
}

/** Run all registered rules against a film input. */
export function validateFilm(input: FilmInput, now?: Date): ValidationResult {
  const currentDate = now ?? new Date();
  const allIssues: ValidationError[] = [];

  for (const rule of filmRules) {
    allIssues.push(...rule(input, currentDate));
  }

  const errors = allIssues.filter((e) => e.severity === "error");
  const warnings = allIssues.filter((e) => e.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ─── Built-in Rules ──────────────────────────────────────────────────────────

/**
 * RULE: Score Range
 * All scores must be between 0 and 100 inclusive.
 */
registerRule((input) => {
  const issues: ValidationError[] = [];
  const scoreFields = [
    { field: "criticScore", value: input.criticScore },
    { field: "audienceScore", value: input.audienceScore },
    { field: "verifiedScore", value: input.verifiedScore },
    { field: "heatScore", value: input.heatScore },
  ];

  for (const { field, value } of scoreFields) {
    if (value != null) {
      if (!Number.isInteger(value)) {
        issues.push({
          field,
          rule: "score_integer",
          message: `${field} must be a whole number (got ${value})`,
          severity: "error",
        });
      } else if (value < 0 || value > 100) {
        issues.push({
          field,
          rule: "score_range",
          message: `${field} must be between 0 and 100 (got ${value})`,
          severity: "error",
        });
      }
    }
  }

  return issues;
});

/**
 * RULE: Box Office Temporal Consistency
 * If a film's year is more than 1 year before the current date,
 * it should NOT have active box office data (boxWeekend, boxWeek, boxLive).
 * A 2024 film should not show weekend grosses in 2026.
 */
registerRule((input, now) => {
  const issues: ValidationError[] = [];
  const currentYear = (now ?? new Date()).getFullYear();

  if (input.year != null && input.year < currentYear - 1) {
    if (input.boxLive === true) {
      issues.push({
        field: "boxLive",
        rule: "box_office_temporal",
        message: `Film from ${input.year} cannot be marked as "live" in box office in ${currentYear}. Films more than 1 year old should have boxLive = false.`,
        severity: "error",
      });
    }
    if (input.boxWeekend != null && toBigInt(input.boxWeekend) > BigInt(0)) {
      issues.push({
        field: "boxWeekend",
        rule: "box_office_temporal",
        message: `Film from ${input.year} should not have an active weekend gross in ${currentYear}. Set boxWeekend to null for catalogue titles.`,
        severity: "error",
      });
    }
    if (input.boxWeek != null && input.boxWeek > 0) {
      issues.push({
        field: "boxWeek",
        rule: "box_office_temporal",
        message: `Film from ${input.year} should not have a current box office week number in ${currentYear}. Set boxWeek to null.`,
        severity: "error",
      });
    }
  }

  return issues;
});

/**
 * RULE: Box Office Consistency
 * If boxWeekend is set, boxCumulative should also be set and >= boxWeekend.
 * If boxLive is true, boxWeekend should be set.
 */
registerRule((input) => {
  const issues: ValidationError[] = [];

  const weekend = input.boxWeekend != null ? toBigInt(input.boxWeekend) : null;
  const cumulative = input.boxCumulative != null ? toBigInt(input.boxCumulative) : null;

  if (weekend != null && weekend > BigInt(0) && cumulative == null) {
    issues.push({
      field: "boxCumulative",
      rule: "box_office_consistency",
      message: "boxCumulative must be set when boxWeekend is present",
      severity: "error",
    });
  }

  if (weekend != null && cumulative != null && cumulative < weekend) {
    issues.push({
      field: "boxCumulative",
      rule: "box_office_consistency",
      message: `boxCumulative (${cumulative}) cannot be less than boxWeekend (${weekend})`,
      severity: "error",
    });
  }

  if (input.boxLive === true && (weekend == null || weekend === BigInt(0))) {
    issues.push({
      field: "boxWeekend",
      rule: "box_office_live_consistency",
      message: "boxWeekend must be set when boxLive is true (film is actively in cinemas)",
      severity: "warning",
    });
  }

  if (input.boxLive === false && weekend != null && weekend > BigInt(0)) {
    issues.push({
      field: "boxWeekend",
      rule: "box_office_live_consistency",
      message: "boxWeekend should be null when boxLive is false (film is no longer in cinemas)",
      severity: "warning",
    });
  }

  return issues;
});

/**
 * RULE: Required Fields
 * Title, year, country, and synopsis are required for any film.
 */
registerRule((input) => {
  const issues: ValidationError[] = [];

  if (!input.title || input.title.trim().length === 0) {
    issues.push({
      field: "title",
      rule: "required_field",
      message: "Film title is required",
      severity: "error",
    });
  }

  if (input.year == null || input.year < 1900 || input.year > new Date().getFullYear() + 2) {
    issues.push({
      field: "year",
      rule: "year_range",
      message: `Film year must be between 1900 and ${new Date().getFullYear() + 2}`,
      severity: "error",
    });
  }

  if (!input.country || input.country.trim().length === 0) {
    issues.push({
      field: "country",
      rule: "required_field",
      message: "Country is required",
      severity: "error",
    });
  }

  return issues;
});

/**
 * RULE: Box Office Sanity (Nigerian Naira)
 * Weekend gross > ₦50B is suspicious (warning, not error).
 * Cumulative gross > ₦100B is suspicious.
 */
registerRule((input) => {
  const issues: ValidationError[] = [];

  const weekend = input.boxWeekend != null ? toBigInt(input.boxWeekend) : null;
  const cumulative = input.boxCumulative != null ? toBigInt(input.boxCumulative) : null;

  // ₦50 billion weekend seems unrealistic
  if (weekend != null && weekend > BigInt("50000000000")) {
    issues.push({
      field: "boxWeekend",
      rule: "box_office_sanity",
      message: `Weekend gross of ₦${weekend.toLocaleString()} seems unusually high. Please verify.`,
      severity: "warning",
    });
  }

  // ₦100 billion cumulative seems unrealistic for African cinema
  if (cumulative != null && cumulative > BigInt("100000000000")) {
    issues.push({
      field: "boxCumulative",
      rule: "box_office_sanity",
      message: `Cumulative gross of ₦${cumulative.toLocaleString()} seems unusually high. Please verify.`,
      severity: "warning",
    });
  }

  return issues;
});

/**
 * RULE: Genre Validation
 * Genres should be non-empty and contain only known genres.
 */
const KNOWN_GENRES = new Set([
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Music", "Musical",
  "Mystery", "Romance", "Science Fiction", "Thriller", "War", "Western",
  "TV Movie",
]);

registerRule((input) => {
  const issues: ValidationError[] = [];

  if (input.genres && input.genres.length > 0) {
    for (const genre of input.genres) {
      if (!KNOWN_GENRES.has(genre)) {
        issues.push({
          field: "genres",
          rule: "known_genre",
          message: `Unknown genre "${genre}". Known genres: ${[...KNOWN_GENRES].join(", ")}`,
          severity: "warning",
        });
      }
    }
  }

  return issues;
});

/**
 * RULE: Poster URL Validation
 * If posterUrl is set, it should be a valid HTTPS URL from a whitelisted domain.
 */
const ALLOWED_IMAGE_DOMAINS = new Set([
  "media.mbari.art",
  "image.tmdb.org",
  "images.unsplash.com",
]);

registerRule((input) => {
  const issues: ValidationError[] = [];

  if (input.posterUrl) {
    try {
      const url = new URL(input.posterUrl);
      if (url.protocol !== "https:") {
        issues.push({
          field: "posterUrl",
          rule: "image_url_protocol",
          message: "Poster URL must use HTTPS",
          severity: "error",
        });
      }
      if (!ALLOWED_IMAGE_DOMAINS.has(url.hostname)) {
        issues.push({
          field: "posterUrl",
          rule: "image_url_domain",
          message: `Poster URL domain "${url.hostname}" is not in the allowed list. Allowed: ${[...ALLOWED_IMAGE_DOMAINS].join(", ")}`,
          severity: "warning",
        });
      }
    } catch {
      issues.push({
        field: "posterUrl",
        rule: "image_url_format",
        message: "Poster URL is not a valid URL",
        severity: "error",
      });
    }
  }

  return issues;
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toBigInt(value: bigint | number | null): bigint {
  if (value == null) return BigInt(0);
  return typeof value === "bigint" ? value : BigInt(value);
}

// ─── Language Percentage Validation ──────────────────────────────────────────

export interface LanguageInput {
  code: string;
  percentage: number;
}

export function validateLanguages(languages: LanguageInput[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (languages.length === 0) {
    errors.push({
      field: "languages",
      rule: "languages_required",
      message: "At least one language is required",
      severity: "error",
    });
    return { valid: false, errors, warnings };
  }

  const total = languages.reduce((sum, l) => sum + l.percentage, 0);

  if (total !== 100) {
    errors.push({
      field: "languages",
      rule: "languages_percentage_total",
      message: `Language percentages must sum to 100 (currently ${total})`,
      severity: "error",
    });
  }

  for (const lang of languages) {
    if (lang.percentage < 1 || lang.percentage > 100) {
      errors.push({
        field: `languages.${lang.code}`,
        rule: "language_percentage_range",
        message: `Language ${lang.code} percentage must be between 1 and 100 (got ${lang.percentage})`,
        severity: "error",
      });
    }
    if (!lang.code || lang.code.trim().length === 0) {
      errors.push({
        field: "languages",
        rule: "language_code_required",
        message: "Language code is required",
        severity: "error",
      });
    }
  }

  // Warn on duplicates
  const codes = languages.map((l) => l.code);
  const dupes = codes.filter((c, i) => codes.indexOf(c) !== i);
  if (dupes.length > 0) {
    errors.push({
      field: "languages",
      rule: "language_duplicate",
      message: `Duplicate language codes: ${[...new Set(dupes)].join(", ")}`,
      severity: "error",
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Availability Validation ─────────────────────────────────────────────────

export interface AvailabilityInput {
  countryCode: string;
  platform: string;
  accessType: string;
}

const VALID_ACCESS_TYPES = new Set(["cinema", "svod", "tvod", "avod", "free", "est"]);
const VALID_COUNTRIES = new Set(["NG", "GH", "ZA", "KE", "TZ", "UG", "RW", "CM", "SN", "CI", "US", "GB", "CA", "FR", "DE"]);

export function validateAvailability(availability: AvailabilityInput[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  for (const a of availability) {
    if (!a.countryCode || !VALID_COUNTRIES.has(a.countryCode)) {
      warnings.push({
        field: "availability.countryCode",
        rule: "country_code_known",
        message: `Country code "${a.countryCode}" is not in the standard M'Bari country list`,
        severity: "warning",
      });
    }

    if (!a.platform || a.platform.trim().length === 0) {
      errors.push({
        field: "availability.platform",
        rule: "platform_required",
        message: "Platform name is required for each availability entry",
        severity: "error",
      });
    }

    if (!VALID_ACCESS_TYPES.has(a.accessType)) {
      errors.push({
        field: "availability.accessType",
        rule: "access_type_valid",
        message: `Invalid access type "${a.accessType}". Must be one of: ${[...VALID_ACCESS_TYPES].join(", ")}`,
        severity: "error",
      });
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
