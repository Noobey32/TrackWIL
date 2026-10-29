import type { NextConfig } from "next";

// WIL documents may be up to 10 MB; the extra 1 MB leaves room for the form data around the file.
const maxRequestBodySize = "11mb";

// Security headers on every response: no framing by other sites (clickjacking), no MIME-type
// guessing, no full URLs (with mentor tokens) leaked to other sites, and no camera, microphone or
// location access.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    // Remind during `next dev` / `next build` when a security fix for Next.js is available.
    agentUpgrade: "security",
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
