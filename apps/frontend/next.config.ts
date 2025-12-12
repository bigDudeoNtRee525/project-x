import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  // This creates a minimal production build with only necessary files
  output: "standalone",

  // Transpile these packages for proper resolution in monorepo
  transpilePackages: ["shared"],

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable strict mode for better debugging
  reactStrictMode: true,

  // Compress responses
  compress: true,

  // Configure allowed image domains if using next/image with external sources
  images: {
    remotePatterns: [
      // Add your image domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },
    ],
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Turbopack configuration for monorepo
  // Use process.cwd() parent for Docker compatibility
  turbopack: {
    root: process.env.TURBOPACK_ROOT || "..",
  },

  // Environment variables that should be available at build time
  // Runtime env vars (NEXT_PUBLIC_*) are automatically included
  env: {
    // Add any custom env vars here if needed
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
