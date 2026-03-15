/**
 * prisma/migrate-actors.ts
 *
 * One-time migration + ongoing enrichment script:
 *  1. Groups all existing CastMember rows by actor name
 *  2. Creates one Actor record per unique name (slug-ified)
 *  3. Creates ActorCredit records linking Actor → Film (with character, order)
 *  4. Fetches Wikipedia summary + thumbnail for each actor where available
 *
 * Run locally:   npx tsx prisma/migrate-actors.ts
 * Run in CI/CD:  called from deploy.yml after seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://mbari:mbari_password@localhost:5432/mbari";
const adapter = new PrismaPg({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface WikiSummary {
  extract: string | null;
  thumbnail: string | null;
}

async function fetchWikipedia(name: string): Promise<WikiSummary> {
  try {
    const encoded = encodeURIComponent(name.replace(/ /g, "_"));
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MBari/1.0 (https://mbari.art; admin@mbari.art)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { extract: null, thumbnail: null };
    const data = (await res.json()) as {
      type?: string;
      extract?: string;
      thumbnail?: { source?: string };
    };
    // Skip disambiguation pages
    if (data.type === "disambiguation") return { extract: null, thumbnail: null };
    return {
      extract: data.extract?.slice(0, 800) ?? null,
      thumbnail: data.thumbnail?.source ?? null,
    };
  } catch {
    return { extract: null, thumbnail: null };
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("── Actor migration starting ──────────────────────────────────");

  // Fetch all cast members with their film
  const castMembers = await prisma.castMember.findMany({
    include: { film: { select: { id: true, title: true, country: true } } },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  console.log(`Found ${castMembers.length} CastMember rows`);

  // Group by name (case-insensitive)
  const byName = new Map<string, typeof castMembers>();
  for (const cm of castMembers) {
    const key = cm.name.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(cm);
  }

  console.log(`Unique actor names: ${byName.size}`);

  let created = 0;
  let enriched = 0;
  let credits = 0;

  for (const [, appearances] of byName) {
    const canonical = appearances[0]; // take display name from first occurrence
    const slug = slugify(canonical.name);

    // ── Upsert Actor ──────────────────────────────────────────────────────
    // Check if already exists (idempotent re-runs)
    const existing = await prisma.actor.findUnique({ where: { slug } });

    let actor: { id: string; bio: string | null; imageUrl: string | null };

    if (existing) {
      actor = existing;
    } else {
      // Infer nationality from most common country among their films
      const countries = appearances.map((a) => a.film.country).filter(Boolean);
      const countryCounts: Record<string, number> = {};
      for (const c of countries) countryCounts[c] = (countryCounts[c] ?? 0) + 1;
      const nationality = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      actor = await prisma.actor.create({
        data: {
          slug,
          name: canonical.name,
          nationality,
          awards: [],
        },
      });
      created++;
    }

    // ── Wikipedia enrichment (only if bio/image missing) ──────────────────
    if (!actor.bio && !actor.imageUrl) {
      const wiki = await fetchWikipedia(canonical.name);
      if (wiki.extract || wiki.thumbnail) {
        await prisma.actor.update({
          where: { slug },
          data: {
            ...(wiki.extract && { bio: wiki.extract }),
            ...(wiki.thumbnail && { imageUrl: wiki.thumbnail }),
          },
        });
        enriched++;
        console.log(`  ✓ Wikipedia: ${canonical.name}`);
      }
    }

    // ── ActorCredit rows ──────────────────────────────────────────────────
    for (let i = 0; i < appearances.length; i++) {
      const cm = appearances[i];
      await prisma.actorCredit.upsert({
        where: { filmId_actorId: { filmId: cm.filmId, actorId: actor.id } },
        create: {
          filmId: cm.filmId,
          actorId: actor.id,
          character: cm.character ?? null,
          order: i,
        },
        update: {
          character: cm.character ?? null,
        },
      });
      credits++;
    }
  }

  console.log(`\n── Done ──────────────────────────────────────────────────────`);
  console.log(`  Actors created : ${created}`);
  console.log(`  Wikipedia hits : ${enriched}`);
  console.log(`  Credits linked : ${credits}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
