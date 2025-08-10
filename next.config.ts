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
  
  // Headers to improve font loading
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
      ],
    },
  ],
};

export default nextConfig;
