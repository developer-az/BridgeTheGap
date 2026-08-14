import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/dashboard', destination: '/home', permanent: false },
      { source: '/dashboard/:path*', destination: '/home', permanent: false },
      { source: '/connections', destination: '/connect', permanent: false },
      { source: '/connections/:path*', destination: '/connect', permanent: false },
    ];
  },
};

export default nextConfig;
