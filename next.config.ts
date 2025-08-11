import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Image domains for external avatars
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      }
    ],
  },
  
  // Headers: security + caching for static assets
  headers: async () => [
    // Global small headers
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
    // Cache Next static assets aggressively
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
    // Cache public assets like svg, ico, images
    {
      source: '/:all*(svg|jpg|jpeg|png|gif|webp|ico|css|js|woff|woff2)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
      ],
    },
  ],
};

export default nextConfig;
