/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.mbari.art" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "i0.wp.com" },
      { protocol: "https", hostname: "silverbirdcinemas.com" },
      { protocol: "https", hostname: "cdn.businessday.ng" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async redirects() {
    return [
      // Singular /film → plural /films directory
      { source: "/film", destination: "/films", permanent: false },
      // /event singular → /events
      { source: "/event", destination: "/events", permanent: false },
      // /language without a code → default to Yorùbá
      { source: "/language", destination: "/language/yo", permanent: false },

      // ── Dedup redirects: legacy TMDb-generated slugs → canonical seed slugs ──
      // Run: npx tsx prisma/dedup-films.ts --apply  (on any DB with dupes)
      // to remove the duplicate DB rows; these redirects handle any inbound links.
      { source: "/film/anikulapo-2022", destination: "/film/anikulapo", permanent: true },
      { source: "/film/mami-wata-2023", destination: "/film/mami-wata", permanent: true },
      { source: "/film/a-tribe-called-judah-2023", destination: "/film/a-tribe-called-judah", permanent: true },
      { source: "/film/the-black-book-2023", destination: "/film/the-black-book", permanent: true },
      { source: "/film/jagun-jagun-2023", destination: "/film/jagun-jagun", permanent: true },
      { source: "/film/lisabi-the-uprising-2024", destination: "/film/lisabi-the-uprising", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, X-API-Key",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
