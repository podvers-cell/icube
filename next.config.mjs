/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
