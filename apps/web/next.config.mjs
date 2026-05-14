/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@garage-os/shared-types', '@garage-os/validation'],
  output: 'standalone',
  async rewrites() {
    const internalApiUrl = process.env.INTERNAL_API_URL ?? 'http://api:3001';

    return [
      {
        source: '/api/:path*',
        destination: `${internalApiUrl}/api/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${internalApiUrl}/socket.io/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/form',
      '@mantine/dates',
      '@mantine/notifications',
      '@mantine/modals',
      '@mantine/dropzone',
    ],
  },
};

export default nextConfig;
