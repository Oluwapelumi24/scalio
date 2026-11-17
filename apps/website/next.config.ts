import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@veno/shared-types'],
  async redirects() {
    return [
      { source: "/prelaunch", destination: "/", permanent: true },
      { source: "/prelaunch/partners", destination: "/partners", permanent: true },
    ];
  },
};

export default nextConfig;
