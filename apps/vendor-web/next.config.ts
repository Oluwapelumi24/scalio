import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Content studio photos go through a Server Action as base64 (resized in
      // the browser first; the backend caps them at ~5 MB of base64).
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
