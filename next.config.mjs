/**
 * Shipped as Report-Only first, deliberately.
 *
 * app/layout.tsx carries two inline scripts — the JSON-LD block and the theme bootstrap that runs
 * before paint to prevent a light/dark flash — so a strict script-src would break the page. Watch
 * the violation reports, then swap the header name to Content-Security-Policy once it is quiet.
 * To drop 'unsafe-inline' later, move the theme bootstrap to a file under public/ or use a nonce.
 *
 * Fonts are self-hosted by next/font/google at build time, so no external font origin is needed.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://img.youtube.com https://i.ytimg.com https://www.google-analytics.com",
  "media-src 'self' https://res.cloudinary.com",
  "connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://www.google-analytics.com https://www.youtube.com https://vimeo.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  serverExternalPackages: ["firebase-admin"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
    ],
  },
};

// Bundle analyzer: only load when ANALYZE=true to avoid "Cannot set properties of undefined" in next dev
// Run: npm run build:analyze
let exportedConfig = nextConfig;
if (process.env.ANALYZE === "true") {
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const withBundleAnalyzer = require("@next/bundle-analyzer")({
      enabled: true,
      openAnalyzer: false,
    });
    exportedConfig = withBundleAnalyzer(nextConfig);
  } catch (e) {
    console.warn("Bundle analyzer not loaded:", e?.message || e);
  }
}

export default exportedConfig;
