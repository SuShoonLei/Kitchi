import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local-first client app: Cache Components / partialPrefetching off.
  // Nothing in this repo uses "use cache"; the previous cacheComponents flag
  // only added Suspense friction for a journal that lives in the browser.
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "0.1.0",
    NEXT_PUBLIC_GIT_SHA:
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
      process.env.NEXT_PUBLIC_GIT_SHA ??
      "dev",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
