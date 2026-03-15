/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.mbari.art" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
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
