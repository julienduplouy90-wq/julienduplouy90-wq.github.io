import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (Postgres WASM) doit rester un module Node natif, non bundlé.
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: { "/**": ["./db/migrations/*.sql", "./node_modules/@electric-sql/pglite/dist/**/*"] },
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Serveur autonome (Hostinger Node.js, Docker…) : `node .next/standalone/server.js`.
  output: "standalone",
  poweredByHeader: false,
  // Anciennes adresses (v0.1) → nouvelle navigation à deux espaces.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/leads", permanent: false },
      { source: "/projets", destination: "/sites", permanent: false },
      { source: "/projets/nouveau", destination: "/sites/nouveau", permanent: false },
      { source: "/projets/:id", destination: "/sites/:id", permanent: false },
      { source: "/distribution", destination: "/prospects?etape=a-attribuer", permanent: false },
      { source: "/automatisations", destination: "/reglages", permanent: false },
      { source: "/parametres", destination: "/reglages", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
