import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Fully dynamic per-user app (auth via cookies on every page). */
  cacheComponents: false,
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
