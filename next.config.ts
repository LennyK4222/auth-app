import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: false, // Temporarily disable to test duplicate effect issues
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Allow LAN dev origins for Next.js dev overlay/assets
  allowedDevOrigins: ['http://192.168.1.159:3000', 'http://localhost:3000'],
  
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
} satisfies NextConfig & { allowedDevOrigins?: string[] };

export default nextConfig;
