import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/trt-tracker',
  images: {
    unoptimized: true,
  },
  transpilePackages: ['html2canvas', 'jspdf'],
  webpack: (config) => {
    // Ensure proper handling of canvas-related modules
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
