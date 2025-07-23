import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Moved from experimental.serverComponentsExternalPackages as per Next.js 15 migration
  serverExternalPackages: [],
  
  // Headers para CORS si es necesario
  async headers() {
    return [
      {
        source: '/api/transcription/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
