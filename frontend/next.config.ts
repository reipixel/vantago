import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desativa verificação rígida de tipos no build para produção
  typescript: {
    ignoreBuildErrors: true,
  },
  // Desativa o ESLint durante o comando next build (conforme instrução do Next 16)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;