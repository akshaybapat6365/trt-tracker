import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['html2canvas', 'jspdf'],
  webpack: (config) => {
    // Ensure proper handling of canvas-related modules
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
