import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Prepara o servidor Node.js otimizado para a Hostinger
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;