import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Offline document fallback. Financial API routes + Supabase calls are NEVER
  // cached (network-only) — only the app shell, static assets, fonts, icons.
  fallbacks: { document: "/offline" },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: { cacheName: "brokebro-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|webp|svg|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "brokebro-images", expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 } },
      },
    ],
  },
});

export default pwa(nextConfig);
