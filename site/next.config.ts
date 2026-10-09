import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
  // Canonical URLs keep their trailing slash (https://mkthecoder.com/), per spec 5.4.
  trailingSlash: true,
  reactStrictMode: true,
  transpilePackages: ["geist"],
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
