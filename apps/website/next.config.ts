import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/prelaunch", destination: "/", permanent: true },
      { source: "/prelaunch/partners", destination: "/partners", permanent: true },
    ];
  },
};

export default nextConfig;
