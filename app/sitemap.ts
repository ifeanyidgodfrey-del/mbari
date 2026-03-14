export const dynamic = "force-dynamic";

import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = "https://mbari.art";

  const [films, events, languages, crew] = await Promise.all([
    prisma.film.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.event.findMany({ select: { slug: true, createdAt: true } }),
    prisma.language.findMany({ select: { code: true } }),
    prisma.crewMember.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE}/events`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const filmRoutes: MetadataRoute.Sitemap = films.map((f) => ({
    url: `${BASE}/film/${f.slug}`,
    lastModified: f.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}/events/${e.slug}`,
    lastModified: e.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const langRoutes: MetadataRoute.Sitemap = languages.map((l) => ({
    url: `${BASE}/language/${l.code}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const crewRoutes: MetadataRoute.Sitemap = crew.map((c) => ({
    url: `${BASE}/crew/${c.slug}`,
    lastModified: c.createdAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...filmRoutes,
    ...eventRoutes,
    ...langRoutes,
    ...crewRoutes,
  ];
}
