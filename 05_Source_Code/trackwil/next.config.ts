import type { NextConfig } from "next";

// WIL documents may be up to 10 MB; the extra 1 MB leaves room for the form data around the file.
const maxRequestBodySize = "11mb";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: maxRequestBodySize,
    },
    // proxy.ts runs on /student routes and buffers the request body up to this size.
    proxyClientMaxBodySize: maxRequestBodySize,
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
