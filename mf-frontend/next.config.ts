import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

// Configuração robusta e moderna do PWA
const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development', // Desativa no dev para não quebrar o Hot Reload
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

// Exporta a configuração encapsulada pelo PWA
export default withPWA(nextConfig);
